import { supabase } from '../../lib/supabaseClient.js';

function ensureSupabase() {
  if (!supabase) throw new Error('Supabase client is not configured.');
}

const REQUEST_FIELDS = [
  'request_no', 'request_date', 'requester', 'salesperson', 'request_type', 'status',
  'customer_code_requested', 'customer_name_th', 'customer_name_en', 'corporate_group',
  'customer_category', 'channel', 'contact_person', 'phone', 'email', 'line_id',
  'tax_id', 'branch_no', 'billing_address', 'province', 'district', 'subdistrict', 'postal_code',
  'tax_invoice_name', 'branch_name', 'delivery_name', 'delivery_address', 'delivery_province',
  'delivery_contact', 'delivery_phone', 'gps_map_link', 'credit_term', 'credit_limit_requested',
  'payment_method', 'price_tier', 'gp_discount_condition', 'billing_cycle', 'collection_method',
  'remark', 'attachments_notes', 'doc_business_registration', 'doc_tax_certificate',
  'doc_storefront_photo', 'doc_map_location', 'doc_other', 'internal_note', 'drive_link',
];

const APPROVAL_LOG_SELECT = [
  'id',
  'request_id',
  'action',
  'from_status',
  'to_status',
  'actor_user_id',
  'actor_name',
  'action_by',
  'comment',
  'metadata',
  'created_at',
].join(',');

function pickPayload(payload) {
  const result = {};
  REQUEST_FIELDS.forEach((field) => {
    if (payload[field] !== undefined) result[field] = payload[field];
  });
  return result;
}

function normalizeNumericFields(payload) {
  const next = { ...payload };
  if (next.credit_limit_requested === '' || next.credit_limit_requested === null) {
    next.credit_limit_requested = null;
  } else {
    next.credit_limit_requested = Number(next.credit_limit_requested);
  }
  return next;
}

export function normalizeApprovalLog(log) {
  if (!log) return log;
  return {
    ...log,
    actor_name: log.actor_name || log.action_by || 'Current User',
    from_status: log.from_status ?? null,
    to_status: log.to_status ?? log.action ?? null,
    comment: log.comment ?? '',
  };
}

export async function listCustomerRegistrationRequests() {
  ensureSupabase();
  const { data, error } = await supabase
    .from('sc_customer_registration_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getCustomerRegistrationRequest(id) {
  ensureSupabase();
  const { data: request, error } = await supabase
    .from('sc_customer_registration_requests')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;

  const { data: branches, error: branchError } = await supabase
    .from('sc_customer_registration_branches')
    .select('*')
    .eq('request_id', id)
    .order('created_at', { ascending: true });
  if (branchError) throw branchError;

  return { ...request, branches: branches || [] };
}

export async function createCustomerRegistrationDraft(payload) {
  ensureSupabase();
  const { data, error } = await supabase
    .from('sc_customer_registration_requests')
    .insert([{ ...pickPayload(normalizeNumericFields(payload)), status: 'draft' }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCustomerRegistrationDraft(id, payload) {
  ensureSupabase();
  const { branches, ...requestPayload } = payload;
  const { data, error } = await supabase
    .from('sc_customer_registration_requests')
    .update({
      ...pickPayload(normalizeNumericFields(requestPayload)),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  if (Array.isArray(branches)) {
    await supabase.from('sc_customer_registration_branches').delete().eq('request_id', id);
    if (branches.length) {
      const branchRows = branches.map((branch) => ({
        request_id: id,
        branch_name: branch.branch_name || '',
        delivery_name: branch.delivery_name || '',
        branch_address: branch.branch_address || branch.delivery_address || '',
        province: branch.province || branch.delivery_province || '',
        delivery_province: branch.delivery_province || branch.province || '',
        contact_person: branch.contact_person || branch.delivery_contact || '',
        delivery_contact: branch.delivery_contact || branch.contact_person || '',
        phone: branch.phone || branch.delivery_phone || '',
        delivery_phone: branch.delivery_phone || branch.phone || '',
        gps_map_link: branch.gps_map_link || '',
      }));
      await supabase.from('sc_customer_registration_branches').insert(branchRows);
    }
  }

  return getCustomerRegistrationRequest(id);
}

async function logApprovalAction(requestId, action, fromStatus, toStatus, comment) {
  const row = {
    request_id: requestId,
    action,
    from_status: fromStatus ?? null,
    to_status: toStatus ?? null,
    actor_name: 'Current User',
    comment: comment ?? null,
    metadata: {},
  };

  const { error } = await supabase.from('sc_customer_registration_approval_logs').insert([row]);
  if (error) throw error;
}

async function changeStatus(id, newStatus, action, comment) {
  ensureSupabase();
  const current = await getCustomerRegistrationRequest(id);
  const fromStatus = current?.status ?? null;

  const { data, error } = await supabase
    .from('sc_customer_registration_requests')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  await logApprovalAction(id, action, fromStatus, newStatus, comment);
  return getCustomerRegistrationRequest(id);
}

export async function submitCustomerRegistration(id, comment) {
  return changeStatus(id, 'submitted', 'submitted', comment);
}

export async function approveCustomerRegistration(id, comment) {
  return changeStatus(id, 'approved', 'approved', comment);
}

export async function rejectCustomerRegistration(id, comment) {
  return changeStatus(id, 'rejected', 'rejected', comment);
}

export async function requestCustomerRegistrationRevision(id, comment) {
  return changeStatus(id, 'revision_requested', 'revision_requested', comment);
}

export async function listCustomerRegistrationApprovalLogs(id) {
  ensureSupabase();
  const { data, error } = await supabase
    .from('sc_customer_registration_approval_logs')
    .select(APPROVAL_LOG_SELECT)
    .eq('request_id', id)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(normalizeApprovalLog);
}
