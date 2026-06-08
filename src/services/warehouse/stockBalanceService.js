import { supabase } from '../../lib/supabaseClient.js';

export async function listStockBalances(filters = {}) {
  if (!supabase) {
    console.error('Supabase client is not configured.');
    return [];
  }

  let query = supabase
    .from('sc_inventory_balance_view')
    .select(`
      room_code,
      product_code,
      warehouse_code,
      location_code,
      lot_no,
      erp_on_hand_qty,
      ledger_delta_qty,
      calculated_on_hand_qty,
      reserved_qty,
      available_qty,
      future_supply_qty,
      source_updated_at
    `)
    .limit(filters.limit || 500);

  if (filters.roomCode) {
    query = query.eq('room_code', filters.roomCode);
  }
  if (filters.productCode) {
    query = query.ilike('product_code', `%${filters.productCode}%`);
  }
  if (filters.warehouseCode) {
    query = query.eq('warehouse_code', filters.warehouseCode);
  }
  if (filters.locationCode) {
    query = query.eq('location_code', filters.locationCode);
  }

  if (filters.onlyAvailable) {
    query = query.gt('available_qty', 0);
  }

  if (filters.onlyShortStock) {
    query = query.lte('available_qty', 0);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching stock balances:', error);
    return [];
  }

  return data.map((row) => ({
    roomCode: row.room_code,
    productCode: row.product_code,
    warehouseCode: row.warehouse_code,
    locationCode: row.location_code,
    lotNo: row.lot_no,
    erpOnHandQty: Number(row.erp_on_hand_qty || 0),
    ledgerDeltaQty: Number(row.ledger_delta_qty || 0),
    calculatedOnHandQty: Number(row.calculated_on_hand_qty || 0),
    reservedQty: Number(row.reserved_qty || 0),
    availableQty: Number(row.available_qty || 0),
    futureSupplyQty: Number(row.future_supply_qty || 0),
    sourceUpdatedAt: row.source_updated_at,
  }));
}
