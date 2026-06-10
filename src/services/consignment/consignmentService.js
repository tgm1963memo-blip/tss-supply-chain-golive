import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';
import { mockConsignment } from '../../data/mockConsignment.js';
import { CONSI_CUST_GROUP, CONSI_QUICK_LINKS } from '../../constants/consignmentLegacy.js';

function buildSeedSalesRows() {
  const ym = new Date().toISOString().slice(0, 7);
  return mockConsignment.map((row) => ({
    ym,
    branchCode: row.branchCode,
    customerCode: row.branchCode,
    customerName: row.branchName,
    productCode: row.sku,
    productName: row.productName,
    productGroup: 'Frozen',
    qty: row.sold,
    amount: row.sold * 85,
    custGroup: CONSI_CUST_GROUP,
  }));
}

function mapSalesRow(row) {
  return {
    ym: row.ym,
    branchCode: row.branch_code,
    customerCode: row.customer_code,
    customerName: row.customer_name,
    productCode: row.product_code,
    productName: row.product_name,
    productGroup: row.product_group || 'อื่นๆ',
    qty: Number(row.qty || 0),
    amount: Number(row.amount || 0),
    custGroup: CONSI_CUST_GROUP,
  };
}

function filterSalesRows(rows, filters = {}) {
  let result = [...rows];
  if (filters.startYm) result = result.filter((r) => r.ym >= filters.startYm);
  if (filters.endYm) result = result.filter((r) => r.ym <= filters.endYm);
  if (filters.customerCode) result = result.filter((r) => r.customerCode === filters.customerCode);
  if (filters.productCode) result = result.filter((r) => r.productCode === filters.productCode);
  if (filters.branchCode) result = result.filter((r) => r.branchCode === filters.branchCode);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (r) => r.productCode.toLowerCase().includes(q)
        || (r.productName || '').toLowerCase().includes(q)
        || (r.customerName || '').toLowerCase().includes(q),
    );
  }
  return result;
}

function buildSummary(rows) {
  const customers = new Set(rows.map((r) => r.customerCode));
  const products = new Set(rows.map((r) => r.productCode));
  return {
    totalQty: rows.reduce((s, r) => s + r.qty, 0),
    totalAmount: rows.reduce((s, r) => s + r.amount, 0),
    customerCount: customers.size,
    productCount: products.size,
    rowCount: rows.length,
  };
}

function buildFilterOptions(rows) {
  const customers = {};
  const products = {};
  const branches = new Set();
  rows.forEach((r) => {
    if (r.customerCode) customers[r.customerCode] = r.customerName || r.customerCode;
    if (r.productCode) products[r.productCode] = r.productName || r.productCode;
    if (r.branchCode) branches.add(r.branchCode);
  });
  return {
    customers: Object.entries(customers).sort((a, b) => a[1].localeCompare(b[1], 'th')),
    products: Object.entries(products).sort((a, b) => a[0].localeCompare(b[0])),
    branches: [...branches].sort(),
  };
}

function buildGroupedRows(rows) {
  const grouped = {};
  rows.forEach((r) => {
    const key = r.customerCode || '—';
    if (!grouped[key]) {
      grouped[key] = {
        customerCode: key,
        customerName: r.customerName || key,
        branchCode: r.branchCode,
        qty: 0,
        amount: 0,
        products: {},
      };
    }
    grouped[key].qty += r.qty;
    grouped[key].amount += r.amount;
    const pc = r.productCode || '?';
    if (!grouped[key].products[pc]) {
      grouped[key].products[pc] = {
        productCode: pc,
        productName: r.productName || pc,
        productGroup: r.productGroup,
        qty: 0,
        amount: 0,
      };
    }
    grouped[key].products[pc].qty += r.qty;
    grouped[key].products[pc].amount += r.amount;
  });
  return Object.values(grouped)
    .map((g) => ({
      ...g,
      products: Object.values(g.products).sort((a, b) => b.qty - a.qty),
    }))
    .sort((a, b) => b.qty - a.qty);
}

export async function getConsignmentDashboardData(filters = {}) {
  let rows = buildSeedSalesRows();
  let source = 'seed';

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('sc_web_consi_sales_summary_view')
        .select('*')
        .limit(5000);
      if (!error && data?.length) {
        rows = data.map(mapSalesRow);
        source = 'live';
      }
    } catch {
      rows = buildSeedSalesRows();
      source = 'seed';
    }
  }

  const filtered = filterSalesRows(rows, filters);
  const options = buildFilterOptions(filterSalesRows(rows, {
    startYm: filters.startYm,
    endYm: filters.endYm,
  }));

  return {
    rows: filtered,
    grouped: buildGroupedRows(filtered),
    summary: buildSummary(filtered),
    options,
    links: CONSI_QUICK_LINKS,
    source,
  };
}

function mapSoRow(row) {
  return {
    id: row.id,
    soNo: row.so_no,
    roomCode: row.room_code,
    customerCode: row.customer_code,
    customerName: row.customer_name,
    docDate: row.doc_date,
    deliveryDate: row.delivery_date,
    status: row.status,
    lineCount: Number(row.line_count || 0),
    totalQty: Number(row.total_qty || 0),
    syncedAt: row.synced_at,
  };
}

export async function listConsignmentSoOrders(filters = {}) {
  if (!isSupabaseConfigured()) return [];

  let query = supabase
    .from('sc_web_consi_so_view')
    .select('*')
    .order('doc_date', { ascending: false })
    .limit(filters.limit || 100);

  if (filters.customerCode) query = query.eq('customer_code', filters.customerCode);
  if (filters.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapSoRow);
}

function mapSoRequest(row) {
  return {
    id: row.id,
    requestNo: row.request_no,
    requestDate: row.request_date,
    branchCode: row.branch_code,
    customerCode: row.customer_code,
    customerName: row.customer_name,
    deliveryDate: row.delivery_date,
    note: row.note,
    status: row.status,
    expressQueueStatus: row.express_queue_status,
    requester: row.requester,
    createdAt: row.created_at,
  };
}

export async function listConsignmentSoRequests() {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('sc_consi_so_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapSoRequest);
}

export async function createConsignmentSoRequest(payload = {}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const header = {
    request_no: payload.requestNo || `CONSI-SO-${Date.now()}`,
    room_code: payload.roomCode || 'CONSI',
    branch_code: payload.branchCode || null,
    customer_code: payload.customerCode || null,
    customer_name: payload.customerName || null,
    delivery_date: payload.deliveryDate || null,
    note: payload.note || '',
    status: 'submitted',
    express_queue_status: 'blocked_by_governance',
    requester: payload.requester || 'Current User',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('sc_consi_so_requests')
    .insert(header)
    .select('*')
    .single();
  if (error) throw error;

  if (Array.isArray(payload.lines) && payload.lines.length) {
    await supabase.from('sc_consi_so_lines').insert(
      payload.lines.map((line) => ({
        request_id: data.id,
        product_code: line.productCode,
        product_name: line.productName || line.productCode,
        qty: Number(line.qty || 0),
        uom: line.uom || 'KG',
      })),
    );
  }

  return mapSoRequest(data);
}

export { isSupabaseConfigured };
