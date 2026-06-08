import { useCallback, useEffect, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import { checkSupabaseHealth } from '../../services/system/supabaseHealthService.js';
import { getUatPageResults, getUatStatusSummary } from '../../services/system/uatStatusService.js';

function yesNo(value) {
  return value ? 'Yes' : 'No';
}

function statusBadgeType(status) {
  if (status === 'ok') return 'success';
  if (status === 'configured') return 'neutral';
  if (status === 'missing_env') return 'warning';
  if (status === 'connection_error') return 'danger';
  return 'neutral';
}

function formatStatusLabel(status) {
  if (!status) return 'Not checked';
  return status.replace(/_/g, ' ');
}

export default function SystemControlPage() {
  const uatStatus = getUatStatusSummary();
  const uatPages = getUatPageResults();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runHealthCheck = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await checkSupabaseHealth();
      setHealth(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runHealthCheck();
  }, [runHealthCheck]);

  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="System Control"
        description="Production readiness checks for Supabase environment and read-only live validation."
        actions={
          <>
            <Badge type="neutral">Read-only</Badge>
            <Badge type="warning">Safe Mode</Badge>
          </>
        }
      />

      <Alert variant="warning">
        Safe mode enforced: no stock posting, reservation writes, PO/production creation, or Express DBF write-back.
      </Alert>

      {error ? <Alert variant="danger">{error.message}</Alert> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--color-text-main)]">Supabase Health Check</h3>
        <button
          type="button"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          onClick={runHealthCheck}
          disabled={loading}
        >
          {loading ? 'Checking…' : 'Re-run check'}
        </button>
      </div>

      <TablePanel>
        <table className="tgm-table">
          <tbody>
            <tr>
              <th className="w-[220px] text-left">ENV configured</th>
              <td>{health ? yesNo(health.envConfigured) : '—'}</td>
            </tr>
            <tr>
              <th className="text-left">URL present</th>
              <td>{health ? yesNo(health.urlPresent) : '—'}</td>
            </tr>
            <tr>
              <th className="text-left">ANON key present</th>
              <td>{health ? yesNo(health.anonKeyPresent) : '—'}</td>
            </tr>
            <tr>
              <th className="text-left">Connection status</th>
              <td>
                {health ? (
                  <Badge type={statusBadgeType(health.status)}>
                    {formatStatusLabel(health.status)}
                  </Badge>
                ) : (
                  '—'
                )}
              </td>
            </tr>
            <tr>
              <th className="text-left">Connection message</th>
              <td className="text-sm text-[var(--color-text-muted)]">
                {health?.connectionMessage || '—'}
              </td>
            </tr>
            <tr>
              <th className="text-left">Last checked at</th>
              <td>{health?.checkedAt ? new Date(health.checkedAt).toLocaleString() : '—'}</td>
            </tr>
            <tr>
              <th className="text-left">Safe-mode note</th>
              <td className="text-sm text-[var(--color-text-muted)]">
                {health?.safeModeNote || '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </TablePanel>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--color-text-main)]">Live Read-only UAT Status</h3>
        <Badge type="success">Phase 3C</Badge>
      </div>

      <TablePanel>
        <table className="tgm-table">
          <tbody>
            <tr>
              <th className="w-[220px] text-left">Total pages in scope</th>
              <td>{uatStatus.totalPages}</td>
            </tr>
            <tr>
              <th className="text-left">Passed</th>
              <td>
                <Badge type="success">{uatStatus.passed}</Badge>
              </td>
            </tr>
            <tr>
              <th className="text-left">Failed</th>
              <td>
                <Badge type={uatStatus.failed > 0 ? 'danger' : 'neutral'}>{uatStatus.failed}</Badge>
              </td>
            </tr>
            <tr>
              <th className="text-left">Blocked</th>
              <td>
                <Badge type={uatStatus.blocked > 0 ? 'warning' : 'neutral'}>{uatStatus.blocked}</Badge>
              </td>
            </tr>
            <tr>
              <th className="text-left">Safe-mode active</th>
              <td>{yesNo(uatStatus.safeModeActive)}</td>
            </tr>
            <tr>
              <th className="text-left">Express write-back disabled</th>
              <td>{yesNo(uatStatus.expressWriteBackDisabled)}</td>
            </tr>
            <tr>
              <th className="text-left">Environment status</th>
              <td>{uatStatus.environmentStatus}</td>
            </tr>
            <tr>
              <th className="text-left">Supabase health (snapshot)</th>
              <td>
                <Badge type={uatStatus.supabaseHealthStatus === 'ok' ? 'success' : 'warning'}>
                  {uatStatus.supabaseHealthStatus}
                </Badge>
              </td>
            </tr>
            <tr>
              <th className="text-left">Last UAT update</th>
              <td>{new Date(uatStatus.lastUpdated).toLocaleString()}</td>
            </tr>
            <tr>
              <th className="text-left">Tester</th>
              <td>{uatStatus.tester}</td>
            </tr>
          </tbody>
        </table>
      </TablePanel>

      <TablePanel title="UAT page results">
        <table className="tgm-table">
          <thead>
            <tr>
              <th>Page</th>
              <th>Route</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {uatPages.map((row) => (
              <tr key={row.route}>
                <td>{row.page}</td>
                <td className="font-mono text-xs">{row.route}</td>
                <td>
                  <Badge
                    type={
                      row.result === 'PASS'
                        ? 'success'
                        : row.result === 'BLOCKED'
                          ? 'warning'
                          : 'danger'
                    }
                  >
                    {row.result}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>

      <Alert variant="info">
        Setup guide: <code className="rounded bg-black/5 px-1">docs/09_SUPABASE_ENV_SETUP.md</code>.
        Live UAT checklist: <code className="rounded bg-black/5 px-1">docs/10_LIVE_READONLY_VALIDATION_PLAN.md</code>.
        UAT execution: <code className="rounded bg-black/5 px-1">docs/11_LIVE_READONLY_UAT_EXECUTION.md</code>.
        Issue log: <code className="rounded bg-black/5 px-1">docs/12_LIVE_READONLY_UAT_ISSUE_LOG.md</code>.
      </Alert>
    </section>
  );
}
