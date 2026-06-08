import { supabase } from '../../lib/supabaseClient.js';

function missingSupabaseClientResult() {
  return {
    data: null,
    error: new Error('Supabase client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'),
  };
}

export async function getWithdrawalAllocations(filters = {}) {
  if (!supabase) {
    return missingSupabaseClientResult();
  }

  let query = supabase
    .from('tgd_withdrawal_allocations')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.withdrawalRequestId) {
    query = query.eq('withdrawal_request_id', filters.withdrawalRequestId);
  }

  if (filters.customerId) {
    query = query.eq('customer_id', filters.customerId);
  }

  if (filters.warehouseId) {
    query = query.eq('warehouse_id', filters.warehouseId);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.allocationMethod) {
    query = query.eq('allocation_method', filters.allocationMethod);
  }

  return query;
}
