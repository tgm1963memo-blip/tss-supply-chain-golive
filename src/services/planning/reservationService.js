import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';

const DEFAULT_LIMIT = 50;

function ensureSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
}

function firstValue(...values) {
  return values.find((value) => typeof value === 'string' && value.trim());
}

function normalizeSourceValue(value) {
  return String(value).trim();
}

function normalizeReservationLine(line = {}) {
  return {
    product_code: line.product_code ?? line.productCode,
    warehouse_code: line.warehouse_code ?? line.warehouseCode,
    location_code: line.location_code ?? line.locationCode,
    requested_qty: line.requested_qty ?? line.requestedQty,
  };
}

export function resolveReservationIdempotencyKey(payload = {}) {
  const explicitKey = firstValue(payload.idempotency_key, payload.idempotencyKey);
  if (explicitKey) {
    return normalizeSourceValue(explicitKey);
  }

  const roomCode = firstValue(payload.room_code, payload.roomCode);
  const sourceModule = firstValue(payload.source_module, payload.sourceModule);
  const sourceDocumentType = firstValue(
    payload.source_document_type,
    payload.sourceDocumentType,
  );
  const sourceDocumentNo = firstValue(payload.source_document_no, payload.sourceDocumentNo);

  if (roomCode && sourceModule && sourceDocumentType && sourceDocumentNo) {
    return [
      'reservation',
      normalizeSourceValue(roomCode),
      normalizeSourceValue(sourceModule),
      normalizeSourceValue(sourceDocumentType),
      normalizeSourceValue(sourceDocumentNo),
    ].join(':');
  }

  throw new Error(
    'createReservation requires idempotency_key or a full source reference: room_code, source_module, source_document_type, source_document_no.',
  );
}

function normalizeReservationPayload(payload = {}) {
  return {
    ...payload,
    room_code: payload.room_code ?? payload.roomCode,
    document_no: payload.document_no ?? payload.documentNo,
    document_type: payload.document_type ?? payload.documentType,
    source_module: payload.source_module ?? payload.sourceModule,
    source_document_type: payload.source_document_type ?? payload.sourceDocumentType,
    source_document_no: payload.source_document_no ?? payload.sourceDocumentNo,
    source_document_line_ref: payload.source_document_line_ref ?? payload.sourceDocumentLineRef,
    idempotency_key: resolveReservationIdempotencyKey(payload),
    lines: Array.isArray(payload.lines) ? payload.lines.map(normalizeReservationLine) : payload.lines,
  };
}

function mapReservationLine(row) {
  return {
    id: row.id,
    reservationId: row.reservation_id,
    roomCode: row.room_code,
    documentNo: row.document_no,
    productCode: row.product_code,
    warehouseCode: row.warehouse_code,
    locationCode: row.location_code,
    requestedQty: Number(row.requested_qty || 0),
    reservedQty: Number(row.reserved_qty || 0),
    allocatedQty: Number(row.allocated_qty || 0),
    uom: row.uom,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReservationHeader(row, lines = []) {
  return {
    id: row.id,
    roomCode: row.room_code,
    documentNo: row.document_no,
    documentType: row.document_type,
    documentId: row.document_id,
    sourceModule: row.source_module,
    sourceDocumentType: row.source_document_type,
    sourceDocumentNo: row.source_document_no,
    sourceDocumentLineRef: row.source_document_line_ref,
    customerCode: row.customer_code,
    idempotencyKey: row.idempotency_key,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lines,
  };
}

async function getReservationLinesByReservationIds(reservationIds = []) {
  if (reservationIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('sc_reservation_lines')
    .select(`
      id,
      reservation_id,
      room_code,
      document_no,
      product_code,
      warehouse_code,
      location_code,
      requested_qty,
      reserved_qty,
      allocated_qty,
      uom,
      status,
      created_at,
      updated_at
    `)
    .in('reservation_id', reservationIds)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).reduce((lineMap, row) => {
    const line = mapReservationLine(row);
    const currentLines = lineMap.get(line.reservationId) || [];
    currentLines.push(line);
    lineMap.set(line.reservationId, currentLines);
    return lineMap;
  }, new Map());
}

async function findReservationIdsByProductCode(productCode) {
  const normalizedProductCode = productCode?.trim();
  if (!normalizedProductCode) {
    return null;
  }

  const { data, error } = await supabase
    .from('sc_reservation_lines')
    .select('reservation_id')
    .ilike('product_code', `%${normalizedProductCode}%`)
    .limit(200);

  if (error) {
    throw error;
  }

  return [...new Set((data || []).map((row) => row.reservation_id).filter(Boolean))];
}

export async function listReservations(filters = {}) {
  ensureSupabaseClient();

  const productReservationIds = await findReservationIdsByProductCode(filters.productCode);
  if (productReservationIds && productReservationIds.length === 0) {
    return [];
  }

  let query = supabase
    .from('sc_reservations')
    .select(`
      id,
      room_code,
      document_no,
      document_type,
      document_id,
      source_module,
      source_document_type,
      source_document_no,
      source_document_line_ref,
      customer_code,
      idempotency_key,
      status,
      expires_at,
      created_at,
      updated_at
    `)
    .order('created_at', { ascending: false })
    .limit(filters.limit || DEFAULT_LIMIT);

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.documentNo?.trim()) {
    query = query.ilike('document_no', `%${filters.documentNo.trim()}%`);
  }

  if (productReservationIds) {
    query = query.in('id', productReservationIds);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  const reservationIds = (data || []).map((row) => row.id);
  const linesByReservationId = await getReservationLinesByReservationIds(reservationIds);

  return (data || []).map((row) => mapReservationHeader(row, linesByReservationId.get(row.id) || []));
}

export async function getReservationById(reservationId) {
  ensureSupabaseClient();

  if (!reservationId) {
    throw new Error('reservationId is required.');
  }

  const { data, error } = await supabase
    .from('sc_reservations')
    .select(`
      id,
      room_code,
      document_no,
      document_type,
      document_id,
      source_module,
      source_document_type,
      source_document_no,
      source_document_line_ref,
      customer_code,
      idempotency_key,
      status,
      expires_at,
      created_at,
      updated_at
    `)
    .eq('id', reservationId)
    .single();

  if (error) {
    throw error;
  }

  const linesByReservationId = await getReservationLinesByReservationIds([reservationId]);
  return mapReservationHeader(data, linesByReservationId.get(reservationId) || []);
}

export async function createReservation(payload) {
  ensureSupabaseClient();

  const rpcPayload = normalizeReservationPayload(payload);
  const { data, error } = await supabase.rpc('tss_create_reservation', {
    payload: rpcPayload,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function releaseReservation(reservationId) {
  ensureSupabaseClient();

  if (!reservationId) {
    throw new Error('reservationId is required.');
  }

  const { data, error } = await supabase.rpc('tss_release_reservation', {
    p_reservation_id: reservationId,
  });

  if (error) {
    throw error;
  }

  return data;
}
