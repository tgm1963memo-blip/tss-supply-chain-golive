import { useCallback, useEffect, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import { checkSupabaseHealth } from '../../services/system/supabaseHealthService.js';
import { getExpressSyncStatus } from '../../services/system/expressSyncStatusService.js';
import { getHumanUatStatus, getUatPageResults, getUatStatusSummary } from '../../services/system/uatStatusService.js';

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

function humanUatBadgeType(status) {
  if (status === 'signed_off') return 'success';
  if (status === 'in_progress') return 'info';
  return 'warning';
}

function formatDecisionLabel(value) {
  if (!value || value === 'pending') return 'Pending';
  return String(value).replace(/_/g, ' ').toUpperCase();
}

function formatRecommendedLabel(value) {
  if (!value) return '—';
  return String(value).replace(/_/g, ' ').toUpperCase();
}

function governanceLabel(value, recommended) {
  if (!value || value === 'pending') {
    return recommended ? `Pending (recommended: Option ${recommended})` : 'Pending';
  }
  if (value === 'A') return 'Option A — Planner creates active; manager release/cancel';
  if (value === 'B') return 'Option B — Planner draft; manager activate/release/cancel';
  if (value === 'C') return 'Option C — Create disabled for first go-live';
  if (value === 'D') return 'Option D — Other';
  return value;
}

function formatCount(value) {
  if (value === null || value === undefined) return '—';
  return Number(value).toLocaleString();
}

export default function SystemControlPage() {
  const uatStatus = getUatStatusSummary();
  const humanUat = getHumanUatStatus();
  const uatPages = getUatPageResults();
  const [health, setHealth] = useState(null);
  const [expressSync, setExpressSync] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expressLoading, setExpressLoading] = useState(false);
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

  const runExpressSyncCheck = useCallback(async () => {
    setExpressLoading(true);
    try {
      const result = await getExpressSyncStatus();
      setExpressSync(result);
    } catch (err) {
      setExpressSync({
        configured: false,
        message: err?.message || 'Express sync status check failed',
        readOnlyModeActive: true,
        expressWriteBackDisabled: true,
      });
    } finally {
      setExpressLoading(false);
    }
  }, []);

  useEffect(() => {
    runHealthCheck();
    runExpressSyncCheck();
  }, [runHealthCheck, runExpressSyncCheck]);

  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="System Control"
        description="Production readiness checks for Supabase environment and read-only live validation."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
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
        <h3 className="text-sm font-semibold text-[var(--color-text-main)]">Express Sync Status</h3>
        <button
          type="button"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          onClick={runExpressSyncCheck}
          disabled={expressLoading}
        >
          {expressLoading ? 'Checking…' : 'Refresh sync status'}
        </button>
      </div>

      {expressSync?.message ? <Alert variant="info">{expressSync.message}</Alert> : null}

      <TablePanel>
        <table className="tgm-table">
          <tbody>
            <tr>
              <th className="w-[220px] text-left">Express sync configured</th>
              <td>{expressSync ? yesNo(expressSync.configured) : '—'}</td>
            </tr>
            <tr>
              <th className="text-left">Room code</th>
              <td>{expressSync?.roomCode || 'TSS'}</td>
            </tr>
            <tr>
              <th className="text-left">Last sync time</th>
              <td>
                {expressSync?.lastSyncTime
                  ? new Date(expressSync.lastSyncTime).toLocaleString()
                  : '—'}
              </td>
            </tr>
            <tr>
              <th className="text-left">Products synced</th>
              <td>{formatCount(expressSync?.productsSynced)}</td>
            </tr>
            <tr>
              <th className="text-left">Customers synced</th>
              <td>{formatCount(expressSync?.customersSynced)}</td>
            </tr>
            <tr>
              <th className="text-left">Stock rows synced</th>
              <td>{formatCount(expressSync?.stockRowsSynced)}</td>
            </tr>
            <tr>
              <th className="text-left">SO headers synced</th>
              <td>{formatCount(expressSync?.soHeadersSynced)}</td>
            </tr>
            <tr>
              <th className="text-left">SO lines synced</th>
              <td>{formatCount(expressSync?.soLinesSynced)}</td>
            </tr>
            <tr>
              <th className="text-left">Failed records</th>
              <td>{formatCount(expressSync?.failedRecords)}</td>
            </tr>
            <tr>
              <th className="text-left">Read-only mode active</th>
              <td>{yesNo(expressSync?.readOnlyModeActive ?? true)}</td>
            </tr>
            <tr>
              <th className="text-left">Express write-back disabled</th>
              <td>{yesNo(expressSync?.expressWriteBackDisabled ?? true)}</td>
            </tr>
            <tr>
              <th className="text-left">Setup guide</th>
              <td className="font-mono text-xs">docs/20_EXPRESS_READONLY_SYNC_SETUP.md</td>
            </tr>
          </tbody>
        </table>
      </TablePanel>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--color-text-main)]">Automated Sync Agent</h3>
        <Badge type="neutral">Phase 3J</Badge>
      </div>

      {expressSync?.automatedSyncAgent?.notInstalledMessage ? (
        <Alert variant="info">{expressSync.automatedSyncAgent.notInstalledMessage}</Alert>
      ) : null}

      <TablePanel>
        <table className="tgm-table">
          <tbody>
            <tr>
              <th className="w-[220px] text-left">Agent mode</th>
              <td>{expressSync?.automatedSyncAgent?.agentMode || 'Unknown'}</td>
            </tr>
            <tr>
              <th className="text-left">Last active rolling sync</th>
              <td>
                {expressSync?.automatedSyncAgent?.lastActiveRollingSync
                  ? new Date(expressSync.automatedSyncAgent.lastActiveRollingSync).toLocaleString()
                  : '—'}
              </td>
            </tr>
            <tr>
              <th className="text-left">Last master sync</th>
              <td>
                {expressSync?.automatedSyncAgent?.lastMasterSync
                  ? new Date(expressSync.automatedSyncAgent.lastMasterSync).toLocaleString()
                  : '—'}
              </td>
            </tr>
            <tr>
              <th className="text-left">Last read model refresh</th>
              <td>
                {expressSync?.automatedSyncAgent?.lastReadModelRefresh
                  ? new Date(expressSync.automatedSyncAgent.lastReadModelRefresh).toLocaleString()
                  : '—'}
              </td>
            </tr>
            <tr>
              <th className="text-left">Historical sync completed</th>
              <td>
                {expressSync?.automatedSyncAgent?.historicalSyncCompleted === null
                  ? '—'
                  : yesNo(expressSync?.automatedSyncAgent?.historicalSyncCompleted)}
              </td>
            </tr>
            <tr>
              <th className="text-left">Failed records</th>
              <td>{formatCount(expressSync?.automatedSyncAgent?.failedRecords ?? expressSync?.failedRecords)}</td>
            </tr>
            <tr>
              <th className="text-left">Read-only mode active</th>
              <td>{yesNo(expressSync?.automatedSyncAgent?.readOnlyModeActive ?? true)}</td>
            </tr>
            <tr>
              <th className="text-left">Express write-back disabled</th>
              <td>{yesNo(expressSync?.automatedSyncAgent?.expressWriteBackDisabled ?? true)}</td>
            </tr>
            <tr>
              <th className="text-left">Automation guide</th>
              <td className="font-mono text-xs">docs/22_AUTOMATED_EXPRESS_SYNC_AGENT.md</td>
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--color-text-main)]">Recommended go-live position</h3>
        <Badge type="info">Phase 3F</Badge>
      </div>

      <TablePanel>
        <table className="tgm-table">
          <tbody>
            <tr>
              <th className="w-[220px] text-left">Recommended decision</th>
              <td>
                <Badge type="info">{formatRecommendedLabel(humanUat.recommendedDecision)}</Badge>
              </td>
            </tr>
            <tr>
              <th className="text-left">Final human decision</th>
              <td>
                <Badge type={humanUat.decision === 'pending' ? 'warning' : 'success'}>
                  {formatDecisionLabel(humanUat.decision)}
                </Badge>
              </td>
            </tr>
            <tr>
              <th className="text-left">Reservation governance (recommended)</th>
              <td className="text-sm text-[var(--color-text-muted)]">
                Option {humanUat.recommendedReservationGovernance} — Planner draft; manager activate/release/cancel
              </td>
            </tr>
            <tr>
              <th className="text-left">WMS/CONSI limitation (recommended)</th>
              <td className="text-sm text-[var(--color-text-muted)]">
                {formatRecommendedLabel(humanUat.recommendedWmsConsiDecision)}
              </td>
            </tr>
            <tr>
              <th className="text-left">Express Weight</th>
              <td>
                <Badge type="success">Disabled</Badge>
                <span className="ml-2 text-sm text-[var(--color-text-muted)]">DEC-002 approved</span>
              </td>
            </tr>
            <tr>
              <th className="text-left">Readiness checklist</th>
              <td className="font-mono text-xs">{humanUat.readinessChecklist}</td>
            </tr>
          </tbody>
        </table>
      </TablePanel>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--color-text-main)]">Human UAT Sign-off</h3>
        <Badge type={humanUatBadgeType(humanUat.status)}>{humanUat.statusLabel}</Badge>
      </div>

      <TablePanel>
        <table className="tgm-table">
          <tbody>
            <tr>
              <th className="w-[220px] text-left">Human UAT status</th>
              <td>
                <Badge type={humanUatBadgeType(humanUat.status)}>{humanUat.statusLabel}</Badge>
              </td>
            </tr>
            <tr>
              <th className="text-left">Sign-off document</th>
              <td className="font-mono text-xs">{humanUat.signoffDocument}</td>
            </tr>
            <tr>
              <th className="text-left">Signed off</th>
              <td>{yesNo(humanUat.signedOff)}</td>
            </tr>
            <tr>
              <th className="text-left">Decision</th>
              <td>
                <Badge type={humanUat.decision === 'pending' ? 'warning' : 'success'}>
                  {formatDecisionLabel(humanUat.decision)}
                </Badge>
              </td>
            </tr>
            <tr>
              <th className="text-left">Reservation governance</th>
              <td className="text-sm text-[var(--color-text-muted)]">
                {governanceLabel(humanUat.reservationGovernance, humanUat.reservationGovernanceRecommended)}
              </td>
            </tr>
            <tr>
              <th className="text-left">Decision register</th>
              <td className="font-mono text-xs">{humanUat.decisionRegister}</td>
            </tr>
            <tr>
              <th className="text-left">Open issues</th>
              <td>{humanUat.openIssues?.join(', ') || 'None'}</td>
            </tr>
            <tr>
              <th className="text-left">Open non-blocking issues</th>
              <td>
                {humanUat.openNonBlockingIssues.length === 0 ? (
                  'None'
                ) : (
                  <ul className="list-disc space-y-1 pl-4 text-sm text-[var(--color-text-muted)]">
                    {humanUat.openNonBlockingIssues.map((issue) => (
                      <li key={issue.id}>
                        <strong>{issue.id}</strong> — {issue.page}: {issue.summary}
                      </li>
                    ))}
                  </ul>
                )}
              </td>
            </tr>
            <tr>
              <th className="text-left">Accepted limitations</th>
              <td>
                <ul className="list-disc space-y-1 pl-4 text-sm text-[var(--color-text-muted)]">
                  {humanUat.acceptedLimitations.map((item) => (
                    <li key={item.id}>
                      <strong>{item.id}</strong> — {item.pages}: {item.summary}
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
            <tr>
              <th className="text-left">UAT-004 (open)</th>
              <td className="text-sm text-[var(--color-text-muted)]">
                Reservation Workbench — governance pending (DEC-001)
              </td>
            </tr>
            <tr>
              <th className="text-left">UAT-003 (accepted)</th>
              <td className="text-sm text-[var(--color-text-muted)]">
                WMS / CONSI preview-only — design limitation (DEC-003)
              </td>
            </tr>
            <tr>
              <th className="text-left">Closed issues (Phase 3D)</th>
              <td>{humanUat.closedIssues.join(', ')}</td>
            </tr>
            <tr>
              <th className="text-left">Safe-mode active</th>
              <td>{yesNo(humanUat.safeModeActive)}</td>
            </tr>
            <tr>
              <th className="text-left">Express write-back disabled</th>
              <td>{yesNo(humanUat.expressWriteBackDisabled)}</td>
            </tr>
            <tr>
              <th className="text-left">Last update</th>
              <td>{new Date(humanUat.lastUpdated).toLocaleString()}</td>
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
        Human sign-off: <code className="rounded bg-black/5 px-1">docs/13_HUMAN_UAT_SIGNOFF.md</code>.
        Decision register: <code className="rounded bg-black/5 px-1">docs/14_GOLIVE_DECISION_REGISTER.md</code>.
        Readiness checklist: <code className="rounded bg-black/5 px-1">docs/15_GOLIVE_READINESS_CHECKLIST.md</code>.<br/>
        Thai UAT Script: <code className="rounded bg-black/5 px-1">docs/17_THAI_UAT_TEST_SCRIPT.md</code>.
        Thai UAT Issue Log: <code className="rounded bg-black/5 px-1">docs/18_THAI_UAT_ISSUE_LOG.md</code>.
        Thai UAT Sign-off: <code className="rounded bg-black/5 px-1">docs/19_THAI_UAT_SIGNOFF_FORM.md</code>.<br/>
        Express sync setup: <code className="rounded bg-black/5 px-1">docs/20_EXPRESS_READONLY_SYNC_SETUP.md</code>.
        Express sync validation: <code className="rounded bg-black/5 px-1">docs/21_EXPRESS_SYNC_UAT_VALIDATION.md</code>.
      </Alert>
    </section>
  );
}
