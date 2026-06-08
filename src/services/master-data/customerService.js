import { supabase } from '../../lib/supabaseClient.js';

const DEFAULT_LIMIT = 100;

function ensureSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }
}

function normalizeSearch(search = '') {
  return search.trim().replaceAll(',', ' ');
}

function mapCustomerRow(row) {
  const erpCustomer = row.sc_express_customers || null;
  const aliases = row.sc_customer_alias || [];

  return {
    id: row.id,
    roomCode: row.room_code,
    customerCode: row.customer_code,
    customerName: row.customer_name,
    customerGroup: row.customer_group,
    salesCode: row.sales_code,
    status: row.status,
    erpCustomer,
    aliases,
    updatedAt: row.updated_at,
  };
}

export async function getCustomers({ search = '', limit = DEFAULT_LIMIT } = {}) {
  ensureSupabaseClient();

  const normalizedSearch = normalizeSearch(search);

  let query = supabase
    .from('sc_customers')
    .select(`
      id,
      room_code,
      customer_code,
      customer_name,
      customer_group,
      sales_code,
      status,
      updated_at,
      sc_express_customers (
        id,
        room_code,
        customer_code,
        customer_name,
        customer_group,
        sales_code,
        raw_data,
        source_updated_at
      ),
      sc_customer_alias (
        id,
        alias_code,
        alias_name,
        status
      )
    `)
    .order('customer_code', { ascending: true })
    .limit(limit);

  if (normalizedSearch) {
    query = query.or(
      [
        `customer_code.ilike.%${normalizedSearch}%`,
        `customer_name.ilike.%${normalizedSearch}%`,
        `customer_group.ilike.%${normalizedSearch}%`,
        `sales_code.ilike.%${normalizedSearch}%`,
      ].join(','),
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []).map(mapCustomerRow);
}

export async function getCustomerById(customerId) {
  ensureSupabaseClient();

  const { data, error } = await supabase
    .from('sc_customers')
    .select(`
      id,
      room_code,
      customer_code,
      customer_name,
      customer_group,
      sales_code,
      status,
      updated_at,
      sc_express_customers (
        id,
        room_code,
        customer_code,
        customer_name,
        customer_group,
        sales_code,
        raw_data,
        source_updated_at
      ),
      sc_customer_alias (
        id,
        alias_code,
        alias_name,
        status
      )
    `)
    .eq('id', customerId)
    .single();

  if (error) {
    throw error;
  }

  return mapCustomerRow(data);
}
