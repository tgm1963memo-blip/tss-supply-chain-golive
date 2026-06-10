import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';

const WMS_LINKS = [
  { path: '/warehouse/wms/receiving', label: 'Receiving', icon: '📥' },
  { path: '/warehouse/wms/putaway', label: 'Putaway', icon: '📍' },
  { path: '/warehouse/wms/transfer', label: 'Transfer', icon: '🔁' },
  { path: '/warehouse/wms/picking-packing', label: 'Picking & Packing', icon: '📋' },
  { path: '/warehouse/wms/dispatch-goods-issue', label: 'Dispatch / GI', icon: '🚚' },
  { path: '/warehouse/wms/scan-center', label: 'Scan Center', icon: '📷' },
  { path: '/warehouse/wms/handheld', label: 'Handheld', icon: '📱' },
  { path: '/warehouse/inventory/balance', label: 'Stock Balance', icon: '📦' },
];

function buildSeedStockSummary() {
  return [
    { productCode: '10001', productName: 'ค็อกเทลซอสเซส 1000 g. (OFF)', qty: 4200, unit: 'KG' },
    { productCode: '10003', productName: 'ไส้กรอกค็อกเทล', qty: 1800, unit: 'KG' },
    { productCode: '10004', productName: 'ไส้กรอกค็อกเทลไก่', qty: 900, unit: 'KG' },
  ];
}

export async function getWmsDashboardData() {
  let stockRows = buildSeedStockSummary();
  let source = 'seed';
  let syncedAt = null;

  if (isSupabaseConfigured()) {
    try {
      const primary = await supabase
        .from('sc_rm_stock_balance')
        .select('product_code, product_name, qty_on_hand, synced_at')
        .limit(5000);

      let data = primary.data;
      let error = primary.error;

      if (error || !(data || []).length) {
        const stockView = await supabase
          .from('sc_web_stock_balance_view')
          .select('product_code, product_name, qty_on_hand, synced_at')
          .limit(5000);
        data = stockView.data;
        error = stockView.error;
      }

      if (error || !(data || []).length) {
        const fallback = await supabase
          .from('sc_inventory_balance_view')
          .select('product_code, product_name, erp_on_hand_qty, source_updated_at')
          .limit(5000);
        if (fallback.error) throw fallback.error;
        data = (fallback.data || []).map((row) => ({
          product_code: row.product_code,
          product_name: row.product_name,
          qty_on_hand: row.erp_on_hand_qty,
          synced_at: row.source_updated_at,
        }));
        error = null;
      }

      if (error) throw error;

      if ((data || []).length > 0) {
        const bySku = {};
        (data || []).forEach((row) => {
          if (!bySku[row.product_code]) {
            bySku[row.product_code] = {
              productCode: row.product_code,
              productName: row.product_name || row.product_code,
              qty: 0,
              unit: 'KG',
            };
          }
          bySku[row.product_code].qty += Number(row.qty_on_hand || 0);
          syncedAt = row.synced_at || syncedAt;
        });
        stockRows = Object.values(bySku).sort((a, b) => b.qty - a.qty);
        source = 'live';
      }
    } catch {
      stockRows = buildSeedStockSummary();
      source = 'seed';
    }
  }

  const totalQty = stockRows.reduce((s, r) => s + r.qty, 0);
  const lowStockSkus = stockRows.filter((r) => r.qty < 500).length;

  return {
    stockRows: stockRows.slice(0, 80),
    summary: {
      skuCount: stockRows.length,
      totalQty,
      lowStockSkus,
      syncedAt: syncedAt || new Date().toISOString(),
    },
    links: WMS_LINKS,
    source,
  };
}

export { isSupabaseConfigured, WMS_LINKS };
