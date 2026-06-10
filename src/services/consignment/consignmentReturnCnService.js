import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';

function mapReturnBranch(row) {
  return {
    id: row.id,
    requestNo: row.request_no,
    requestDate: row.request_date,
    branchCode: row.branch_code,
    customerCode: row.customer_code,
    customerName: row.customer_name,
    productCode: row.product_code,
    productName: row.product_name,
    returnQty: Number(row.return_qty || 0),
    uom: row.uom,
    lotNo: row.lot_no,
    reason: row.reason,
    status: row.status,
    expressQueueStatus: row.express_queue_status,
    requester: row.requester,
    createdAt: row.created_at,
  };
}

function mapReturnCn(row) {
  return {
    id: row.id,
    requestNo: row.request_no,
    requestDate: row.request_date,
    branchCode: row.branch_code,
    customerCode: row.customer_code,
    customerName: row.customer_name,
    invoiceRef: row.invoice_ref,
    reason: row.reason,
    stockImpactFlag: row.stock_impact_flag,
    status: row.status,
    expressQueueStatus: row.express_queue_status,
    requester: row.requester,
    internalNote: row.internal_note,
    createdAt: row.created_at,
  };
}

export async function listReturnFromBranchRequests() {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('sc_consi_return_branch_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapReturnBranch);
}

export async function createReturnFromBranchRequest(payload = {}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const row = {
    request_no: payload.requestNo || `CONSI-RET-${Date.now()}`,
    branch_code: payload.branchCode || null,
    customer_code: payload.customerCode || null,
    customer_name: payload.customerName || null,
    product_code: payload.productCode,
    product_name: payload.productName || payload.productCode,
    return_qty: Number(payload.returnQty || 0),
    uom: payload.uom || 'KG',
    lot_no: payload.lotNo || null,
    reason: payload.reason || '',
    status: 'submitted',
    express_queue_status: 'blocked_by_governance',
    requester: payload.requester || 'Current User',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('sc_consi_return_branch_requests')
    .insert(row)
    .select('*')
    .single();
  if (error) throw error;
  return mapReturnBranch(data);
}

export async function listConsignmentReturnCnRequests() {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('sc_consi_return_cn_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapReturnCn);
}

export async function getConsignmentReturnCnRequest(id) {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured.');
  const { data: request, error } = await supabase
    .from('sc_consi_return_cn_requests')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;

  const { data: lines, error: lineError } = await supabase
    .from('sc_consi_return_cn_lines')
    .select('*')
    .eq('request_id', id)
    .order('created_at', { ascending: true });
  if (lineError) throw lineError;

  return {
    ...mapReturnCn(request),
    lines: (lines || []).map((line) => ({
      productCode: line.product_code,
      productName: line.product_name,
      qty: Number(line.qty || 0),
      unit: line.unit,
      lotNo: line.lot_no,
      lineReason: line.line_reason,
    })),
  };
}

export async function createConsignmentReturnCnRequest(payload = {}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const { lines, ...header } = payload;
  const { data, error } = await supabase
    .from('sc_consi_return_cn_requests')
    .insert({
      request_no: header.requestNo || `CONSI-CN-${Date.now()}`,
      branch_code: header.branchCode || null,
      customer_code: header.customerCode || null,
      customer_name: header.customerName || null,
      invoice_ref: header.invoiceRef || null,
      reason: header.reason || '',
      stock_impact_flag: header.stockImpactFlag !== false,
      status: 'submitted',
      express_queue_status: 'blocked_by_governance',
      requester: header.requester || 'Current User',
      internal_note: header.internalNote || '',
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) throw error;

  if (Array.isArray(lines) && lines.length) {
    await supabase.from('sc_consi_return_cn_lines').insert(
      lines.map((line) => ({
        request_id: data.id,
        product_code: line.productCode || '',
        product_name: line.productName || '',
        qty: Number(line.qty || 0),
        unit: line.unit || 'กก.',
        lot_no: line.lotNo || '',
        line_reason: line.lineReason || '',
      })),
    );
  }

  return getConsignmentReturnCnRequest(data.id);
}

export { isSupabaseConfigured };
