import { useEffect, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  createConsignmentMovementRequest,
  isSupabaseConfigured,
  listConsignmentMovementRequests,
  listConsignmentMovements,
} from '../../services/consignment/consignmentMovementService.js';

const INITIAL_FORM = {
  movementType: 'temp_dn',
  branchCode: '',
  customerCode: '',
  productCode: '',
  qty: '',
  referenceNo: '',
  reason: '',
};

function fmt(v) {
  return Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function ConsignmentMovementPage() {
  const [movements, setMovements] = useState([]);
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
      const [mvRows, reqRows] = await Promise.all([
        listConsignmentMovements(),
        listConsignmentMovementRequests(),
      ]);
      setMovements(mvRows);
      setRequests(reqRows);
    } catch (err) {
      setError(err);
      setMovements([]);
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
    if (!form.productCode || !form.qty) {
      setError(new Error('Product code and qty are required.'));
      return;
    }

    setSubmitting(true);
    try {
      const created = await createConsignmentMovementRequest(form);
      setMessage(`Movement request ${created.requestNo} submitted — no Express posting.`);
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
        title="Consignment Movement"
        description="Temp DN / branch transfer workbench — read Express transfers, submit movement requests only."
        actions={
          <>
            <Badge type="neutral">REQUEST ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />

      <Alert variant="warning">
        Consignment movements do not post to Express. Temp DN and replenishment requests use express_queue_status = blocked_by_governance.
      </Alert>

      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="danger">{error.message || String(error)}</Alert> : null}

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] md:grid-cols-2"
      >
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-[var(--color-text-muted)]">Movement Type</span>
          <select className="tgm-input w-full" value={form.movementType} onChange={(e) => updateField('movementType', e.target.value)}>
            <option value="temp_dn">Temp DN</option>
            <option value="branch_transfer">Branch Transfer</option>
            <option value="replenishment">Replenishment</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Branch Code</span>
          <input className="tgm-input w-full" value={form.branchCode} onChange={(e) => updateField('branchCode', e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Customer Code</span>
          <input className="tgm-input w-full" value={form.customerCode} onChange={(e) => updateField('customerCode', e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Product Code *</span>
          <input className="tgm-input w-full font-mono" value={form.productCode} onChange={(e) => updateField('productCode', e.target.value)} required />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Qty *</span>
          <input type="number" step="0.01" className="tgm-input w-full" value={form.qty} onChange={(e) => updateField('qty', e.target.value)} required />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Reference No</span>
          <input className="tgm-input w-full" value={form.referenceNo} onChange={(e) => updateField('referenceNo', e.target.value)} />
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-[var(--color-text-muted)]">Reason</span>
          <textarea className="tgm-input w-full" rows={2} value={form.reason} onChange={(e) => updateField('reason', e.target.value)} />
        </label>
        <div className="md:col-span-2">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            Submit Movement Request
          </button>
        </div>
      </form>

      <TablePanel title="Express CONSI Movements (Read)">
        {loading ? <Alert variant="info">Loading movements...</Alert> : null}
        <div className="overflow-x-auto">
          <table className="tgm-table whitespace-nowrap min-w-max">
            <thead>
              <tr>
                <th>Document</th>
                <th>Type</th>
                <th>SKU</th>
                <th>From → To</th>
                <th className="text-right">Qty</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((row) => (
                <tr key={row.id}>
                  <td className="font-mono">{row.documentNo}</td>
                  <td>{row.documentType}</td>
                  <td className="font-mono">{row.productCode}</td>
                  <td>{row.fromWarehouse || '—'} → {row.toWarehouse || '—'}</td>
                  <td className="text-right">{fmt(row.qty)}</td>
                  <td><Badge type="neutral">{row.status}</Badge></td>
                </tr>
              ))}
              {!loading && movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--color-text-muted)]">No CONSI movements in sync.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </TablePanel>

      <TablePanel title="Movement Requests">
        <div className="overflow-x-auto">
          <table className="tgm-table whitespace-nowrap min-w-max">
            <thead>
              <tr>
                <th>Request No</th>
                <th>Type</th>
                <th>Branch</th>
                <th>SKU</th>
                <th className="text-right">Qty</th>
                <th>Status</th>
                <th>Express Queue</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((row) => (
                <tr key={row.id}>
                  <td className="font-mono">{row.requestNo}</td>
                  <td>{row.movementType}</td>
                  <td>{row.branchCode || '—'}</td>
                  <td className="font-mono">{row.productCode}</td>
                  <td className="text-right">{fmt(row.qty)}</td>
                  <td><Badge type="neutral">{row.status}</Badge></td>
                  <td><Badge type="warning">{row.expressQueueStatus}</Badge></td>
                </tr>
              ))}
              {!loading && requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--color-text-muted)]">No movement requests yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </TablePanel>
    </section>
  );
}
