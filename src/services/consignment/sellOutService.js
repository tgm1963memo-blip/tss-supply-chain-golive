import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';

function mapRow(row) {
  return {
    id: row.id,
    requestNo: row.request_no,
    recordDate: row.record_date,
    branchCode: row.branch_code,
    customerCode: row.customer_code,
    customerName: row.customer_name,
    productCode: row.product_code,
    productName: row.product_name,
    sellQty: Number(row.sell_qty || 0),
    uom: row.uom,
    note: row.note,
    status: row.status,
    expressQueueStatus: row.express_queue_status,
    requester: row.requester,
    createdAt: row.created_at,
  };
}

export async function listSellOutRecords(filters = {}) {
  if (!isSupabaseConfigured()) return [];

  let query = supabase
    .from('sc_consi_sell_out_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(filters.limit || 100);

  if (filters.branchCode) query = query.eq('branch_code', filters.branchCode);
  if (filters.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapRow);
}

export async function createSellOutRecord(payload = {}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const row = {
    request_no: payload.requestNo || `CONSI-SO-OUT-${Date.now()}`,
    record_date: payload.recordDate || new Date().toISOString().slice(0, 10),
    branch_code: payload.branchCode || null,
    customer_code: payload.customerCode || null,
    customer_name: payload.customerName || null,
    product_code: payload.productCode,
    product_name: payload.productName || payload.productCode,
    sell_qty: Number(payload.sellQty || 0),
    uom: payload.uom || 'KG',
    note: payload.note || '',
    status: 'submitted',
    express_queue_status: 'blocked_by_governance',
    requester: payload.requester || 'Current User',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('sc_consi_sell_out_requests')
    .insert(row)
    .select('*')
    .single();
  if (error) throw error;
  return mapRow(data);
}

export function summarizeSellOut(rows) {
  return {
    recordCount: rows.length,
    totalSellQty: rows.reduce((s, r) => s + r.sellQty, 0),
    branchCount: new Set(rows.map((r) => r.branchCode).filter(Boolean)).size,
    pendingCount: rows.filter((r) => r.status === 'submitted').length,
  };
}

export { isSupabaseConfigured };
