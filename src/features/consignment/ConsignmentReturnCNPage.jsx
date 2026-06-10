import { useEffect, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  createConsignmentReturnCnRequest,
  isSupabaseConfigured,
  listConsignmentReturnCnRequests,
} from '../../services/consignment/consignmentReturnCnService.js';

const EMPTY_LINE = { productCode: '', productName: '', qty: '', unit: 'กก.', lotNo: '', lineReason: '' };

const INITIAL_FORM = {
  branchCode: '',
  customerCode: '',
  customerName: '',
  invoiceRef: '',
  reason: '',
  stockImpactFlag: true,
  internalNote: '',
  lines: [{ ...EMPTY_LINE }],
};

function fmt(v) {
  return Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function ConsignmentReturnCNPage() {
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
      setRequests(await listConsignmentReturnCnRequests());
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

  function updateLine(index, field, value) {
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line, i) => (i === index ? { ...line, [field]: value } : line)),
    }));
  }

  function addLine() {
    setForm((current) => ({ ...current, lines: [...current.lines, { ...EMPTY_LINE }] }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!isSupabaseConfigured()) {
      setError(new Error('Supabase is not configured.'));
      return;
    }
    if (!form.customerCode || !form.lines.some((l) => l.productCode && l.qty)) {
      setError(new Error('Customer and at least one line with product/qty are required.'));
      return;
    }

    setSubmitting(true);
    try {
      const created = await createConsignmentReturnCnRequest({
        ...form,
        lines: form.lines.filter((l) => l.productCode && l.qty),
      });
      setMessage(`CONSI CN request ${created.requestNo} submitted — no Express CN posting.`);
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
        title="CONSI Return / CN"
        description="Consignment credit note requests — legacy cn-adjust workflow, Supabase request only."
        actions={
          <>
            <Badge type="neutral">REQUEST ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />

      <Alert variant="warning">
        CONSI return/CN does not post to Express ARMAS/CN. express_queue_status = blocked_by_governance on all requests.
      </Alert>

      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="danger">{error.message || String(error)}</Alert> : null}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-[var(--color-text-muted)]">Branch Code</span>
            <input className="tgm-input w-full" value={form.branchCode} onChange={(e) => updateField('branchCode', e.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--color-text-muted)]">Customer Code *</span>
            <input className="tgm-input w-full" value={form.customerCode} onChange={(e) => updateField('customerCode', e.target.value)} required />
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="text-[var(--color-text-muted)]">Customer Name</span>
            <input className="tgm-input w-full" value={form.customerName} onChange={(e) => updateField('customerName', e.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--color-text-muted)]">Invoice Ref</span>
            <input className="tgm-input w-full" value={form.invoiceRef} onChange={(e) => updateField('invoiceRef', e.target.value)} />
          </label>
          <label className="space-y-1 text-sm flex items-end gap-2">
            <input type="checkbox" checked={form.stockImpactFlag} onChange={(e) => updateField('stockImpactFlag', e.target.checked)} />
            <span>Stock impact flagged (no posting enabled)</span>
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="text-[var(--color-text-muted)]">Reason</span>
            <textarea className="tgm-input w-full" rows={2} value={form.reason} onChange={(e) => updateField('reason', e.target.value)} />
          </label>
        </div>

        <div className="border-t border-[var(--color-border)] pt-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium">CN Lines</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>Add Line</button>
          </div>
          <div className="overflow-x-auto">
            <table className="tgm-table whitespace-nowrap min-w-max">
              <thead>
                <tr>
                  <th>SKU *</th>
                  <th>Product Name</th>
                  <th>Qty *</th>
                  <th>Unit</th>
                  <th>Lot</th>
                  <th>Line Reason</th>
                </tr>
              </thead>
              <tbody>
                {form.lines.map((line, index) => (
                  <tr key={index}>
                    <td>
                      <input className="tgm-input w-full font-mono text-sm" value={line.productCode} onChange={(e) => updateLine(index, 'productCode', e.target.value)} />
                    </td>
                    <td>
                      <input className="tgm-input w-full text-sm" value={line.productName} onChange={(e) => updateLine(index, 'productName', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" step="0.01" className="tgm-input w-24 text-sm" value={line.qty} onChange={(e) => updateLine(index, 'qty', e.target.value)} />
                    </td>
                    <td>
                      <input className="tgm-input w-20 text-sm" value={line.unit} onChange={(e) => updateLine(index, 'unit', e.target.value)} />
                    </td>
                    <td>
                      <input className="tgm-input w-28 text-sm" value={line.lotNo} onChange={(e) => updateLine(index, 'lotNo', e.target.value)} />
                    </td>
                    <td>
                      <input className="tgm-input w-full text-sm" value={line.lineReason} onChange={(e) => updateLine(index, 'lineReason', e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Internal Note</span>
          <textarea className="tgm-input w-full" rows={2} value={form.internalNote} onChange={(e) => updateField('internalNote', e.target.value)} />
        </label>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          Submit CONSI CN Request
        </button>
      </form>

      <TablePanel title="CONSI Return / CN Requests">
        {loading ? <Alert variant="info">Loading CN requests...</Alert> : null}
        <div className="overflow-x-auto">
          <table className="tgm-table whitespace-nowrap min-w-max">
            <thead>
              <tr>
                <th>Request No</th>
                <th>Date</th>
                <th>Branch</th>
                <th>Customer</th>
                <th>Invoice Ref</th>
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
                  <td>{row.invoiceRef || '—'}</td>
                  <td><Badge type="neutral">{row.status}</Badge></td>
                  <td><Badge type="warning">{row.expressQueueStatus}</Badge></td>
                </tr>
              ))}
              {!loading && requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--color-text-muted)]">No CONSI CN requests yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </TablePanel>
    </section>
  );
}
