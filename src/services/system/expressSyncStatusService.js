import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';

const DEFAULT_ROOM = 'TSS';

const COUNT_QUERIES = [
  { key: 'productsSynced', table: 'sc_express_products', label: 'Products' },
  { key: 'customersSynced', table: 'sc_express_customers', label: 'Customers' },
  { key: 'stockRowsSynced', table: 'sc_express_stock', label: 'Stock rows' },
  { key: 'soHeadersSynced', table: 'sc_express_so_headers', label: 'SO headers' },
  { key: 'soLinesSynced', table: 'sc_express_so_lines', label: 'SO lines' },
];

async function safeHeadCount(table, roomCode) {
  if (!supabase) {
    return { count: null, error: 'Supabase not configured' };
  }

  try {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('room_code', roomCode);

    if (error) {
      return { count: null, error: error.message };
    }
    return { count: count ?? 0, error: null };
  } catch (err) {
    return { count: null, error: err?.message || 'Count failed' };
  }
}

async function fetchLatestSyncJob(roomCode) {
  if (!supabase) {
    return { job: null, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('sync_jobs')
      .select('source_table, status, started_at, finished_at, last_error, created_at, job_name')
      .eq('room_code', roomCode)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      return { job: null, error: error.message };
    }
    return { job: data?.[0] || null, error: null };
  } catch (err) {
    return { job: null, error: err?.message || 'sync_jobs query failed' };
  }
}

async function fetchLatestAgentJob(sourceTable) {
  if (!supabase) {
    return { job: null, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('sync_jobs')
      .select('job_name, source_table, status, started_at, finished_at, last_error, created_at')
      .eq('room_code', 'SYSTEM')
      .eq('source_table', sourceTable)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      return { job: null, error: error.message };
    }
    return { job: data?.[0] || null, error: null };
  } catch (err) {
    return { job: null, error: err?.message || 'agent sync_jobs query failed' };
  }
}

function resolveAgentMode(agentJobs) {
  const hasAgentRuns = Object.values(agentJobs).some((entry) => entry?.job);
  if (!hasAgentRuns) {
    return 'unknown';
  }

  const rolling = agentJobs.activeRolling?.job;
  if (rolling?.finished_at || rolling?.started_at) {
    const ts = new Date(rolling.finished_at || rolling.started_at).getTime();
    const ageMs = Date.now() - ts;
    if (ageMs < 24 * 60 * 60 * 1000) {
      return 'scheduled';
    }
  }

  return hasAgentRuns ? 'manual' : 'unknown';
}

function jobTimestamp(job) {
  return job?.finished_at || job?.started_at || null;
}

async function fetchFailedRecordCount(roomCode) {
  if (!supabase) {
    return { count: null, error: 'Supabase not configured' };
  }

  try {
    const { count, error } = await supabase
      .from('sync_failed_records')
      .select('*', { count: 'exact', head: true })
      .eq('room_code', roomCode);

    if (error) {
      return { count: null, error: error.message };
    }
    return { count: count ?? 0, error: null };
  } catch (err) {
    return { count: null, error: err?.message || 'Failed record count failed' };
  }
}

/**
 * Readiness check — env vars for server-side sync (frontend cannot run sync).
 */
export function getExpressSyncReadiness() {
  const expressPathConfigured = Boolean(
    typeof import.meta.env.VITE_EXPRESS_DBF_PATH === 'string'
    && import.meta.env.VITE_EXPRESS_DBF_PATH.trim(),
  );

  return {
    supabaseConfigured: isSupabaseConfigured(),
    expressPathHintConfigured: expressPathConfigured,
    syncScriptPath: 'scripts/express-readonly-sync/sync_express_readonly.py',
    setupDoc: 'docs/20_EXPRESS_READONLY_SYNC_SETUP.md',
    validationDoc: 'docs/21_EXPRESS_SYNC_UAT_VALIDATION.md',
    automationDoc: 'docs/22_AUTOMATED_EXPRESS_SYNC_AGENT.md',
    readOnlyMode: true,
    expressWriteBackDisabled: true,
    note: 'Sync runs server-side with SUPABASE_SERVICE_ROLE_KEY — never expose service role in frontend.',
  };
}

/**
 * Live status from Supabase (anon read). Safe fallback when tables missing.
 */
export async function getExpressSyncStatus({ roomCode = DEFAULT_ROOM } = {}) {
  const checkedAt = new Date().toISOString();
  const readiness = getExpressSyncReadiness();

  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      checkedAt,
      roomCode,
      lastSyncTime: null,
      productsSynced: null,
      customersSynced: null,
      stockRowsSynced: null,
      soHeadersSynced: null,
      soLinesSynced: null,
      failedRecords: null,
      readOnlyModeActive: true,
      expressWriteBackDisabled: true,
      message: 'Supabase not configured — configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      readiness,
      automatedSyncAgent: {
        installed: false,
        agentMode: 'Unknown',
        lastActiveRollingSync: null,
        lastMasterSync: null,
        lastReadModelRefresh: null,
        historicalSyncCompleted: null,
        failedRecords: null,
        readOnlyModeActive: true,
        expressWriteBackDisabled: true,
        notInstalledMessage: 'Automated Sync Agent not installed yet.',
        setupDoc: 'docs/22_AUTOMATED_EXPRESS_SYNC_AGENT.md',
      },
    };
  }

  const counts = {};
  const errors = {};

  for (const item of COUNT_QUERIES) {
    const { count, error } = await safeHeadCount(item.table, roomCode);
    counts[item.key] = count;
    if (error) {
      errors[item.key] = error;
    }
  }

  const { job, error: jobError } = await fetchLatestSyncJob(roomCode);
  if (jobError) {
    errors.syncJobs = jobError;
  }

  const [activeRolling, masterDaily, readModelRefresh, historicalOnce] = await Promise.all([
    fetchLatestAgentJob('active_rolling'),
    fetchLatestAgentJob('master_daily'),
    fetchLatestAgentJob('read_model_refresh'),
    fetchLatestAgentJob('historical_once'),
  ]);

  const agentJobs = {
    activeRolling,
    masterDaily,
    readModelRefresh,
    historicalOnce,
  };

  const agentErrors = [
    activeRolling.error,
    masterDaily.error,
    readModelRefresh.error,
    historicalOnce.error,
  ].filter(Boolean);

  if (agentErrors.length) {
    errors.agentJobs = agentErrors.join('; ');
  }

  const agentMode = resolveAgentMode(agentJobs);
  const agentInstalled = agentMode !== 'unknown';

  const { count: failedRecords, error: failedError } = await fetchFailedRecordCount(roomCode);
  if (failedError) {
    errors.failedRecords = failedError;
  }

  const hasAnyData = Object.values(counts).some((c) => typeof c === 'number' && c > 0);
  const lastSyncTime = job?.finished_at || job?.started_at || null;

  let message = null;
  if (!hasAnyData && !job) {
    message = 'Express sync status will appear after first readonly sync.';
  } else if (Object.keys(errors).length > 0 && !hasAnyData) {
    message = 'Some sync status tables are not available yet. Run readonly sync per docs/20.';
  }

  return {
    configured: true,
    checkedAt,
    roomCode,
    lastSyncTime,
    lastSyncJob: job,
    productsSynced: counts.productsSynced,
    customersSynced: counts.customersSynced,
    stockRowsSynced: counts.stockRowsSynced,
    soHeadersSynced: counts.soHeadersSynced,
    soLinesSynced: counts.soLinesSynced,
    failedRecords,
    readOnlyModeActive: true,
    expressWriteBackDisabled: true,
    errors: Object.keys(errors).length ? errors : null,
    message,
    readiness,
    automatedSyncAgent: {
      installed: agentInstalled,
      agentMode: agentMode === 'unknown' ? 'Unknown' : agentMode === 'scheduled' ? 'Scheduled' : 'Manual',
      lastActiveRollingSync: jobTimestamp(activeRolling.job),
      lastMasterSync: jobTimestamp(masterDaily.job),
      lastReadModelRefresh: jobTimestamp(readModelRefresh.job),
      historicalSyncCompleted: historicalOnce.job?.status === 'completed' ? true : historicalOnce.job ? false : null,
      failedRecords,
      readOnlyModeActive: true,
      expressWriteBackDisabled: true,
      notInstalledMessage: agentInstalled ? null : 'Automated Sync Agent not installed yet.',
      setupDoc: 'docs/22_AUTOMATED_EXPRESS_SYNC_AGENT.md',
    },
  };
}
