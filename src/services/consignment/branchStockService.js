import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';
import { mockConsignment } from '../../data/mockConsignment.js';

function buildSeedBranchStock() {
  return mockConsignment.map((row) => ({
    branchCode: row.branchCode,
    branchName: row.branchName,
    customerCode: row.branchCode,
    productCode: row.sku,
    productName: row.productName,
    balanceQty: row.onHand,
    minQty: 20,
    maxQty: 300,
    status: row.status === 'Low Stock' ? 'low' : 'normal',
    lastSyncedAt: row.lastMovement,
  }));
}

function mapRow(row) {
  const balance = Number(row.balance_qty || 0);
  const min = Number(row.min_qty || 0);
  let status = 'normal';
  if (balance <= 0) status = 'empty';
  else if (min > 0 && balance < min) status = 'low';

  return {
    branchCode: row.branch_code,
    branchName: row.branch_name,
    customerCode: row.customer_code,
    productCode: row.product_code,
    productName: row.product_name,
    balanceQty: balance,
    minQty: min,
    maxQty: Number(row.max_qty || 0),
    status,
    lastSyncedAt: row.last_synced_at,
  };
}

function summarize(rows) {
  const branches = new Set(rows.map((r) => r.branchCode));
  const lowStock = rows.filter((r) => r.status === 'low').length;
  const totalValue = rows.reduce((s, r) => s + r.balanceQty * 85, 0);
  return {
    branchCount: branches.size,
    skuLines: rows.length,
    lowStockLines: lowStock,
    totalBalanceQty: rows.reduce((s, r) => s + r.balanceQty, 0),
    estimatedValue: totalValue,
  };
}

export async function getBranchStockPageData(filters = {}) {
  let rows = [];
  let source = 'empty';

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('sc_web_consi_branch_stock_view')
        .select('*')
        .limit(2000);
      if (!error && data?.length) {
        rows = data.map(mapRow);
        source = 'live';
      }
    } catch {
      rows = [];
    }
  }

  if (rows.length === 0) {
    rows = buildSeedBranchStock();
    source = rows.length ? 'seed' : 'empty';
  }

  if (filters.branchCode) {
    rows = rows.filter((r) => r.branchCode === filters.branchCode);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter(
      (r) => r.productCode.toLowerCase().includes(q)
        || (r.productName || '').toLowerCase().includes(q)
        || (r.branchName || '').toLowerCase().includes(q),
    );
  }
  if (filters.status) {
    rows = rows.filter((r) => r.status === filters.status);
  }

  const branches = [...new Set(rows.map((r) => r.branchCode))].sort();

  return {
    rows,
    summary: summarize(rows),
    branches,
    source,
  };
}

export { isSupabaseConfigured };
