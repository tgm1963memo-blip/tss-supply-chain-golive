import { supabase } from '../../lib/supabaseClient.js';

function requireSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
}

function requireValue(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    throw new Error(`${fieldName} is required.`);
  }
}

async function runSelect(query) {
  requireSupabaseClient();
  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return data;
}

export async function listOutboundDocuments() {
  return runSelect(
    supabase
      .from('tgd_outbound_documents')
      .select('id, document_no, status, customer_id, source_module, source_document_id, source_document_no, requested_ship_date, created_at, updated_at')
      .order('created_at', { ascending: false }),
  );
}

export async function getOutboundDocumentDetail(documentId) {
  requireValue(documentId, 'documentId');

  const document = await runSelect(
    supabase
      .from('tgd_outbound_documents')
      .select('id, document_no, status, customer_id, source_module, source_document_id, source_document_no, requested_ship_date, created_at, updated_at')
      .eq('id', documentId)
      .single(),
  );

  const lines = await runSelect(
    supabase
      .from('tgd_outbound_lines')
      .select('id, document_id, product_id, lot_id, requested_quantity, requested_weight, picked_quantity, picked_weight, status, created_at, updated_at')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true }),
  );

  const reservations = await runSelect(
    supabase
      .from('tgd_outbound_reservations')
      .select('id, outbound_document_id, outbound_line_id, customer_id, product_id, lot_id, location_id, reserved_quantity, reserved_weight, status, released_at, created_at, updated_at')
      .eq('outbound_document_id', documentId)
      .order('created_at', { ascending: true }),
  );

  return {
    document,
    lines: lines ?? [],
    reservations: reservations ?? [],
  };
}
