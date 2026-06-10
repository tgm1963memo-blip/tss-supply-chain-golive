import { useEffect, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  createReturnFromBranchRequest,
  isSupabaseConfigured,
  listReturnFromBranchRequests,
} from '../../services/consignment/consignmentReturnCnService.js';

const INITIAL_FORM = {
  branchCode: '',
  customerCode: '',
  customerName: '',
  productCode: '',
  productName: '',
  returnQty: '',
  lotNo: '',
  reason: '',
};

function fmt(v) {
  return Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function ReturnFromBranchPage() {
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRequests(await listReturnFromBranchRequests());
    } catch (err) {
      setError(err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

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
    if (!form.productCode || !form.returnQty) {
      setError(new Error('Product code and return qty are required.'));
      return;
    }

    setSubmitting(true);
    try {
      const created = await createReturnFromBranchRequest(form);
      setMessage(`Return request ${created.requestNo} submitted — no Express GR posting.`);
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
        title="Return from Branch"
        description="Submit branch return requests — legacy CONSI return workflow without stock posting."
        actions={
          <>
            <Badge type="neutral">REQUEST ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />

      <Alert variant="warning">
        Return from branch does not receive stock or post to Express. Requests remain blocked_by_governance until approved.
      </Alert>

      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="danger">{error.message || String(error)}</Alert> : null}

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
          <span className="text-[var(--color-text-muted)]">Return Qty (kg) *</span>
          <input type="number" step="0.01" className="tgm-input w-full" value={form.returnQty} onChange={(e) => updateField('returnQty', e.target.value)} required />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Lot No</span>
          <input className="tgm-input w-full" value={form.lotNo} onChange={(e) => updateField('lotNo', e.target.value)} />
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-[var(--color-text-muted)]">Reason</span>
          <textarea className="tgm-input w-full" rows={2} value={form.reason} onChange={(e) => updateField('reason', e.target.value)} />
        </label>
        <div className="md:col-span-2">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            Submit Return Request
          </button>
        </div>
      </form>

      <TablePanel title="Return from Branch Requests">
        {loading ? <Alert variant="info">Loading return requests...</Alert> : null}
        <div className="overflow-x-auto">
          <table className="tgm-table whitespace-nowrap min-w-max">
            <thead>
              <tr>
                <th>Request No</th>
                <th>Date</th>
                <th>Branch</th>
                <th>Customer</th>
                <th>SKU</th>
                <th className="text-right">Return Qty</th>
                <th>Status</th>
                <th>Express Queue</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((row) => (
                <tr key={row.id}>
                  <td className="font-mono">{row.requestNo}</td>
                  <td>{row.requestDate || '—'}</td>
                  <td>{row.branchCode || '—'}</td>
                  <td>{row.customerName || row.customerCode || '—'}</td>
                  <td className="font-mono">{row.productCode}</td>
                  <td className="text-right">{fmt(row.returnQty)}</td>
                  <td><Badge type="neutral">{row.status}</Badge></td>
                  <td><Badge type="warning">{row.expressQueueStatus}</Badge></td>
                </tr>
              ))}
              {!loading && requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[var(--color-text-muted)]">No return requests yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </TablePanel>
    </section>
  );
}
