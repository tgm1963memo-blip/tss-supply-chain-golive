import { useEffect, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import StatusBadge from '../../components/scm-ui/StatusBadge.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  getFulfillmentPipelineMetrics,
  isSupabaseConfigured,
} from '../../services/executive/executiveDashboardService.js';

function formatQty(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function OrderFulfillmentPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured()) {
        setMetrics(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getFulfillmentPipelineMetrics();
        setMetrics(data);
      } catch (err) {
        setError(err);
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <section className="tgm-page">
      <PageHeader
        title="Order Fulfillment"
        description="SO → reservation → picking → dispatch pipeline migrated from SCM DashboardPage pipeline view. Read-only safe mode."
        actions={<Badge type="neutral">Read-only</Badge>}
      />

      <Alert variant="warning">
        Read-only fulfillment pipeline. No confirm pick, dispatch posting, goods issue, or Express write-back.
      </Alert>

      {!isSupabaseConfigured() && (
        <Alert variant="warning">
          Supabase not configured — pipeline counts unavailable. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
        </Alert>
      )}

      {loading && <Alert variant="info">Loading fulfillment pipeline metrics...</Alert>}
      {error ? <Alert variant="danger">{error.message}</Alert> : null}

      {metrics && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="SO Candidates" value={metrics.soCandidateCount} />
            <KpiCard label="Open SO (Not Reserved)" value={metrics.openSoCount} />
            <KpiCard label="Active Reservations" value={metrics.activeReservationCount} />
            <KpiCard label="Ready to Pick" value={metrics.readyToPickCount} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Pick Candidates" value={metrics.pickCandidateCount} />
            <KpiCard label="Pick Draft Lines" value={metrics.pickDraftCount} />
            <KpiCard label="WMS Picking Docs" value={metrics.pickingDocCount} />
            <KpiCard label="WMS Dispatch Docs" value={metrics.dispatchDocCount} />
          </div>

          <TablePanel title="Fulfillment Pipeline Stages">
            <table className="tgm-table">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th className="text-right">Count</th>
                  <th>Status</th>
                  <th>Owner</th>
                </tr>
              </thead>
              <tbody>
                {metrics.pipeline.map((row) => (
                  <tr key={row.stage}>
                    <td className="font-semibold text-[var(--color-text-main)]">{row.stage}</td>
                    <td className="text-right tabular-nums">{formatQty(row.count)}</td>
                    <td>
                      <StatusBadge
                        status={row.status}
                        label={String(row.status).charAt(0).toUpperCase() + String(row.status).slice(1)}
                      />
                    </td>
                    <td className="text-[var(--color-text-muted)]">{row.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TablePanel>
        </>
      )}
    </section>
  );
}
