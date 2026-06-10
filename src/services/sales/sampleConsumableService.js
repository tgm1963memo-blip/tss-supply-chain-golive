import { supabase } from '../../lib/supabaseClient.js';

function ensureSupabase() {
  if (!supabase) throw new Error('Supabase client is not configured.');
}

const REQUEST_FIELDS = [
  'request_no', 'request_date', 'customer_code', 'customer_name', 'contact_person',
  'phone', 'purpose', 'delivery_date', 'delivery_address', 'note', 'status', 'requester',
];

function pickPayload(payload) {
  const result = {};
  REQUEST_FIELDS.forEach((field) => {
    if (payload[field] !== undefined) result[field] = payload[field];
  });
  return result;
}

async function logAction(requestId, action, fromStatus, toStatus, comment) {
  const { error } = await supabase.from('sc_sample_consumable_approval_logs').insert([{
    request_id: requestId,
    action,
    from_status: fromStatus,
    to_status: toStatus,
    actor_name: 'Current User',
    comment: comment ?? null,
  }]);
  if (error) throw error;
}

export async function listSampleRequests() {
  ensureSupabase();
  const { data, error } = await supabase
    .from('sc_sample_consumable_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getSampleRequest(id) {
  ensureSupabase();
  const { data: request, error } = await supabase
    .from('sc_sample_consumable_requests')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;

  const { data: items, error: itemError } = await supabase
    .from('sc_sample_consumable_items')
    .select('*')
    .eq('request_id', id)
    .order('created_at', { ascending: true });
  if (itemError) throw itemError;

  return { ...request, items: items || [] };
}

export async function createSampleDraft(payload) {
  ensureSupabase();
  const { items, ...header } = payload;
  const { data, error } = await supabase
    .from('sc_sample_consumable_requests')
    .insert([{ ...pickPayload(header), status: 'draft' }])
    .select()
    .single();
  if (error) throw error;

  if (Array.isArray(items) && items.length) {
    await supabase.from('sc_sample_consumable_items').insert(
      items.map((item) => ({
        request_id: data.id,
        sku_code: item.sku_code || '',
        sku_name: item.sku_name || '',
        qty: Number(item.qty) || 1,
        unit: item.unit || 'กก.',
        note: item.note || '',
      })),
    );
  }

  return getSampleRequest(data.id);
}

export async function updateSampleDraft(id, payload) {
  ensureSupabase();
  const { items, ...header } = payload;
  const { error } = await supabase
    .from('sc_sample_consumable_requests')
    .update({ ...pickPayload(header), updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;

  if (Array.isArray(items)) {
    await supabase.from('sc_sample_consumable_items').delete().eq('request_id', id);
    if (items.length) {
      await supabase.from('sc_sample_consumable_items').insert(
        items.map((item) => ({
          request_id: id,
          sku_code: item.sku_code || '',
          sku_name: item.sku_name || '',
          qty: Number(item.qty) || 1,
          unit: item.unit || 'กก.',
          note: item.note || '',
        })),
      );
    }
  }

  return getSampleRequest(id);
}

async function changeStatus(id, newStatus, action, comment) {
  const current = await getSampleRequest(id);
  const fromStatus = current?.status ?? null;

  const { error } = await supabase
    .from('sc_sample_consumable_requests')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;

  await logAction(id, action, fromStatus, newStatus, comment);
  return getSampleRequest(id);
}

export async function submitSampleRequest(id, comment) {
  return changeStatus(id, 'pending', 'submitted', comment);
}

export async function approveSampleRequest(id, comment) {
  return changeStatus(id, 'approved', 'approved', comment);
}

export async function rejectSampleRequest(id, comment) {
  return changeStatus(id, 'rejected', 'rejected', comment);
}

export async function setSampleDispatchStatus(id, newStatus, comment) {
  const allowed = ['preparing', 'dispatched', 'received'];
  if (!allowed.includes(newStatus)) throw new Error(`Invalid dispatch status: ${newStatus}`);
  return changeStatus(id, newStatus, newStatus, comment);
}

export async function listSampleApprovalLogs(id) {
  ensureSupabase();
  const { data, error } = await supabase
    .from('sc_sample_consumable_approval_logs')
    .select('*')
    .eq('request_id', id)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function searchCustomersForSample(query, limit = 20) {
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

export const SAMPLE_UNITS = ['กก.', 'ถุง', 'กล่อง', 'ชิ้น', 'แพ็ค'];
