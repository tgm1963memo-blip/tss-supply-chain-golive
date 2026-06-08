import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';

const DEFAULT_LIMIT = 100;

function ensureSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
}

function mapSalesOrderReservationCandidate(row) {
  return {
    roomCode: row.room_code,
    sourceModule: row.source_module,
    sourceDocumentType: row.source_document_type,
    sourceDocumentNo: row.source_document_no,
    sourceDocumentLineRef: row.source_document_line_ref,
    documentNo: row.document_no,
    lineNo: row.line_no,
    customerCode: row.customer_code,
    documentDate: row.document_date,
    deliveryDate: row.delivery_date,
    documentStatus: row.document_status,
    lineStatus: row.line_status,
    productCode: row.product_code,
    orderedQty: Number(row.ordered_qty || 0),
    candidateRequestedQty: Number(row.candidate_requested_qty || 0),
    warehouseCode: row.warehouse_code,
    locationCode: row.location_code,
    reservationId: row.reservation_id,
    reservationStatus: row.reservation_status,
    reservationExists: Boolean(row.reservation_exists),
    idempotencyKeyPreview: row.idempotency_key_preview,
  };
}

export async function listSalesOrderReservationCandidates(filters = {}) {
  ensureSupabaseClient();

  const limit = filters.limit || DEFAULT_LIMIT;
  let query = supabase
    .from('sc_so_reservation_candidate_view')
    .select(`
      room_code,
      source_module,
      source_document_type,
      source_document_no,
      source_document_line_ref,
      document_no,
      line_no,
      customer_code,
      document_date,
      delivery_date,
      document_status,
      line_status,
      product_code,
      ordered_qty,
      candidate_requested_qty,
      warehouse_code,
      location_code,
      reservation_id,
      reservation_status,
      reservation_exists,
      idempotency_key_preview
    `)
    .order('document_date', { ascending: false, nullsFirst: false })
    .order('document_no', { ascending: true })
    .order('line_no', { ascending: true })
    .limit(limit);

  const roomCode = filters.room_code ?? filters.roomCode;
  const documentNo = filters.document_no ?? filters.documentNo;
  const productCode = filters.product_code ?? filters.productCode;
  const customerCode = filters.customer_code ?? filters.customerCode;
  const reservationExists = filters.reservation_exists ?? filters.reservationExists;

  if (roomCode) query = query.eq('room_code', roomCode);
  if (documentNo) query = query.ilike('document_no', `%${documentNo.trim()}%`);
  if (productCode) query = query.ilike('product_code', `%${productCode.trim()}%`);
  if (customerCode) query = query.ilike('customer_code', `%${customerCode.trim()}%`);
  if (typeof reservationExists === 'boolean') query = query.eq('reservation_exists', reservationExists);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(mapSalesOrderReservationCandidate);
}

export async function getSalesOrderLines(documentNo, filters = {}) {
  return listSalesOrderReservationCandidates({
    ...filters,
    documentNo,
    limit: filters.limit || 500,
  });
}

function mapSalesOrderFulfillmentLocationCandidate(row) {
  return {
    roomCode: row.room_code,
    sourceModule: row.source_module,
    sourceDocumentType: row.source_document_type,
    sourceDocumentNo: row.source_document_no,
    sourceDocumentLineRef: row.source_document_line_ref,
    documentNo: row.document_no,
    lineNo: row.line_no,
    customerCode: row.customer_code,
    documentDate: row.document_date,
    deliveryDate: row.delivery_date,
    productCode: row.product_code,
    candidateRequestedQty: Number(row.candidate_requested_qty || 0),
    warehouseCode: row.warehouse_code,
    locationCode: row.location_code,
    totalAvailableQty: Number(row.total_available_qty || 0),
    canReserve: Boolean(row.can_reserve),
    shortageQty: Number(row.shortage_qty || 0),
    reservationExists: Boolean(row.reservation_exists),
    reservationStatus: row.reservation_status,
    idempotencyKeyPreview: row.idempotency_key_preview,
  };
}

export async function listSalesOrderFulfillmentLocationCandidates(filters = {}) {
  ensureSupabaseClient();

  const limit = filters.limit || DEFAULT_LIMIT;
  let query = supabase
    .from('sc_so_reservation_fulfillment_location_candidate_view')
    .select(`
      room_code,
      source_module,
      source_document_type,
      source_document_no,
      source_document_line_ref,
      document_no,
      line_no,
      customer_code,
      document_date,
      delivery_date,
      product_code,
      candidate_requested_qty,
      warehouse_code,
      location_code,
      total_available_qty,
      can_reserve,
      shortage_qty,
      reservation_exists,
      reservation_status,
      idempotency_key_preview
    `)
    .order('document_date', { ascending: false, nullsFirst: false })
    .order('document_no', { ascending: true })
    .order('line_no', { ascending: true })
    .order('can_reserve', { ascending: false })
    .order('total_available_qty', { ascending: false })
    .limit(limit);

  const roomCode = filters.room_code ?? filters.roomCode;
  const documentNo = filters.document_no ?? filters.documentNo;
  const productCode = filters.product_code ?? filters.productCode;
  const customerCode = filters.customer_code ?? filters.customerCode;
  const warehouseCode = filters.warehouse_code ?? filters.warehouseCode;
  const locationCode = filters.location_code ?? filters.locationCode;
  const canReserve = filters.can_reserve ?? filters.canReserve;
  const reservationExists = filters.reservation_exists ?? filters.reservationExists;

  if (roomCode) query = query.eq('room_code', roomCode);
  if (documentNo) query = query.ilike('document_no', `%${documentNo.trim()}%`);
  if (productCode) query = query.ilike('product_code', `%${productCode.trim()}%`);
  if (customerCode) query = query.ilike('customer_code', `%${customerCode.trim()}%`);
  if (warehouseCode) query = query.ilike('warehouse_code', `%${warehouseCode.trim()}%`);
  if (locationCode) query = query.ilike('location_code', `%${locationCode.trim()}%`);
  if (typeof canReserve === 'boolean') query = query.eq('can_reserve', canReserve);
  if (typeof reservationExists === 'boolean') query = query.eq('reservation_exists', reservationExists);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(mapSalesOrderFulfillmentLocationCandidate);
}

export { isSupabaseConfigured };
