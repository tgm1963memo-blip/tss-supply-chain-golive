import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';

function mapMovementRead(row) {
  return {
    id: row.id,
    roomCode: row.room_code,
    documentNo: row.document_no,
    documentType: row.document_type,
    productCode: row.product_code,
    fromWarehouse: row.from_warehouse,
    toWarehouse: row.to_warehouse,
    qty: Number(row.qty || 0),
    status: row.status,
    syncedAt: row.synced_at,
  };
}

function mapRequest(row) {
  return {
    id: row.id,
    requestNo: row.request_no,
    requestDate: row.request_date,
    movementType: row.movement_type,
    branchCode: row.branch_code,
    customerCode: row.customer_code,
    productCode: row.product_code,
    qty: Number(row.qty || 0),
    referenceNo: row.reference_no,
    reason: row.reason,
    status: row.status,
    expressQueueStatus: row.express_queue_status,
    requester: row.requester,
    createdAt: row.created_at,
  };
}

export async function listConsignmentMovements(filters = {}) {
  if (!isSupabaseConfigured()) return [];

  let query = supabase
    .from('sc_web_consi_movement_view')
    .select('*')
    .order('synced_at', { ascending: false })
    .limit(filters.limit || 100);

  if (filters.productCode) query = query.eq('product_code', filters.productCode);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapMovementRead);
}

export async function listConsignmentMovementRequests() {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('sc_consi_movement_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRequest);
}

export async function createConsignmentMovementRequest(payload = {}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const row = {
    request_no: payload.requestNo || `CONSI-MV-${Date.now()}`,
    room_code: 'CONSI',
    movement_type: payload.movementType || 'temp_dn',
    branch_code: payload.branchCode || null,
    customer_code: payload.customerCode || null,
    product_code: payload.productCode,
    qty: Number(payload.qty || 0),
    reference_no: payload.referenceNo || null,
    reason: payload.reason || '',
    status: 'submitted',
    express_queue_status: 'blocked_by_governance',
    requester: payload.requester || 'Current User',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('sc_consi_movement_requests')
    .insert(row)
    .select('*')
    .single();
  if (error) throw error;
  return mapRequest(data);
}

export { isSupabaseConfigured };
