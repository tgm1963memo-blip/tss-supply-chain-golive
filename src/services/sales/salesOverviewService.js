import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';

const DEFAULT_ROOM = 'TSS';

function ensureClient() {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }
}

function normalizeFilters(filters = {}) {
  return {
    dateFrom: filters.dateFrom || '',
    dateTo: filters.dateTo || '',
    roomCode: filters.roomCode || DEFAULT_ROOM,
    customerGroup: filters.customerGroup || '',
    productGroup: filters.productGroup || '',
    salesperson: filters.salesperson || '',
    search: (filters.search || '').trim().toLowerCase(),
  };
}

function amountFromRaw(raw) {
  if (!raw || typeof raw !== 'object') return 0;
  const keys = ['AMOUNT', 'amount', 'NETAMT', 'netamt', 'TOTAL', 'total'];
  for (const key of keys) {
    const value = Number(raw[key]);
    if (!Number.isNaN(value) && value !== 0) return value;
  }
  return 0;
}

function qtyFromRaw(raw) {
  if (!raw || typeof raw !== 'object') return 0;
  const keys = ['QTY', 'qty', 'ORDQTY', 'ordqty'];
  for (const key of keys) {
    const value = Number(raw[key]);
    if (!Number.isNaN(value) && value !== 0) return value;
  }
  return 0;
}

function mapInvoiceRow(invoice, customerMap = {}) {
  const customer = customerMap[invoice.customer_code] || {};
  return {
    id: invoice.id,
    date: invoice.invoice_date || invoice.created_at?.slice?.(0, 10) || '',
    customerCode: invoice.customer_code || '',
    customerName: customer.customer_name || invoice.customer_code || '',
    customerGroup: customer.customer_group || '',
    productGroup: '',
    salesperson: customer.sales_code || '',
    qty: qtyFromRaw(invoice.raw_data),
    amount: amountFromRaw(invoice.raw_data),
    channel: invoice.status || 'invoice',
    roomCode: invoice.room_code || DEFAULT_ROOM,
    documentNo: invoice.document_no || '',
  };
}

function applyRowFilters(rows, filters) {
  const f = normalizeFilters(filters);
  return rows.filter((row) => {
    if (f.dateFrom && row.date && row.date < f.dateFrom) return false;
    if (f.dateTo && row.date && row.date > f.dateTo) return false;
    if (f.roomCode && row.roomCode !== f.roomCode) return false;
    if (f.customerGroup && row.customerGroup !== f.customerGroup) return false;
    if (f.productGroup && row.productGroup !== f.productGroup) return false;
    if (f.salesperson && row.salesperson !== f.salesperson) return false;
    if (f.search) {
      const hay = [row.customerCode, row.customerName, row.documentNo, row.salesperson, row.customerGroup]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(f.search)) return false;
    }
    return true;
  });
}

function mapDailySummaryRow(row) {
  return {
    id: `${row.room_code}:${row.sales_date}:${row.customer_code}:${row.product_code}`,
    date: row.sales_date || '',
    customerCode: row.customer_code || '',
    customerName: row.customer_name || row.customer_code || '',
    customerGroup: '',
    productGroup: row.product_group || '',
    salesperson: '',
    qty: Number(row.sales_qty || 0),
    amount: Number(row.sales_amount || 0),
    channel: 'invoice',
    roomCode: row.room_code || DEFAULT_ROOM,
    documentNo: `${row.invoice_count || 0} inv`,
  };
}

async function loadCustomerMap(roomCode) {
  if (!isSupabaseConfigured()) return {};
  try {
    const { data, error } = await supabase
      .from('sc_rm_customer_master')
      .select('customer_code,customer_name,customer_group')
      .eq('room_code', roomCode);
    if (!error && data?.length) {
      return Object.fromEntries(data.map((row) => [row.customer_code, row]));
    }
    const fallback = await supabase
      .from('sc_express_customers')
      .select('customer_code,customer_name,customer_group,sales_code')
      .eq('room_code', roomCode);
    if (fallback.error) return {};
    return Object.fromEntries((fallback.data || []).map((row) => [row.customer_code, row]));
  } catch {
    return {};
  }
}

async function loadDailySummaryRows(filters) {
  if (!isSupabaseConfigured()) return [];
  ensureClient();
  const f = normalizeFilters(filters);

  try {
    let query = supabase
      .from('sc_rm_sales_daily_summary')
      .select('room_code,sales_date,customer_code,customer_name,product_code,product_name,product_group,sales_qty,sales_amount,invoice_count')
      .eq('room_code', f.roomCode)
      .order('sales_date', { ascending: false })
      .limit(500);

    if (f.dateFrom) query = query.gte('sales_date', f.dateFrom);
    if (f.dateTo) query = query.lte('sales_date', f.dateTo);

    const { data, error } = await query;
    if (!error && data?.length) {
      return data.map(mapDailySummaryRow);
    }
  } catch {
    // fall through to legacy invoice load
  }
  return [];
}

async function loadInvoiceRows(filters) {
  const summaryRows = await loadDailySummaryRows(filters);
  if (summaryRows.length) {
    return summaryRows;
  }

  if (!isSupabaseConfigured()) return [];
  ensureClient();
  const f = normalizeFilters(filters);

  try {
    let query = supabase
      .from('sc_express_invoices')
      .select('id,room_code,document_no,customer_code,invoice_date,status,raw_data,created_at')
      .eq('room_code', f.roomCode)
      .order('invoice_date', { ascending: false })
      .limit(500);

    if (f.dateFrom) query = query.gte('invoice_date', f.dateFrom);
    if (f.dateTo) query = query.lte('invoice_date', f.dateTo);

    const { data, error } = await query;
    if (error) throw error;

    const customerMap = await loadCustomerMap(f.roomCode);
    return (data || []).map((row) => mapInvoiceRow(row, customerMap));
  } catch {
    return [];
  }
}

async function loadDashboardMonthly(filters) {
  if (!isSupabaseConfigured()) return [];
  ensureClient();
  const f = normalizeFilters(filters);

  try {
    let monthlyQuery = supabase
      .from('sc_rm_sales_monthly_summary')
      .select('room_code,sales_month,customer_code,product_code,sales_qty,sales_amount,invoice_count')
      .eq('room_code', f.roomCode)
      .order('sales_month', { ascending: true })
      .limit(200);

    if (f.dateFrom) monthlyQuery = monthlyQuery.gte('sales_month', String(f.dateFrom).slice(0, 7));
    if (f.dateTo) monthlyQuery = monthlyQuery.lte('sales_month', String(f.dateTo).slice(0, 7));

    const { data: monthlyData, error: monthlyError } = await monthlyQuery;
    if (!monthlyError && monthlyData?.length) {
      const grouped = new Map();
      monthlyData.forEach((row) => {
        const key = row.sales_month;
        if (!key) return;
        grouped.set(key, (grouped.get(key) || 0) + (Number(row.sales_amount) || Number(row.sales_qty) || 0));
      });
      return [...grouped.entries()].map(([doc_date, total_qty]) => ({
        room_code: f.roomCode,
        doc_date: `${doc_date}-01`,
        total_qty,
      }));
    }
  } catch {
    // fall through
  }

  try {
    let query = supabase
      .from('sc_web_sales_dashboard_view')
      .select('room_code,doc_date,order_count,line_count,total_qty,last_synced_at')
      .eq('room_code', f.roomCode)
      .order('doc_date', { ascending: true })
      .limit(200);

    if (f.dateFrom) query = query.gte('doc_date', f.dateFrom);
    if (f.dateTo) query = query.lte('doc_date', f.dateTo);

    const { data, error } = await query;
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function listSalesOverviewRows(filters = {}) {
  const rows = await loadInvoiceRows(filters);
  return applyRowFilters(rows, filters);
}

export async function getSalesOverviewSummary(filters = {}) {
  const rows = await listSalesOverviewRows(filters);
  const totalQty = rows.reduce((sum, row) => sum + (Number(row.qty) || 0), 0);
  const totalSales = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const customers = new Set(rows.map((row) => row.customerCode).filter(Boolean));
  const orders = new Set(rows.map((row) => row.documentNo).filter(Boolean));
  const dates = rows.map((row) => row.date).filter(Boolean).sort();
  const daySpan = dates.length
    ? Math.max(1, Math.ceil((new Date(dates[dates.length - 1]) - new Date(dates[0])) / (1000 * 60 * 60 * 24)) + 1)
    : 1;

  const usedCompact = rows.some((row) => String(row.documentNo || '').includes('inv'));
  return {
    totalSales,
    totalQty,
    customerCount: customers.size,
    orderCount: orders.size,
    averageSalesPerDay: totalSales / daySpan,
    rowCount: rows.length,
    dataSource: rows.length ? (usedCompact ? 'sc_rm_sales_daily_summary' : 'sc_express_invoices') : 'empty',
  };
}

function groupSum(rows, keyField, valueField) {
  const map = new Map();
  rows.forEach((row) => {
    const key = row[keyField] || 'Other';
    map.set(key, (map.get(key) || 0) + (Number(row[valueField]) || 0));
  });
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);
}

export async function getSalesByMonth(filters = {}) {
  const monthly = await loadDashboardMonthly(filters);
  if (monthly.length) {
    const grouped = new Map();
    monthly.forEach((row) => {
      const key = String(row.doc_date || '').slice(0, 7);
      if (!key) return;
      grouped.set(key, (grouped.get(key) || 0) + (Number(row.total_qty) || 0));
    });
    return [...grouped.entries()].map(([label, value]) => ({ label, value }));
  }

  const rows = await listSalesOverviewRows(filters);
  const grouped = new Map();
  rows.forEach((row) => {
    const key = String(row.date || '').slice(0, 7);
    if (!key) return;
    grouped.set(key, (grouped.get(key) || 0) + (Number(row.amount) || Number(row.qty) || 0));
  });
  return [...grouped.entries()].map(([label, value]) => ({ label, value }));
}

export async function getSalesByCustomerGroup(filters = {}) {
  const rows = await listSalesOverviewRows(filters);
  return groupSum(rows, 'customerGroup', 'amount');
}

export async function getSalesByProductGroup(filters = {}) {
  const rows = await listSalesOverviewRows(filters);
  return groupSum(rows, 'productGroup', 'amount');
}

export { isSupabaseConfigured };
