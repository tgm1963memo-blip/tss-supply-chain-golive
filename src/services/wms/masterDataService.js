import { supabase } from '../../lib/supabaseClient.js';

function missingSupabaseClientResult() {
  return {
    data: null,
    error: new Error('Supabase client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'),
  };
}

export async function getLocations(filters = {}) {
  if (!supabase) {
    return missingSupabaseClientResult();
  }

  let query = supabase.from('tgd_locations').select('*').order('location_code');

  if (filters.roomId) {
    query = query.eq('room_id', filters.roomId);
  }

  if (typeof filters.isActive === 'boolean') {
    query = query.eq('is_active', filters.isActive);
  }

  return query;
}
