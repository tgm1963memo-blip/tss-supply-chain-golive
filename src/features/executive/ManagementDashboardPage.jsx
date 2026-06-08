import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import StatusBadge from '../../components/scm-ui/StatusBadge.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  getManagementDashboardMetrics,
  isSupabaseConfigured,
} from '../../services/executive/executiveDashboardService.js';

const operationCards = [
  {
    title: 'Sales Overview',
    path: '/executive/sales-overview',
    status: 'Live',
    statusType: 'success',
    body: 'SO lines, open/reserved/released counts, top customers and products.',
  },
  {
    title: 'Reservation Workbench',
    path: '/planning/reservation',
    status: 'Live',
    statusType: 'success',
    body: 'SO candidates, fulfillment candidates, active reservations (safe mode).',
  },
  {
    title: 'Picking & Packing',
    path: '/warehouse/wms/picking-packing',
    status: 'Read-only',
    statusType: 'neutral',
    body: 'WMS picking list, SO pick-pack candidates, confirm-pick preview.',
  },
  {
    title: 'Stock Overview',
    path: '/executive/stock-overview',
    status: 'Live',
    statusType: 'success',
    body: 'On-hand, reserved, available totals and shortage signals.',
  },
  {
    title: 'Shortage Overview',
    path: '/executive/shortage-overview',
    status: 'Live',
    statusType: 'success',
    body: 'Demand lines with shortage_qty from pick-pack candidate view.',
  },
  {
    title: 'CONSI Overview',
    path: '/executive/consi-overview',
    status: 'Preview',
    statusType: 'neutral',
    body: 'Branch stock, sell-out, return, and CN adjust preview structure.',
  },
  {
    title: 'Return / CN',
    path: '/sales/return-cn',
    status: 'Preview',
    statusType: 'neutral',
    body: 'Return intake, CN review queues, reason tracking.',
  },
  {
    title: 'WMS Operations',
    path: '/warehouse/wms',
    status: 'Read-only',
    statusType: 'neutral',
    body: 'Receiving, putaway, transfer, picking, dispatch document lists.',
  },
  {
    title: 'Order Fulfillment',
    path: '/executive/order-fulfillment',
    status: 'Live',
    statusType: 'success',
    body: 'SO → reservation → picking → dispatch pipeline (read-only).',
  },
];

function formatQty(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function ManagementDashboardPage() {
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
        const data = await getManagementDashboardMetrics();
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

  const kpis = metrics?.kpis || [
    ['SO Lines', '—', 'Connect Supabase for live KPIs'],
    ['Active Reservations', '—', 'Connect Supabase for live KPIs'],
    ['Shortage Lines', '—', 'Connect Supabase for live KPIs'],
    ['Ready to Pick', '—', 'Connect Supabase for live KPIs'],
  ];

  const pipelineRows = metrics?.fulfillment?.pipeline || [
    { stage: 'SO Candidate', count: '—', status: 'draft', owner: 'Sales' },
    { stage: 'Active Reservation', count: '—', status: 'draft', owner: 'Planning' },
    { stage: 'Pick Candidate', count: '—', status: 'draft', owner: 'Picking' },
  ];

  return (
    <section className="tgm-page">
      <PageHeader
        title="Management Dashboard"
        description="Executive control tower migrated from SCM DashboardPage — read-only safe mode."
        actions={<Badge type="neutral">Read-only</Badge>}
      />

      <Alert variant="warning">
        Read-only executive dashboard. No confirm pick, dispatch, goods issue, stock deduction, ledger posting, or Express/DBF write-back.
      </Alert>

      {!isSupabaseConfigured() && (
        <Alert variant="warning">
          Supabase not configured — live KPIs unavailable. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
        </Alert>
      )}

      {loading && <Alert variant="info">Loading live metrics from Supabase views...</Alert>}
      {error ? <Alert variant="danger">{error.message}</Alert> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.slice(0, 4).map(([label, value, detail]) => (
          <KpiCard
            key={label}
            label={label}
            value={typeof value === 'number' ? formatQty(value) : value}
            detail={detail}
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {operationCards.map((card) => (
          <Link
            key={card.title}
            className="tgm-card-padded group transition hover:border-[var(--color-primary)]/40 hover:shadow-md"
            to={card.path}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-[var(--color-text-main)] group-hover:text-[var(--color-primary-hover)]">
                {card.title}
              </h2>
              <Badge type={card.statusType}>{card.status}</Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">{card.body}</p>
          </Link>
        ))}
      </div>

      <TablePanel title="Order Fulfillment Pipeline (Read-only)">
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
            {pipelineRows.map((row) => (
              <tr key={row.stage}>
                <td className="font-semibold text-[var(--color-text-main)]">{row.stage}</td>
                <td className="text-right tabular-nums text-[var(--color-text-muted)]">
                  {typeof row.count === 'number' ? formatQty(row.count) : row.count}
                </td>
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
    </section>
  );
}
