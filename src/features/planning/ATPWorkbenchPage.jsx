import { useEffect, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import { getAtpSummary, getAtpWorkbenchRows } from '../../services/atp/atpWorkbenchService.js';

function fmt(v) {
  return Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function ATPWorkbenchPage() {
  const [rows, setRows] = useState([]);
  const [source, setSource] = useState('seed');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAtpWorkbenchRows()
      .then(({ rows: data, source: src }) => {
        setRows(data);
        setSource(src);
        setSummary(getAtpSummary(data));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="ATP Workbench"
        description="Available-to-Promise: ATP = On Hand − Reserved − Pending SO. Read-only calculation."
        actions={<Badge type="neutral">Read-only</Badge>}
      />

      <Alert variant="warning">
        Read-only ATP workbench. No reservation, no stock posting, no PO/production creation.
        Formula: <strong>ATP = On Hand − Reserved − Pending SO</strong>
      </Alert>

      {source === 'seed' ? (
        <Alert variant="info">Using seed data — configure Supabase for live inventory and SO views.</Alert>
      ) : null}

      {loading ? <Alert variant="info">Calculating ATP...</Alert> : null}

      {summary ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="SKU Lines" value={summary.skuCount} />
          <KpiCard label="Shortage Lines" value={summary.shortageLines} />
          <KpiCard label="Low ATP" value={summary.lowAtpLines} />
          <KpiCard label="OK" value={summary.okLines} />
        </div>
      ) : null}

      <TablePanel title="ATP by SKU">
        <table className="tgm-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th className="text-right">On Hand</th>
              <th className="text-right">Reserved</th>
              <th className="text-right">Pending SO</th>
              <th className="text-right">Available</th>
              <th className="text-right">ATP</th>
              <th className="text-right">Shortage</th>
              <th>Suggested Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.sku}>
                <td className="font-mono">{row.sku}</td>
                <td className="max-w-[180px] truncate">{row.productName}</td>
                <td className="text-right">{fmt(row.onHand)}</td>
                <td className="text-right text-blue-600">{fmt(row.reserved)}</td>
                <td className="text-right">{fmt(row.pendingSo)}</td>
                <td className="text-right">{fmt(row.available)}</td>
                <td className={`text-right font-semibold ${row.atp < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {fmt(row.atp)}
                </td>
                <td className="text-right text-rose-600">{fmt(row.shortage)}</td>
                <td className="text-sm">{row.suggestedAction}</td>
              </tr>
            ))}
            {rows.length === 0 && !loading ? (
              <tr>
                <td colSpan={9} className="py-6 text-center text-[var(--color-text-muted)]">No ATP data</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TablePanel>
    </section>
  );
}
