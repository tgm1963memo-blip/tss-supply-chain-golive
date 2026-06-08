import { supabase, getSupabaseEnvInfo } from '../../lib/supabaseClient.js';

const SAFE_MODE_NOTE =
  'Read-only validation mode. No stock posting, reservation writes, PO/production creation, or Express DBF write-back.';

const PROBE_TABLE = 'sc_products';

/**
 * Verify Supabase environment and perform a safe read-only connectivity probe.
 * @returns {Promise<{
 *   status: 'missing_env' | 'configured' | 'connection_error' | 'ok',
 *   envConfigured: boolean,
 *   urlPresent: boolean,
 *   anonKeyPresent: boolean,
 *   connectionMessage: string,
 *   checkedAt: string,
 *   safeModeNote: string,
 * }>}
 */
export async function checkSupabaseHealth() {
  const env = getSupabaseEnvInfo();
  const checkedAt = new Date().toISOString();

  if (!env.envConfigured) {
    return {
      status: 'missing_env',
      envConfigured: false,
      urlPresent: env.urlPresent,
      anonKeyPresent: env.anonKeyPresent,
      connectionMessage: 'Missing VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local.',
      checkedAt,
      safeModeNote: SAFE_MODE_NOTE,
    };
  }

  if (!supabase) {
    return {
      status: 'configured',
      envConfigured: true,
      urlPresent: env.urlPresent,
      anonKeyPresent: env.anonKeyPresent,
      connectionMessage: 'Environment variables are set but the Supabase client could not be initialized.',
      checkedAt,
      safeModeNote: SAFE_MODE_NOTE,
    };
  }

  try {
    const { error } = await supabase
      .from(PROBE_TABLE)
      .select('id', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    return {
      status: 'ok',
      envConfigured: true,
      urlPresent: env.urlPresent,
      anonKeyPresent: env.anonKeyPresent,
      connectionMessage: `Read-only probe succeeded (${PROBE_TABLE}).`,
      checkedAt,
      safeModeNote: SAFE_MODE_NOTE,
    };
  } catch (err) {
    return {
      status: 'connection_error',
      envConfigured: true,
      urlPresent: env.urlPresent,
      anonKeyPresent: env.anonKeyPresent,
      connectionMessage: err?.message || 'Supabase connection probe failed.',
      checkedAt,
      safeModeNote: SAFE_MODE_NOTE,
    };
  }
}
