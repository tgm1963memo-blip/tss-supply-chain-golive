import { supabase } from '../../lib/supabaseClient.js';

export async function getShortages() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('sc_web_shortage_view').select('*');
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}
