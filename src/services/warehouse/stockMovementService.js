import { supabase } from '../../lib/supabaseClient.js';

export async function listStockMovements(filters = {}) {
  if (!supabase) {
    console.error('Supabase client is not configured.');
    return [];
  }

  let query = supabase
    .from('sc_inventory_ledger')
    .select(`
      id,
      room_code,
      document_no,
      document_type,
      movement_type,
      product_code,
      warehouse_code,
      location_code,
      lot_no,
      qty,
      uom,
      status,
      reference_id,
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(filters.limit || 100);

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
  if (filters.movementType) {
    query = query.eq('movement_type', filters.movementType);
  }
  if (filters.documentNo) {
    query = query.ilike('document_no', `%${filters.documentNo}%`);
  }
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters.endDate) {
    const end = new Date(filters.endDate);
    end.setDate(end.getDate() + 1);
    query = query.lt('created_at', end.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching stock movements:', error);
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    roomCode: row.room_code,
    documentNo: row.document_no,
    documentType: row.document_type,
    movementType: row.movement_type,
    productCode: row.product_code,
    warehouseCode: row.warehouse_code,
    locationCode: row.location_code,
    lotNo: row.lot_no,
    qty: row.qty,
    uom: row.uom,
    status: row.status,
    referenceId: row.reference_id,
    createdAt: row.created_at,
  }));
}
