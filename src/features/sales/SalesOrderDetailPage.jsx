import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import StatusBadge from '../../components/scm-ui/StatusBadge.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  getSalesOrderLines,
  isSupabaseConfigured,
} from '../../services/sales/reservationSourceService.js';

function formatQty(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export default function SalesOrderDetailPage() {
  const { orderId } = useParams();
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      if (!orderId) return;

      if (!isSupabaseConfigured()) {
        setError(new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'));
        setLines([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getSalesOrderLines(orderId, { roomCode: 'TSS' });
        setLines(data);
      } catch (err) {
        setError(err);
        setLines([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [orderId]);

  const header = useMemo(() => lines[0] || null, [lines]);
  const summary = useMemo(() => ({
    lineCount: lines.length,
    totalOrdered: lines.reduce((sum, line) => sum + line.orderedQty, 0),
    totalRequested: lines.reduce((sum, line) => sum + line.candidateRequestedQty, 0),
    reservedLines: lines.filter((line) => line.reservationExists).length,
  }), [lines]);

  return (
    <section className="tgm-page">
      <PageHeader
        title={`Sales Order Detail — ${orderId}`}
        description="Read-only line detail from sc_so_reservation_candidate_view. Migrated from SCM reservation candidate model."
        actions={(
          <>
            <Link to="/sales/orders" className="tgm-button-secondary">Back to list</Link>
            <Badge type="neutral">Read-only</Badge>
          </>
        )}
      />

      <Alert variant="warning">
        No stock deduction, reservation creation, or Express write-back on this page.
      </Alert>

      {!isSupabaseConfigured() && (
        <Alert variant="info">Configure Supabase to load live order detail.</Alert>
      )}

      {error ? <Alert variant="danger">{error.message}</Alert> : null}

      {header ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Customer" value={header.customerCode || '-'} />
          <KpiCard label="Document Date" value={header.documentDate || '-'} />
          <KpiCard label="Delivery Date" value={header.deliveryDate || '-'} />
          <KpiCard label="Document Status" value={header.documentStatus || '-'} />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Lines" value={summary.lineCount} />
        <KpiCard label="Total Ordered Qty" value={formatQty(summary.totalOrdered)} />
        <KpiCard label="Total Requested Qty" value={formatQty(summary.totalRequested)} />
        <KpiCard label="Reserved Lines" value={summary.reservedLines} />
      </div>

      <TablePanel title="Order Lines">
        <table className="tgm-table">
          <thead>
            <tr>
              <th>Line</th>
              <th>Product</th>
              <th>Ordered</th>
              <th>Requested</th>
              <th>WH / LOC</th>
              <th>Line Status</th>
              <th>Reservation</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-[var(--color-text-muted)]">Loading...</td>
              </tr>
            ) : null}
            {!loading && lines.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-[var(--color-text-muted)]">
                  No lines found for {orderId}.
                </td>
              </tr>
            ) : null}
            {!loading && lines.map((line) => (
              <tr key={`${line.documentNo}-${line.lineNo}`}>
                <td className="font-mono">{line.lineNo ?? '-'}</td>
                <td className="font-mono">{line.productCode}</td>
                <td>{formatQty(line.orderedQty)}</td>
                <td>{formatQty(line.candidateRequestedQty)}</td>
                <td>{(line.warehouseCode || '-')}/{(line.locationCode || '-')}</td>
                <td><StatusBadge status={line.lineStatus || line.documentStatus} /></td>
                <td>
                  {line.reservationExists ? (
                    <StatusBadge status={line.reservationStatus} />
                  ) : (
                    <span className="text-xs text-[var(--color-text-muted)]">None</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>
    </section>
  );
}
