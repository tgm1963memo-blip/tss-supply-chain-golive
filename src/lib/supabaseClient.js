import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function isSupabaseConfigured() {
  return Boolean(supabase);
}

/** Synchronous env presence check (does not verify network connectivity). */
export function getSupabaseEnvInfo() {
  const urlPresent = Boolean(supabaseUrl);
  const anonKeyPresent = Boolean(supabaseAnonKey);

  return {
    urlPresent,
    anonKeyPresent,
    envConfigured: urlPresent && anonKeyPresent,
    urlPreview: urlPresent ? supabaseUrl.replace(/^(https:\/\/[^/]+).*$/, '$1') : '',
  };
}
