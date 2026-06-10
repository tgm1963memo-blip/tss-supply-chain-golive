import { useEffect, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  createSellOutRecord,
  isSupabaseConfigured,
  listSellOutRecords,
  summarizeSellOut,
} from '../../services/consignment/sellOutService.js';

const INITIAL_FORM = {
  branchCode: '',
  customerCode: '',
  customerName: '',
  productCode: '',
  productName: '',
  sellQty: '',
  note: '',
};

function fmt(v) {
  return Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function SellOutRecordPage() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRecords(await listSellOutRecords());
    } catch (err) {
      setError(err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const summary = summarizeSellOut(records);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!isSupabaseConfigured()) {
      setError(new Error('Supabase is not configured.'));
      return;
    }
    if (!form.productCode || !form.sellQty) {
      setError(new Error('Product code and sell qty are required.'));
      return;
    }

    setSubmitting(true);
    try {
      const created = await createSellOutRecord(form);
      setMessage(`Sell-out ${created.requestNo} recorded — no stock posting.`);
      setForm(INITIAL_FORM);
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="Sell-out Record"
        description="Record branch sell-out as Supabase request — legacy CONSI sell-out workflow."
        actions={
          <>
            <Badge type="neutral">REQUEST ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />

      <Alert variant="warning">
        Sell-out records do not update branch stock or post to Express. express_queue_status = blocked_by_governance.
      </Alert>

      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="danger">{error.message || String(error)}</Alert> : null}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Records" value={summary.recordCount} />
        <KpiCard label="Total Sell Qty" value={fmt(summary.totalSellQty)} />
        <KpiCard label="Branches" value={summary.branchCount} />
        <KpiCard label="Pending" value={summary.pendingCount} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] md:grid-cols-2"
      >
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Branch Code</span>
          <input className="tgm-input w-full" value={form.branchCode} onChange={(e) => updateField('branchCode', e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Customer Code</span>
          <input className="tgm-input w-full" value={form.customerCode} onChange={(e) => updateField('customerCode', e.target.value)} />
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-[var(--color-text-muted)]">Customer Name</span>
          <input className="tgm-input w-full" value={form.customerName} onChange={(e) => updateField('customerName', e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Product Code *</span>
          <input className="tgm-input w-full font-mono" value={form.productCode} onChange={(e) => updateField('productCode', e.target.value)} required />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Sell Qty (kg) *</span>
          <input type="number" step="0.01" className="tgm-input w-full" value={form.sellQty} onChange={(e) => updateField('sellQty', e.target.value)} required />
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-[var(--color-text-muted)]">Note</span>
          <textarea className="tgm-input w-full" rows={2} value={form.note} onChange={(e) => updateField('note', e.target.value)} />
        </label>
        <div className="md:col-span-2">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            Submit Sell-out Record
          </button>
        </div>
      </form>

      <TablePanel title="Sell-out Records">
        {loading ? <Alert variant="info">Loading sell-out records...</Alert> : null}
        <div className="overflow-x-auto">
          <table className="tgm-table whitespace-nowrap min-w-max">
            <thead>
              <tr>
                <th>Record No</th>
                <th>Date</th>
                <th>Branch</th>
                <th>Customer</th>
                <th>SKU</th>
                <th className="text-right">Sell Qty</th>
                <th>Status</th>
                <th>Express Queue</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row) => (
                <tr key={row.id}>
                  <td className="font-mono">{row.requestNo}</td>
                  <td>{row.recordDate || '—'}</td>
                  <td>{row.branchCode || '—'}</td>
                  <td>{row.customerName || row.customerCode || '—'}</td>
                  <td className="font-mono">{row.productCode}</td>
                  <td className="text-right">{fmt(row.sellQty)}</td>
                  <td><Badge type="neutral">{row.status}</Badge></td>
                  <td><Badge type="warning">{row.expressQueueStatus}</Badge></td>
                </tr>
              ))}
              {!loading && records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[var(--color-text-muted)]">No sell-out records yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </TablePanel>
    </section>
  );
}
