import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import StatusBadge from '../../components/scm-ui/StatusBadge.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  getExecutiveDashboardData,
  isSupabaseConfigured,
} from '../../services/executive/executiveDashboardService.js';

const quickLinks = [
  { title: 'Sales Overview', path: '/executive/sales-overview' },
  { title: 'Stock Overview', path: '/executive/stock-overview' },
  { title: 'Shortage Overview', path: '/executive/shortage-overview' },
  { title: 'CONSI Dashboard', path: '/consignment' },
  { title: 'WMS Dashboard', path: '/warehouse/wms' },
  { title: 'Reports Center', path: '/admin/reports' },
  { title: 'Sync Status', path: '/admin/sync-status' },
];

function fmt(v) {
  return Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatSyncTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default function ManagementDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getExecutiveDashboardData()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const pipelineRows = data?.fulfillment?.pipeline || [];

  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="Executive Dashboard"
        description="Legacy pgDash — read-only control tower across sales, stock, planning, CONSI, WMS, and sync."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />

      <Alert variant="warning">
        Executive dashboard is read-only. No stock posting, SO/CN creation, dispatch, or Express write-back from this page.
      </Alert>

      {!isSupabaseConfigured() ? (
        <Alert variant="info">Supabase not configured — showing seed/empty KPI structure.</Alert>
      ) : null}
      {data?.source === 'seed' ? (
        <Alert variant="info">Live Supabase data unavailable — KPI sections show safe defaults.</Alert>
      ) : null}
      {loading ? <Alert variant="info">Loading executive dashboard...</Alert> : null}
      {error ? <Alert variant="danger">{error.message || String(error)}</Alert> : null}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">System Sync</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
          <KpiCard label="Last Express Sync" value={formatSyncTime(data?.sync?.lastSyncTime)} />
          <KpiCard label="SO Headers" value={fmt(data?.sync?.soHeadersSynced)} />
          <KpiCard label="SO Lines" value={fmt(data?.sync?.soLinesSynced)} />
          <KpiCard label="Stock Rows" value={fmt(data?.sync?.stockRowsSynced)} />
          <KpiCard label="Products Synced" value={fmt(data?.sync?.productsSynced)} />
          <KpiCard label="Failed Records" value={fmt(data?.sync?.failedRecords)} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Sales</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="SO Lines" value={fmt(data?.sales?.soCount)} />
          <KpiCard label="Open (Not Reserved)" value={fmt(data?.sales?.openCount)} />
          <KpiCard label="Reserved" value={fmt(data?.sales?.reservedCount)} />
          <KpiCard label="Released" value={fmt(data?.sales?.releasedCount)} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Stock & Shortage</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
          <KpiCard label="Total On Hand" value={fmt(data?.stock?.totalOnHand)} />
          <KpiCard label="Available" value={fmt(data?.stock?.totalAvailable)} />
          <KpiCard label="Reserved" value={fmt(data?.stock?.totalReserved)} />
          <KpiCard label="Balance Lines" value={fmt(data?.stock?.locations)} />
          <KpiCard label="Shortage Lines" value={fmt(data?.shortage?.shortStockLines)} />
          <KpiCard label="Ready to Pick" value={fmt(data?.shortage?.readyToPickLines)} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Forecast, CONSI & WMS</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard label="Forecast Entries" value={fmt(data?.forecast?.forecastCount)} />
          <KpiCard label="Approved Forecasts" value={fmt(data?.forecast?.approvedCount)} />
          <KpiCard label="CONSI Qty (kg)" value={fmt(data?.consignment?.totalQty)} />
          <KpiCard label="CONSI Customers" value={fmt(data?.consignment?.customerCount)} />
          <KpiCard label="WMS SKUs" value={fmt(data?.wms?.skuCount)} />
          <KpiCard label="WMS Low Stock" value={fmt(data?.wms?.lowStockSkus)} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] transition hover:border-brand-400"
          >
            <div className="font-medium">{link.title}</div>
          </Link>
        ))}
      </div>

      <TablePanel title="Order Fulfillment Pipeline (Read-only)">
        <div className="overflow-x-auto">
          <table className="tgm-table whitespace-nowrap min-w-max">
            <thead>
              <tr>
                <th>Stage</th>
                <th className="text-right">Count</th>
                <th>Status</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {pipelineRows.map((row) => (
                <tr key={row.stage}>
                  <td className="font-semibold">{row.stage}</td>
                  <td className="text-right tabular-nums">{fmt(row.count)}</td>
                  <td>
                    <StatusBadge
                      status={row.status}
                      label={String(row.status).charAt(0).toUpperCase() + String(row.status).slice(1)}
                    />
                  </td>
                  <td>{row.owner}</td>
                </tr>
              ))}
              {!loading && pipelineRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[var(--color-text-muted)]">No pipeline data.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </TablePanel>
    </section>
  );
}
