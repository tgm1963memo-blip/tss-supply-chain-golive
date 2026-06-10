import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';

function mapRow(row) {
  return {
    id: row.id,
    requestNo: row.request_no,
    requestDate: row.request_date,
    roomCode: row.room_code,
    productCode: row.product_code,
    productName: row.product_name,
    warehouseCode: row.warehouse_code,
    locationCode: row.location_code,
    lotNo: row.lot_no,
    qtyDelta: Number(row.qty_delta || 0),
    uom: row.uom,
    adjustmentType: row.adjustment_type,
    reason: row.reason,
    status: row.status,
    expressQueueStatus: row.express_queue_status,
    requester: row.requester,
    createdAt: row.created_at,
  };
}

export async function listStockAdjustmentRequests(filters = {}) {
  if (!isSupabaseConfigured()) return [];

  let query = supabase
    .from('sc_stock_adjustment_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(filters.limit || 100);

  if (filters.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapRow);
}

export async function createStockAdjustmentRequest(payload = {}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const row = {
    request_no: payload.requestNo || `ADJ-${Date.now()}`,
    room_code: payload.roomCode || 'TSS',
    product_code: payload.productCode,
    product_name: payload.productName || payload.productCode,
    warehouse_code: payload.warehouseCode || null,
    location_code: payload.locationCode || null,
    lot_no: payload.lotNo || null,
    qty_delta: Number(payload.qtyDelta || 0),
    uom: payload.uom || 'KG',
    adjustment_type: payload.adjustmentType || 'adjustment',
    reason: payload.reason || '',
    status: 'submitted',
    express_queue_status: 'blocked_by_governance',
    requester: payload.requester || 'Current User',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('sc_stock_adjustment_requests')
    .insert(row)
    .select('*')
    .single();

  if (error) throw error;
  return mapRow(data);
}

export { isSupabaseConfigured };
