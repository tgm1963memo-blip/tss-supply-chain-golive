import { useEffect, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import { getSalesDashboardMetrics } from '../../services/sales/dashboardService.js';
import { isSupabaseConfigured } from '../../services/executive/executiveDashboardService.js';

function formatQty(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function SalesOverviewPage() {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);
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
        const data = await getSalesDashboardMetrics();
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
        title="Sales Overview"
        description="Executive sales snapshot migrated from SCM ReportsPage (Sales Dashboard tab). Read-only — no mutation."
        actions={<Badge type="neutral">Read-only</Badge>}
      />

      <Alert variant="info">
        Sales Dashboard uses Express sales/SO data via sc_so_reservation_candidate_view. No stock deduction or Express write-back.
      </Alert>

      {!isSupabaseConfigured() && (
        <Alert variant="warning">
          Supabase not configured — KPIs unavailable. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
        </Alert>
      )}

      {loading && <Alert variant="info">Loading live data from Supabase views...</Alert>}
      {error ? <Alert variant="danger">{error.message}</Alert> : null}

      {metrics && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Total SO Lines" value={metrics.soCount} />
            <KpiCard label="Open SO Lines" value={metrics.openCount} />
            <KpiCard label="Reserved SO Lines" value={metrics.reservedCount} />
            <KpiCard label="Released SO Lines" value={metrics.releasedCount} />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <TablePanel title="Top Products (Ordered Qty)">
              <table className="tgm-table">
                <thead>
                  <tr>
                    <th>Product Code</th>
                    <th className="text-right">Ordered Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.topProducts.map(([product, qty]) => (
                    <tr key={product}>
                      <td className="font-mono font-medium">{product || 'N/A'}</td>
                      <td className="text-right">{formatQty(qty)}</td>
                    </tr>
                  ))}
                  {metrics.topProducts.length === 0 && (
                    <tr>
                      <td colSpan={2} className="text-center text-[var(--color-text-muted)] py-4">No data</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TablePanel>

            <TablePanel title="Top Customers (Ordered Qty)">
              <table className="tgm-table">
                <thead>
                  <tr>
                    <th>Customer Code</th>
                    <th className="text-right">Ordered Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.topCustomers.map(([customer, qty]) => (
                    <tr key={customer}>
                      <td className="font-medium">{customer || 'N/A'}</td>
                      <td className="text-right">{formatQty(qty)}</td>
                    </tr>
                  ))}
                  {metrics.topCustomers.length === 0 && (
                    <tr>
                      <td colSpan={2} className="text-center text-[var(--color-text-muted)] py-4">No data</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TablePanel>
          </div>
        </>
      )}
    </section>
  );
}
