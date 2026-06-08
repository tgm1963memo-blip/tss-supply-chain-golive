import { useEffect, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import {
  listDemandPlanningCandidates,
  getDemandPlanningSummary,
  isSupabaseConfigured,
} from '../../services/planning/demandPlanningService.js';

function formatQty(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export default function ShortageReviewPage() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured()) {
        setError('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const filters = { onlyShortage: true };
        const [candidates, summaryData] = await Promise.all([
          listDemandPlanningCandidates(filters),
          getDemandPlanningSummary(filters),
        ]);
        setRows(candidates);
        setSummary(summaryData);
      } catch (err) {
        setError(err.message || 'Failed to load shortage data');
        setRows([]);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="Shortage Review"
        description="Read-only review of demand lines with shortage_qty &gt; 0 from sc_so_pick_pack_candidate_view."
      />

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-medium">Read-only — Safe Mode</p>
        <p className="mt-1">Derived from demand planning shortage filter. No reservation or stock posting actions.</p>
      </div>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Shortage Lines" value={summary.shortStockLines} />
          <SummaryCard label="Total Shortage Qty" value={formatQty(summary.totalShortageQty)} highlight="danger" />
          <SummaryCard label="Total Required Qty" value={formatQty(summary.totalRequiredQty)} />
          <SummaryCard label="Total Available Qty" value={formatQty(summary.totalAvailableQty)} highlight="success" />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
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
                <th className="px-4 py-3 text-right">Reserved</th>
                <th className="px-4 py-3 text-right">Shortage</th>
                <th className="px-4 py-3">WH / LOC</th>
                <th className="px-4 py-3">Pick Readiness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]/40 text-[var(--color-text-muted)]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center">Loading shortage lines...</td>
                </tr>
              ) : null}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center">No shortage lines found.</td>
                </tr>
              ) : null}
              {!loading && rows.map((row) => (
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
                  <td className="whitespace-nowrap px-4 py-3 text-right text-blue-600">{formatQty(row.reserved_qty)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-rose-600">{formatQty(row.shortage_qty)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{row.wh_room || '-'}/{row.wh_location || '-'}</td>
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

function SummaryCard({ label, value, highlight }) {
  const valueClass = highlight === 'danger'
    ? 'text-rose-600'
    : highlight === 'success'
      ? 'text-emerald-600'
      : 'text-[var(--color-text-main)]';

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <p className="text-xs font-medium uppercase text-[var(--color-text-muted)]">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}
