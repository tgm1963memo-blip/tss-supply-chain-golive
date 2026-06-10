import { useCallback, useEffect, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import { getReceivingSchedule } from '../../services/warehouse/receivingService.js';

function fmt(v) {
  return Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function statusBadge(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'completed') return <Badge type="success">Completed</Badge>;
  if (value === 'in_progress' || value === 'partial') return <Badge type="info">In Progress</Badge>;
  if (value === 'pending') return <Badge type="warning">Pending</Badge>;
  return <Badge type="neutral">{status || 'Synced'}</Badge>;
}

export default function ReceivingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [source, setSource] = useState('seed');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getReceivingSchedule({ search: submittedSearch });
      setRows(result.rows);
      setSummary(result.summary);
      setSource(result.source);
    } finally {
      setLoading(false);
    }
  }, [submittedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleFilterSubmit(event) {
    event.preventDefault();
    setSubmittedSearch(searchTerm);
  }

  return (
    <section className="tgm-page space-y-4">
      <PageHeader
        title="WMS Receiving"
        description="Receiving schedule from sc_express_transfers — GR posting disabled."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />

      <Alert variant="warning">
        View receiving documents only. Goods Receipt posting back to Express is BLOCKED_BY_GOVERNANCE.
      </Alert>

      {source === 'seed' ? (
        <Alert variant="info">Using seed receiving schedule — configure Supabase for sc_express_transfers.</Alert>
      ) : null}

      {summary ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="Documents" value={summary.expectedToday} />
          <KpiCard label="In Progress" value={summary.inProgress} />
          <KpiCard label="Completed" value={summary.completed} />
          <KpiCard label="Discrepancies" value={summary.discrepancies} />
        </div>
      ) : null}

      <TablePanel title="Receiving Schedule">
        <form onSubmit={handleFilterSubmit} className="mb-4 flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-4">
          <input type="date" className="tgm-input text-sm w-40" defaultValue={new Date().toISOString().slice(0, 10)} />
          <input
            type="search"
            className="tgm-input w-64 text-sm"
            placeholder="Search PO/GR Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">Filter</button>
        </form>

        {loading ? <Alert variant="info">Loading receiving schedule...</Alert> : null}

        <div className="overflow-x-auto">
          <table className="tgm-table whitespace-nowrap min-w-max">
            <thead>
              <tr>
                <th>Document No.</th>
                <th>Source</th>
                <th>Supplier / Plant</th>
                <th className="text-right">Expected Qty</th>
                <th className="text-right">Received Qty</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.documentNo}>
                  <td className="font-mono text-brand-600">{row.documentNo}</td>
                  <td>{row.sourceType}</td>
                  <td>{row.supplierName}</td>
                  <td className="text-right">{fmt(row.expectedQty)}</td>
                  <td className="text-right">{fmt(row.receivedQty)}</td>
                  <td>{statusBadge(row.status)}</td>
                </tr>
              ))}
              {rows.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--color-text-muted)]">No receiving documents</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </TablePanel>
    </section>
  );
}
