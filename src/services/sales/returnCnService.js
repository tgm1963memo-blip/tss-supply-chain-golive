import { supabase } from '../../lib/supabaseClient.js';

function ensureSupabase() {
  if (!supabase) throw new Error('Supabase client is not configured.');
}

const REQUEST_FIELDS = [
  'request_no', 'request_date', 'request_type', 'reason', 'customer_code', 'customer_name',
  'invoice_ref', 'stock_impact_flag', 'status', 'express_queue_status', 'requester', 'internal_note',
];

function pickPayload(payload) {
  const result = {};
  REQUEST_FIELDS.forEach((field) => {
    if (payload[field] !== undefined) result[field] = payload[field];
  });
  return result;
}

async function logAction(requestId, action, fromStatus, toStatus, comment) {
  const { error } = await supabase.from('sc_return_cn_approval_logs').insert([{
    request_id: requestId,
    action,
    from_status: fromStatus,
    to_status: toStatus,
    actor_name: 'Current User',
    comment: comment ?? null,
  }]);
  if (error) throw error;
}

export async function listReturnCnRequests() {
  ensureSupabase();
  const { data, error } = await supabase
    .from('sc_return_cn_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getReturnCnRequest(id) {
  ensureSupabase();
  const { data: request, error } = await supabase
    .from('sc_return_cn_requests')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;

  const { data: lines, error: lineError } = await supabase
    .from('sc_return_cn_lines')
    .select('*')
    .eq('request_id', id)
    .order('created_at', { ascending: true });
  if (lineError) throw lineError;

  return { ...request, lines: lines || [] };
}

export async function createReturnCnDraft(payload) {
  ensureSupabase();
  const { lines, ...header } = payload;
  const { data, error } = await supabase
    .from('sc_return_cn_requests')
    .insert([{
      ...pickPayload(header),
      status: 'draft',
      express_queue_status: 'blocked_by_governance',
    }])
    .select()
    .single();
  if (error) throw error;

  if (Array.isArray(lines) && lines.length) {
    await supabase.from('sc_return_cn_lines').insert(
      lines.map((line) => ({
        request_id: data.id,
        product_code: line.product_code || '',
        product_name: line.product_name || '',
        qty: Number(line.qty) || 0,
        unit: line.unit || 'กก.',
        lot_no: line.lot_no || '',
        line_reason: line.line_reason || '',
      })),
    );
  }

  return getReturnCnRequest(data.id);
}

export async function updateReturnCnDraft(id, payload) {
  ensureSupabase();
  const { lines, ...header } = payload;
  const { error } = await supabase
    .from('sc_return_cn_requests')
    .update({ ...pickPayload(header), updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;

  if (Array.isArray(lines)) {
    await supabase.from('sc_return_cn_lines').delete().eq('request_id', id);
    if (lines.length) {
      await supabase.from('sc_return_cn_lines').insert(
        lines.map((line) => ({
          request_id: id,
          product_code: line.product_code || '',
          product_name: line.product_name || '',
          qty: Number(line.qty) || 0,
          unit: line.unit || 'กก.',
          lot_no: line.lot_no || '',
          line_reason: line.line_reason || '',
        })),
      );
    }
  }

  return getReturnCnRequest(id);
}

async function changeStatus(id, newStatus, action, comment) {
  const current = await getReturnCnRequest(id);
  const fromStatus = current?.status ?? null;

  const { error } = await supabase
    .from('sc_return_cn_requests')
    .update({
      status: newStatus,
      express_queue_status: 'blocked_by_governance',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;

  await logAction(id, action, fromStatus, newStatus, comment);
  return getReturnCnRequest(id);
}

export async function submitReturnCn(id, comment) {
  return changeStatus(id, 'submitted', 'submitted', comment);
}

export async function approveReturnCn(id, comment) {
  return changeStatus(id, 'approved', 'approved', comment);
}

export async function rejectReturnCn(id, comment) {
  return changeStatus(id, 'rejected', 'rejected', comment);
}

export async function requestReturnCnRevision(id, comment) {
  return changeStatus(id, 'revision_requested', 'revision_requested', comment);
}

export async function listReturnCnApprovalLogs(id) {
  ensureSupabase();
  const { data, error } = await supabase
    .from('sc_return_cn_approval_logs')
    .select('*')
    .eq('request_id', id)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function searchCustomersForReturn(query, limit = 20) {
  ensureSupabase();
  const q = (query || '').trim();
  if (!q) return [];
  const pattern = `%${q}%`;

  const { data: compactData, error: compactError } = await supabase
    .from('sc_rm_customer_master')
    .select('customer_code, customer_name')
    .or(`customer_code.ilike.${pattern},customer_name.ilike.${pattern}`)
    .limit(limit);
  if (!compactError && compactData?.length) return compactData;

  const { data, error } = await supabase
    .from('sc_web_customer_master_view')
    .select('customer_code, customer_name')
    .or(`customer_code.ilike.${pattern},customer_name.ilike.${pattern}`)
    .limit(limit);
  if (error) throw error;
  return data || [];
}
