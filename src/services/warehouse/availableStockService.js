import { supabase } from '../../lib/supabaseClient.js';

export async function getAvailableStock() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('sc_web_stock_balance_view').select('*');
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}
