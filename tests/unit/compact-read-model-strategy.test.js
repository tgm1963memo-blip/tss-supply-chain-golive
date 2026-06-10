/**
 * Compact read model strategy — migration, services, local mirror, safety checks.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(testDir, '../..');

function readProjectFile(relativePath) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

const serviceSources = {
  productMaster: readProjectFile('src/services/master-data/productMasterService.js'),
  skuAdmin: readProjectFile('src/services/master-data/skuAdminService.js'),
  customerRegistration: readProjectFile('src/services/sales/customerRegistrationService.js'),
  salesOverview: readProjectFile('src/services/sales/salesOverviewService.js'),
  stockBalance: readProjectFile('src/services/warehouse/stockBalanceService.js'),
  wmsDashboard: readProjectFile('src/services/warehouse/wmsDashboardService.js'),
  availableStock: readProjectFile('src/services/warehouse/availableStockService.js'),
  branchStock: readProjectFile('src/services/consignment/branchStockService.js'),
  atpWorkbench: readProjectFile('src/services/planning/atpWorkbenchService.js'),
  returnCn: readProjectFile('src/services/sales/returnCnService.js'),
  sampleConsumable: readProjectFile('src/services/sales/sampleConsumableService.js'),
  supabaseClient: readProjectFile('src/lib/supabaseClient.js'),
};

const localMirrorScripts = [
  'scripts/local-mirror/local_mirror_config.py',
  'scripts/local-mirror/local_mirror_db.py',
  'scripts/local-mirror/sync_express_to_local_mirror.py',
  'scripts/local-mirror/build_read_models_from_local.py',
  'scripts/local-mirror/push_read_models_to_supabase.py',
  'scripts/local-mirror/run_local_mirror_pipeline.py',
  'scripts/local-mirror/README.md',
];

describe('compact read model migration 013', () => {
  it('migration file exists with sc_rm_* tables', () => {
    const migration = readProjectFile('supabase/migrations/013_compact_read_model_strategy.sql');
    expect(migration).toMatch(/sc_rm_product_master/);
    expect(migration).toMatch(/sc_rm_customer_master/);
    expect(migration).toMatch(/sc_rm_stock_balance/);
    expect(migration).toMatch(/sc_rm_open_so_headers/);
    expect(migration).toMatch(/sc_rm_open_so_lines/);
    expect(migration).toMatch(/sc_rm_sales_daily_summary/);
    expect(migration).toMatch(/sc_rm_sales_monthly_summary/);
    expect(migration).toMatch(/sc_rm_consi_branch_stock/);
    expect(migration).toMatch(/sc_rm_sync_health/);
    expect(migration).toMatch(/for select to anon, authenticated/);
  });
});

describe('frontend services prefer sc_rm_* read models', () => {
  it('productMasterService prefers sc_rm_product_master', () => {
    const idx = serviceSources.productMaster.indexOf("from('sc_rm_product_master')");
    const viewIdx = serviceSources.productMaster.indexOf("from('sc_web_product_master_view')");
    expect(idx).toBeGreaterThan(-1);
    expect(idx).toBeLessThan(viewIdx);
  });

  it('skuAdminService prefers sc_rm_product_master', () => {
    expect(serviceSources.skuAdmin).toMatch(/sc_rm_product_master/);
  });

  it('customerRegistrationService prefers sc_rm_customer_master', () => {
    const idx = serviceSources.customerRegistration.indexOf("from('sc_rm_customer_master')");
    const viewIdx = serviceSources.customerRegistration.indexOf("from('sc_web_customer_master_view')");
    expect(idx).toBeGreaterThan(-1);
    expect(idx).toBeLessThan(viewIdx);
  });

  it('salesOverviewService prefers sc_rm_sales_daily_summary over raw invoices', () => {
    const dailyIdx = serviceSources.salesOverview.indexOf("from('sc_rm_sales_daily_summary')");
    const invoiceIdx = serviceSources.salesOverview.indexOf("from('sc_express_invoices')");
    expect(dailyIdx).toBeGreaterThan(-1);
    expect(dailyIdx).toBeLessThan(invoiceIdx);
    expect(serviceSources.salesOverview).toMatch(/sc_rm_sales_monthly_summary/);
  });

  it('stockBalanceService prefers sc_rm_stock_balance', () => {
    const compactIdx = serviceSources.stockBalance.indexOf("from('sc_rm_stock_balance')");
    const viewIdx = serviceSources.stockBalance.indexOf("from('sc_inventory_balance_view')");
    expect(compactIdx).toBeGreaterThan(-1);
    expect(compactIdx).toBeLessThan(viewIdx);
  });

  it('wmsDashboardService references sc_rm_stock_balance', () => {
    expect(serviceSources.wmsDashboard).toMatch(/sc_rm_stock_balance/);
  });

  it('availableStockService references sc_rm_stock_balance', () => {
    expect(serviceSources.availableStock).toMatch(/sc_rm_stock_balance/);
  });

  it('branchStockService prefers sc_rm_consi_branch_stock', () => {
    const compactIdx = serviceSources.branchStock.indexOf("from('sc_rm_consi_branch_stock')");
    const viewIdx = serviceSources.branchStock.indexOf("from('sc_web_consi_branch_stock_view')");
    expect(compactIdx).toBeGreaterThan(-1);
    expect(compactIdx).toBeLessThan(viewIdx);
  });

  it('atpWorkbenchService references sc_rm_stock_balance and sc_rm_open_so_lines', () => {
    expect(serviceSources.atpWorkbench).toMatch(/sc_rm_stock_balance/);
    expect(serviceSources.atpWorkbench).toMatch(/sc_rm_open_so_lines/);
  });

  it('returnCn and sampleConsumable customer search use sc_rm_customer_master', () => {
    expect(serviceSources.returnCn).toMatch(/sc_rm_customer_master/);
    expect(serviceSources.sampleConsumable).toMatch(/sc_rm_customer_master/);
  });
});

describe('local mirror foundation', () => {
  it('local mirror scripts exist', () => {
    localMirrorScripts.forEach((path) => {
      expect(existsSync(join(projectRoot, path)), `missing ${path}`).toBe(true);
    });
  });

  it('.gitignore excludes local mirror data, logs, cache, db files', () => {
    const gitignore = readProjectFile('.gitignore');
    expect(gitignore).toMatch(/scripts\/local-mirror\/data\//);
    expect(gitignore).toMatch(/scripts\/local-mirror\/logs\//);
    expect(gitignore).toMatch(/scripts\/local-mirror\/cache\//);
    expect(gitignore).toMatch(/\*\.duckdb/);
    expect(gitignore).toMatch(/\*\.sqlite/);
  });

  it('sync script enforces read-only mode', () => {
    const syncScript = readProjectFile('scripts/local-mirror/sync_express_to_local_mirror.py');
    expect(syncScript).toMatch(/READONLY_MODE/);
    expect(syncScript).toMatch(/read-only/i);
  });

  it('push script uses service role key in backend only', () => {
    const pushScript = readProjectFile('scripts/local-mirror/push_read_models_to_supabase.py');
    expect(pushScript).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(pushScript).not.toMatch(/VITE_SUPABASE_ANON_KEY/);
  });
});

describe('frontend safety', () => {
  it('supabaseClient does not use service role key', () => {
    expect(serviceSources.supabaseClient).not.toMatch(/SERVICE_ROLE/i);
    expect(serviceSources.supabaseClient).toMatch(/VITE_SUPABASE_ANON_KEY/);
  });

  it('express table mapping stays read-only (no write-back)', () => {
    const mapping = readProjectFile('scripts/express-readonly-sync/express_table_mapping.py');
    expect(mapping).toMatch(/READONLY_MODE\s*=\s*True/);
  });
});

describe('cleanup plan document', () => {
  it('docs/27 cleanup plan exists', () => {
    expect(existsSync(join(projectRoot, 'docs/27_SUPABASE_COMPACT_READ_MODEL_CLEANUP_PLAN.md'))).toBe(true);
    const doc = readProjectFile('docs/27_SUPABASE_COMPACT_READ_MODEL_CLEANUP_PLAN.md');
    expect(doc).toMatch(/Tables to preserve/);
    expect(doc).toMatch(/TRUNCATE TABLE sc_express_invoices/);
    expect(doc).toMatch(/Rollback/);
  });
});
