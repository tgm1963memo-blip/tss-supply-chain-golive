import { useEffect, useState } from 'react';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import Alert from '../../components/scm-ui/Alert.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import { getAtpWorkbenchData } from '../../services/planning/atpWorkbenchService.js';

function fmt(v) {
  return Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function statusBadge(status) {
  if (status === 'stockout') return <Badge type="danger">Stockout</Badge>;
  if (status === 'low') return <Badge type="warning">Low Stock</Badge>;
  return <Badge type="success">Available</Badge>;
}

export default function ATPWorkbenchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [source, setSource] = useState('seed');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAtpWorkbenchData({ search: submittedSearch })
      .then(({ rows: data, summary: sum, source: src }) => {
        setRows(data);
        setSummary(sum);
        setSource(src);
      })
      .finally(() => setLoading(false));
  }, [submittedSearch]);

  function handleFilterSubmit(event) {
    event.preventDefault();
    setSubmittedSearch(searchTerm);
  }

  return (
    <section className="tgm-page space-y-4">
      <PageHeader
        title="ATP Workbench"
        description="Available To Promise from sc_web_atp_view with reservation deduction. Read-only safe mode."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />

      <Alert variant="warning">
        Safe Mode — view ATP calculations only. Stock reservation, SO fulfillment, and Express write-back are disabled.
      </Alert>

      {source === 'seed' ? (
        <Alert variant="info">Using seed ATP sample — configure Supabase for sc_web_atp_view live data.</Alert>
      ) : null}

      {summary ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="Total Stock" value={`${fmt(summary.totalOnHand)} kg`} />
          <KpiCard label="Reserved" value={`${fmt(summary.totalReserved)} kg`} />
          <KpiCard label="ATP Available" value={`${fmt(summary.totalAtp)} kg`} />
          <KpiCard label="Stockout SKUs" value={summary.stockoutCount} />
        </div>
      ) : null}

      <TablePanel title="ATP Inventory Items">
        <form
          onSubmit={handleFilterSubmit}
          className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] pb-4"
        >
          <h3 className="font-semibold text-[var(--color-text-main)]">ATP Inventory Items</h3>
          <div className="flex gap-2">
            <input
              type="text"
              className="tgm-input w-64 text-sm"
              placeholder="Search by SKU Code, Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary">Filter</button>
          </div>
        </form>

        {loading ? <Alert variant="info">Loading ATP data...</Alert> : null}

        <div className="overflow-x-auto">
          <table className="tgm-table whitespace-nowrap min-w-max">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th className="text-right">Total Stock</th>
                <th className="text-right">Reserved</th>
                <th className="text-right">Incoming (PO)</th>
                <th className="text-right">Open SO</th>
                <th className="text-right font-bold text-brand-700">ATP</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.productCode}>
                  <td className="font-mono text-brand-600">{row.productCode}</td>
                  <td className="max-w-[200px] truncate">{row.productName}</td>
                  <td className="text-right">{fmt(row.onHandQty)}</td>
                  <td className="text-right text-red-500">{fmt(row.reservedQty)}</td>
                  <td className="text-right text-blue-500">{fmt(row.incomingPoQty)}</td>
                  <td className="text-right">{fmt(row.openSoQty)}</td>
                  <td className="text-right font-bold text-brand-700">{fmt(row.atpQty)}</td>
                  <td>{statusBadge(row.status)}</td>
                </tr>
              ))}
              {rows.length === 0 && !loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[var(--color-text-muted)]">No ATP rows</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </TablePanel>
    </section>
  );
}
