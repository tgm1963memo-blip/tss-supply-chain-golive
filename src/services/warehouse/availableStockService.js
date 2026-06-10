import { supabase } from '../../lib/supabaseClient.js';

export async function getAvailableStock() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('sc_rm_stock_balance').select('*');
    if (!error && data?.length) return data;

    const fallback = await supabase.from('sc_web_stock_balance_view').select('*');
    if (fallback.error) return [];
    return fallback.data || [];
  } catch {
    return [];
  }
}
