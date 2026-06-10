import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';
import { LEGACY_SKUS } from '../../features/sales/forecast/legacyForecastData.js';

function buildSeedAtpRows() {
  return [
    {
      productCode: '10001',
      productName: LEGACY_SKUS[0].name,
      productGroup: 'Finished Goods',
      onHandQty: 4200,
      reservedQty: 600,
      incomingPoQty: 500,
      atpQty: 3600,
      openSoQty: 800,
      status: 'available',
    },
    {
      productCode: '10003',
      productName: LEGACY_SKUS[1].name,
      productGroup: 'Finished Goods',
      onHandQty: 1800,
      reservedQty: 1200,
      incomingPoQty: 0,
      atpQty: 600,
      openSoQty: 900,
      status: 'low',
    },
    {
      productCode: '10004',
      productName: LEGACY_SKUS[2].name,
      productGroup: 'Finished Goods',
      onHandQty: 120,
      reservedQty: 120,
      incomingPoQty: 0,
      atpQty: 0,
      openSoQty: 450,
      status: 'stockout',
    },
  ];
}

function deriveStatus(atpQty, onHandQty, reservedQty) {
  if (atpQty <= 0 && onHandQty <= reservedQty) return 'stockout';
  if (atpQty < onHandQty * 0.2) return 'low';
  return 'available';
}

export async function getAtpWorkbenchData(filters = {}) {
  if (!isSupabaseConfigured()) {
    return { rows: buildSeedAtpRows(), summary: summarize(buildSeedAtpRows()), source: 'seed' };
  }

  try {
    let [atpRes, shortageRes, reservationRes] = await Promise.all([
      supabase
        .from('sc_web_atp_view')
        .select('room_code, product_code, product_name, product_group, on_hand_qty, atp_qty')
        .limit(5000),
      supabase
        .from('sc_web_shortage_view')
        .select('product_code, open_so_qty')
        .limit(5000),
      supabase
        .from('sc_reservation_lines')
        .select('product_code, reserved_qty, status')
        .eq('status', 'active')
        .limit(5000),
    ]);

    if (atpRes.error || !(atpRes.data || []).length) {
      const inventoryRes = await supabase
        .from('sc_inventory_balance_view')
        .select('room_code, product_code, product_name, erp_on_hand_qty')
        .limit(5000);
      if (inventoryRes.error) throw inventoryRes.error;
      atpRes = {
        data: (inventoryRes.data || []).map((row) => ({
          room_code: row.room_code,
          product_code: row.product_code,
          product_name: row.product_name,
          product_group: '',
          on_hand_qty: row.erp_on_hand_qty,
          atp_qty: row.erp_on_hand_qty,
        })),
        error: null,
      };
    } else if (atpRes.error) {
      throw atpRes.error;
    }

    const openSoBySku = (shortageRes.data || []).reduce((acc, row) => {
      acc[row.product_code] = (acc[row.product_code] || 0) + Number(row.open_so_qty || 0);
      return acc;
    }, {});

    const reservedBySku = (reservationRes.data || []).reduce((acc, row) => {
      acc[row.product_code] = (acc[row.product_code] || 0) + Number(row.reserved_qty || 0);
      return acc;
    }, {});

    const bySku = {};
    (atpRes.data || []).forEach((row) => {
      const code = row.product_code;
      if (!code) return;
      if (!bySku[code]) {
        bySku[code] = {
          productCode: code,
          productName: row.product_name || code,
          productGroup: row.product_group || '',
          onHandQty: 0,
          atpQty: 0,
        };
      }
      bySku[code].onHandQty += Number(row.on_hand_qty || 0);
      bySku[code].atpQty += Number(row.atp_qty || 0);
    });

    let rows = Object.values(bySku).map((row) => {
      const reservedQty = reservedBySku[row.productCode] || 0;
      const atpQty = Math.max(row.onHandQty - reservedQty, 0);
      return {
        ...row,
        reservedQty,
        incomingPoQty: 0,
        atpQty,
        openSoQty: openSoBySku[row.productCode] || 0,
        status: deriveStatus(atpQty, row.onHandQty, reservedQty),
      };
    });

    if (filters.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter(
        (r) => r.productCode.toLowerCase().includes(q)
          || (r.productName || '').toLowerCase().includes(q),
      );
    }

    if (filters.productGroup) {
      rows = rows.filter((r) => r.productGroup === filters.productGroup);
    }

    rows.sort((a, b) => a.productCode.localeCompare(b.productCode));

    return { rows, summary: summarize(rows), source: 'live' };
  } catch {
    const seed = buildSeedAtpRows();
    return { rows: seed, summary: summarize(seed), source: 'seed' };
  }
}

function summarize(rows) {
  return {
    totalOnHand: rows.reduce((s, r) => s + r.onHandQty, 0),
    totalReserved: rows.reduce((s, r) => s + r.reservedQty, 0),
    totalAtp: rows.reduce((s, r) => s + r.atpQty, 0),
    totalIncomingPo: rows.reduce((s, r) => s + r.incomingPoQty, 0),
    stockoutCount: rows.filter((r) => r.status === 'stockout').length,
    lowCount: rows.filter((r) => r.status === 'low').length,
  };
}

export { isSupabaseConfigured };
