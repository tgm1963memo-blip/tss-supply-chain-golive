import { supabase } from '../../lib/supabaseClient.js';

const DEFAULT_LIMIT = 100;

function ensureSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }
}

function toNumber(value) {
  return Number(value || 0);
}

function mapPickListCandidate(row) {
  return {
    roomCode: row.room_code,
    sourceModule: row.source_module,
    sourceDocumentType: row.source_document_type,
    sourceDocumentNo: row.source_document_no,
    sourceDocumentLineRef: row.source_document_line_ref,
    customerCode: row.customer_code,
    customerName: row.customer_name,
    documentDate: row.document_date,
    deliveryDate: row.delivery_date,
    productCode: row.product_code,
    requestedQty: toNumber(row.requested_qty),
    reservationId: row.reservation_id,
    reservationStatus: row.reservation_status,
    reservationLineId: row.reservation_line_id,
    reservationLineStatus: row.reservation_line_status,
    reservedWarehouseCode: row.reserved_warehouse_code,
    reservedLocationCode: row.reserved_location_code,
    warehouseCode: row.warehouse_code,
    locationCode: row.location_code,
    reservedQty: toNumber(row.reserved_qty),
    pickingLineId: row.picking_line_id || null,
    pickingSessionId: row.picking_session_id || null,
    pickingStatus: row.picking_status || null,
    pickingLineStatus: row.picking_line_status || null,
    availableQty: toNumber(row.available_qty),
    pickReadiness: row.pick_readiness,
    pickBlockReason: row.pick_block_reason,
    canCreatePickDraft: row.can_create_pick_draft,
    soCreatedAt: row.so_created_at,
    sourceUpdatedAt: row.source_updated_at,
  };
}

function applyTextFilter(query, column, value) {
  if (!value || !value.trim()) {
    return query;
  }

  return query.ilike(column, `%${value.trim()}%`);
}

export async function listPickListCandidates(filters = {}) {
  ensureSupabaseClient();

  const limit = filters.limit || DEFAULT_LIMIT;
  let query = supabase
    .from('sc_so_pick_pack_candidate_view')
    .select(`
      room_code,
      source_module,
      source_document_type,
      source_document_no,
      source_document_line_ref,
      customer_code,
      customer_name,
      document_date,
      delivery_date,
      product_code,
      requested_qty,
      reservation_id,
      reservation_status,
      reservation_line_id,
      reservation_line_status,
      reserved_warehouse_code,
      reserved_location_code,
      warehouse_code,
      location_code,
      reserved_qty,
      picking_line_id,
      picking_session_id,
      picking_status,
      picking_line_status,
      available_qty,
      pick_readiness,
      pick_block_reason,
      can_create_pick_draft,
      so_created_at,
      source_updated_at
    `)
    .order('delivery_date', { ascending: true, nullsFirst: false })
    .order('source_document_no', { ascending: true })
    .order('source_document_line_ref', { ascending: true })
    .limit(limit);

  const roomCode = filters.room_code ?? filters.roomCode;
  const sourceDocumentNo = filters.source_document_no ?? filters.sourceDocumentNo ?? filters.documentNo;
  const customerCode = filters.customer_code ?? filters.customerCode;
  const productCode = filters.product_code ?? filters.productCode;
  const pickReadiness = filters.pick_readiness ?? filters.pickReadiness;

  if (roomCode) {
    query = query.eq('room_code', roomCode);
  }

  query = applyTextFilter(query, 'source_document_no', sourceDocumentNo);
  query = applyTextFilter(query, 'customer_code', customerCode);
  query = applyTextFilter(query, 'product_code', productCode);

  if (pickReadiness) {
    query = query.eq('pick_readiness', pickReadiness);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return (data || []).map(mapPickListCandidate);
}
