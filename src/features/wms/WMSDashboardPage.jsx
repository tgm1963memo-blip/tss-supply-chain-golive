import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import { getWmsDashboardData } from '../../services/warehouse/wmsDashboardService.js';

function fmt(v) {
  return Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function WMSDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWmsDashboardData()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="WMS Dashboard"
        description="Legacy pgWMS — live stock from Express sync via Supabase read models."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />

      <Alert variant="warning">
        WMS operations run in Safe Mode. Stock posting, goods issue, and Express write-back remain BLOCKED_BY_GOVERNANCE.
      </Alert>

      {data?.source === 'seed' ? (
        <Alert variant="info">Using seed stock summary — configure Supabase for sc_web_stock_balance_view.</Alert>
      ) : null}

      {loading ? <Alert variant="info">Loading WMS dashboard...</Alert> : null}

      {data?.summary ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="SKU in WMS" value={data.summary.skuCount} />
          <KpiCard label="Total Stock" value={`${fmt(data.summary.totalQty)} kg`} />
          <KpiCard label="Low Stock SKUs" value={data.summary.lowStockSkus} />
          <KpiCard
            label="Last Sync"
            value={new Date(data.summary.syncedAt).toLocaleTimeString()}
          />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(data?.links || []).map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] transition hover:border-brand-400"
          >
            <div className="text-2xl">{link.icon}</div>
            <div className="mt-2 font-medium text-[var(--color-text-main)]">{link.label}</div>
          </Link>
        ))}
      </div>

      <TablePanel title="Stock from WMS (Live)">
        <div className="overflow-x-auto">
          <table className="tgm-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th className="text-right">Qty</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              {(data?.stockRows || []).map((row) => (
                <tr key={row.productCode}>
                  <td className="font-mono text-brand-600">{row.productCode}</td>
                  <td>{row.productName}</td>
                  <td className={`text-right font-semibold ${row.qty < 500 ? 'text-rose-600' : ''}`}>
                    {fmt(row.qty)}
                  </td>
                  <td>{row.unit}</td>
                </tr>
              ))}
              {!loading && (data?.stockRows || []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[var(--color-text-muted)]">No WMS stock rows</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </TablePanel>
    </section>
  );
}
