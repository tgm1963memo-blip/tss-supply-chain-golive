import { supabase } from '../../lib/supabaseClient.js';

export async function getSalesOrderLines(orderId) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('sc_web_sales_order_lines_view').select('*').eq('order_id', orderId);
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}
