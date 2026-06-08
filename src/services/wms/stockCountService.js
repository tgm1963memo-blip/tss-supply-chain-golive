import { supabase } from '../../lib/supabaseClient.js';

function missingSupabaseClientResult() {
  return {
    data: null,
    error: new Error('Supabase client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'),
  };
}

export async function getStockCountDocuments(filters = {}) {
  if (!supabase) {
    return missingSupabaseClientResult();
  }

  let query = supabase
    .from('tgd_stock_count_documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.warehouseId) {
    query = query.eq('warehouse_id', filters.warehouseId);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.countType) {
    query = query.eq('count_type', filters.countType);
  }

  if (filters.countDate) {
    query = query.eq('count_date', filters.countDate);
  }

  return query;
}
