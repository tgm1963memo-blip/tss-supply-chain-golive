import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';
import { listStockBalances } from './stockBalanceService.js';

function buildSeedBalanceRows() {
  return [
    {
      roomCode: 'TSS',
      productCode: '10001',
      productName: 'ค็อกเทลซอสเซส 1000 g. (OFF)',
      warehouseCode: 'WH02',
      locationCode: 'R01-A1',
      lotNo: 'LOT-2410-001',
      erpOnHandQty: 1200,
      calculatedOnHandQty: 1200,
      reservedQty: 200,
      availableQty: 1000,
      sourceUpdatedAt: new Date().toISOString(),
    },
    {
      roomCode: 'TSS',
      productCode: '10003',
      productName: 'ไส้กรอกค็อกเทลรมควันหนังกรอบ 1000 g. OFF',
      warehouseCode: 'WH02',
      locationCode: 'R01-B2',
      lotNo: 'LOT-2409-045',
      erpOnHandQty: 500,
      calculatedOnHandQty: 500,
      reservedQty: 50,
      availableQty: 450,
      sourceUpdatedAt: new Date().toISOString(),
    },
    {
      roomCode: 'TSS',
      productCode: '10004',
      productName: 'ไส้กรอกค็อกเทลไก่ 1000 g.',
      warehouseCode: 'WH01',
      locationCode: 'Q-HOLD',
      lotNo: 'LOT-2408-012',
      erpOnHandQty: 120,
      calculatedOnHandQty: 120,
      reservedQty: 120,
      availableQty: 0,
      sourceUpdatedAt: new Date().toISOString(),
    },
  ];
}

function summarizeBalances(rows) {
  const warehouses = new Set(rows.map((r) => r.warehouseCode).filter(Boolean));
  return {
    totalLines: rows.length,
    totalOnHand: rows.reduce((s, r) => s + (r.calculatedOnHandQty || r.erpOnHandQty || 0), 0),
    totalAvailable: rows.reduce((s, r) => s + (r.availableQty || 0), 0),
    totalReserved: rows.reduce((s, r) => s + (r.reservedQty || 0), 0),
    holdLines: rows.filter((r) => (r.availableQty || 0) <= 0).length,
    warehouseCount: warehouses.size,
  };
}

async function enrichWithProductNames(rows) {
  if (!isSupabaseConfigured() || rows.length === 0) return rows;

  const codes = [...new Set(rows.map((r) => r.productCode))];
  const { data } = await supabase
    .from('sc_rm_stock_balance')
    .select('product_code, product_name')
    .in('product_code', codes)
    .limit(5000);

  const names = Object.fromEntries((data || []).map((r) => [r.product_code, r.product_name]));
  if (Object.keys(names).length === 0) {
    const fallback = await supabase
      .from('sc_web_stock_balance_view')
      .select('product_code, product_name')
      .in('product_code', codes)
      .limit(5000);
    (fallback.data || []).forEach((r) => {
      names[r.product_code] = r.product_name;
    });
  }
  return rows.map((row) => ({
    ...row,
    productName: row.productName || names[row.productCode] || row.productCode,
  }));
}

export async function getStockBalancePageData(filters = {}) {
  let rows = buildSeedBalanceRows();
  let source = 'seed';

  if (isSupabaseConfigured()) {
    try {
      const live = await listStockBalances({
        roomCode: filters.roomCode,
        productCode: filters.search,
        warehouseCode: filters.warehouseCode,
        limit: filters.limit || 500,
      });
      if (live.length > 0) {
        rows = await enrichWithProductNames(live);
        source = 'live';
      }
    } catch {
      rows = buildSeedBalanceRows();
      source = 'seed';
    }
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter(
      (r) => r.productCode.toLowerCase().includes(q)
        || (r.productName || '').toLowerCase().includes(q)
        || (r.lotNo || '').toLowerCase().includes(q),
    );
  }

  if (filters.warehouseCode) {
    rows = rows.filter((r) => r.warehouseCode === filters.warehouseCode);
  }

  if (filters.onlyAvailable) {
    rows = rows.filter((r) => (r.availableQty || 0) > 0);
  }

  const warehouses = [...new Set(rows.map((r) => r.warehouseCode).filter(Boolean))].sort();

  return {
    rows,
    summary: summarizeBalances(rows),
    warehouses,
    source,
  };
}

export async function getAvailableStockData(filters = {}) {
  return getStockBalancePageData({ ...filters, onlyAvailable: true });
}

export { isSupabaseConfigured, listStockBalances };
