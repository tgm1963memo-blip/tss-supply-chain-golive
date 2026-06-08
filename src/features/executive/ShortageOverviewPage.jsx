import { useEffect, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import {
  getShortageOverviewMetrics,
  isSupabaseConfigured,
} from '../../services/executive/executiveDashboardService.js';

function formatQty(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export default function ShortageOverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured()) {
        setData(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getShortageOverviewMetrics();
        setData(result);
      } catch (err) {
        setError(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const summary = data?.summary;

  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="Shortage Overview"
        description="Executive shortage view from demandPlanningService (sc_so_pick_pack_candidate_view). Read-only safe mode."
        actions={<Badge type="neutral">Read-only</Badge>}
      />

      <Alert variant="warning">
        Read-only shortage overview. Derived from demand planning shortage filter. No reservation or stock posting actions.
      </Alert>

      {!isSupabaseConfigured() && (
        <Alert variant="warning">
          Supabase not configured — shortage data unavailable. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
        </Alert>
      )}

      {loading && <Alert variant="info">Loading shortage metrics...</Alert>}
      {error ? <Alert variant="danger">{error.message}</Alert> : null}

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Shortage Lines" value={summary.shortStockLines} />
          <KpiCard label="Total Shortage Qty" value={formatQty(summary.totalShortageQty)} />
          <KpiCard label="Total Required Qty" value={formatQty(summary.totalRequiredQty)} />
          <KpiCard label="Total Available Qty" value={formatQty(summary.totalAvailableQty)} />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        <div className="border-b border-[var(--color-border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-main)]">Top Shortage Lines</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
            <thead className="bg-[var(--color-bg)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              <tr>
                <th className="px-4 py-3">Ship Date</th>
                <th className="px-4 py-3">SO / Line</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 text-right">Required</th>
                <th className="px-4 py-3 text-right">Available</th>
                <th className="px-4 py-3 text-right">Shortage</th>
                <th className="px-4 py-3">Pick Readiness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]/40 text-[var(--color-text-muted)]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">Loading shortage lines...</td>
                </tr>
              ) : null}
              {!loading && (!data?.topShortages || data.topShortages.length === 0) ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">No shortage lines found.</td>
                </tr>
              ) : null}
              {!loading && data?.topShortages?.map((row) => (
                <tr key={`${row.so_no}:${row.so_line}:${row.product_code}`}>
                  <td className="whitespace-nowrap px-4 py-3">{row.ship_date || '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="font-mono font-semibold text-[var(--color-text-main)]">{row.so_no || '-'}</div>
                    <div className="text-xs">Line {row.so_line ?? '-'}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div>{row.customer_code || '-'}</div>
                    <div className="text-xs">{row.customer_name || ''}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono">{row.product_code}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{formatQty(row.required_qty)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-emerald-600">{formatQty(row.available_qty)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-rose-600">{formatQty(row.shortage_qty)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{row.pick_readiness || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
