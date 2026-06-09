import { supabase } from '../../lib/supabaseClient.js';

export async function getSalesOrders() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('sc_web_sales_order_view').select('*');
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}
