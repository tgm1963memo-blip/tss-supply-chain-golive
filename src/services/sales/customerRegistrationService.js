import { supabase } from '../../lib/supabaseClient.js';
import { CR_DOC_SLOTS, normalizeDocumentSlots } from '../../constants/customerRegistrationLegacy.js';

export { CR_DOC_SLOTS };

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
  'existing_customer_code', 'original_customer_snapshot', 'proposed_changes', 'document_slots',
  'credit_change_requested', 'suspend_reason', 'final_note',
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
  if (next.document_slots !== undefined) {
    next.document_slots = normalizeDocumentSlots(next.document_slots);
  }
  if (next.original_customer_snapshot && typeof next.original_customer_snapshot === 'string') {
    try {
      next.original_customer_snapshot = JSON.parse(next.original_customer_snapshot);
    } catch {
      next.original_customer_snapshot = {};
    }
  }
  if (next.proposed_changes && typeof next.proposed_changes === 'string') {
    try {
      next.proposed_changes = JSON.parse(next.proposed_changes);
    } catch {
      next.proposed_changes = {};
    }
  }
  return next;
}

function mapCustomerRow(row) {
  if (!row) return null;
  return {
    customer_code: row.customer_code || '',
    customer_name: row.customer_name || '',
    customer_group: row.customer_group || '',
    sales_code: row.sales_code || '',
    room_code: row.room_code || '',
    source: row.source_file ? 'sc_web_customer_master_view' : 'sc_express_customers',
  };
}

export async function searchExistingCustomers(query, limit = 20) {
  ensureSupabase();
  const q = (query || '').trim();
  if (!q) return [];

  const pattern = `%${q}%`;
  const { data: viewRows, error: viewError } = await supabase
    .from('sc_web_customer_master_view')
    .select('customer_code, customer_name, customer_group, sales_code, room_code, source_file')
    .or(`customer_code.ilike.${pattern},customer_name.ilike.${pattern}`)
    .limit(limit);

  if (!viewError && viewRows?.length) {
    return viewRows.map(mapCustomerRow);
  }

  const { data: fallbackRows, error: fallbackError } = await supabase
    .from('sc_express_customers')
    .select('customer_code, customer_name, customer_group, sales_code, room_code, source_file')
    .or(`customer_code.ilike.${pattern},customer_name.ilike.${pattern}`)
    .limit(limit);

  if (fallbackError) throw fallbackError;
  return (fallbackRows || []).map(mapCustomerRow);
}

export async function loadExistingCustomerSnapshot(customerCode) {
  ensureSupabase();
  const code = (customerCode || '').trim();
  if (!code) return null;

  const { data: viewRow } = await supabase
    .from('sc_web_customer_master_view')
    .select('*')
    .eq('customer_code', code)
    .maybeSingle();

  if (viewRow) {
    return { ...mapCustomerRow(viewRow), raw: viewRow, loaded_at: new Date().toISOString() };
  }

  const { data: fallbackRow, error } = await supabase
    .from('sc_express_customers')
    .select('*')
    .eq('customer_code', code)
    .maybeSingle();

  if (error) throw error;
  if (!fallbackRow) return null;
  return { ...mapCustomerRow(fallbackRow), raw: fallbackRow, loaded_at: new Date().toISOString() };
}

export function isStorageConfigured() {
  return Boolean(import.meta.env.VITE_SUPABASE_STORAGE_BUCKET);
}

export function buildDocumentSlotMetadata(fileList, slotId) {
  return Array.from(fileList || []).slice(0, CR_DOC_SLOTS.find((s) => s.id === slotId)?.maxFiles || 10).map((file) => ({
    name: file.name,
    size: file.size,
    type: file.type || '',
    mode: 'metadata_only',
    uploaded_at: new Date().toISOString(),
  }));
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

  return {
    ...request,
    document_slots: normalizeDocumentSlots(request?.document_slots),
    branches: branches || [],
  };
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
