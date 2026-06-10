import { useEffect, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  createStockAdjustmentRequest,
  listStockAdjustmentRequests,
  isSupabaseConfigured,
} from '../../services/warehouse/stockAdjustmentService.js';

const INITIAL_FORM = {
  productCode: '',
  warehouseCode: '',
  locationCode: '',
  lotNo: '',
  qtyDelta: '',
  reason: '',
  adjustmentType: 'adjustment',
};

function fmt(v) {
  return Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export default function StockAdjustmentPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function loadRequests() {
    setLoading(true);
    setError(null);
    try {
      const rows = await listStockAdjustmentRequests();
      setRequests(rows);
    } catch (err) {
      setError(err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
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

    if (!form.productCode || !form.qtyDelta) {
      setError(new Error('Product code and quantity delta are required.'));
      return;
    }

    setSubmitting(true);
    try {
      const created = await createStockAdjustmentRequest(form);
      setMessage(`Request ${created.requestNo} submitted — Express queue blocked_by_governance.`);
      setForm(INITIAL_FORM);
      await loadRequests();
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="Stock Adjustment"
        description="Request-only stock adjustment workflow — no Express posting."
        actions={
          <>
            <Badge type="warning">REQUEST ONLY</Badge>
            <Badge type="neutral">READ ONLY POSTING</Badge>
          </>
        }
      />

      <Alert variant="warning">
        Adjustments are stored in sc_stock_adjustment_requests only. Express stock posting is BLOCKED_BY_GOVERNANCE.
      </Alert>

      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="danger">{error.message || 'Unable to process adjustment request.'}</Alert> : null}

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Product Code *</span>
          <input className="tgm-input w-full" value={form.productCode} onChange={(e) => updateField('productCode', e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Warehouse</span>
          <input className="tgm-input w-full" value={form.warehouseCode} onChange={(e) => updateField('warehouseCode', e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Location</span>
          <input className="tgm-input w-full" value={form.locationCode} onChange={(e) => updateField('locationCode', e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Lot No</span>
          <input className="tgm-input w-full" value={form.lotNo} onChange={(e) => updateField('lotNo', e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Qty Delta (+/-) *</span>
          <input type="number" step="0.0001" className="tgm-input w-full" value={form.qtyDelta} onChange={(e) => updateField('qtyDelta', e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Type</span>
          <select className="tgm-input w-full" value={form.adjustmentType} onChange={(e) => updateField('adjustmentType', e.target.value)}>
            <option value="adjustment">Adjustment</option>
            <option value="cycle_count">Cycle Count</option>
            <option value="hold">Hold</option>
            <option value="release">Release</option>
          </select>
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-[var(--color-text-muted)]">Reason</span>
          <textarea className="tgm-input w-full min-h-[80px]" value={form.reason} onChange={(e) => updateField('reason', e.target.value)} />
        </label>
        <div className="md:col-span-2">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Adjustment Request'}
          </button>
        </div>
      </form>

      <TablePanel title="Adjustment Requests">
        {loading ? <Alert variant="info">Loading requests...</Alert> : null}
        <div className="overflow-x-auto">
          <table className="tgm-table">
            <thead>
              <tr>
                <th>Request No</th>
                <th>SKU</th>
                <th>WH / Loc</th>
                <th className="text-right">Qty Delta</th>
                <th>Type</th>
                <th>Status</th>
                <th>Express Queue</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((row) => (
                <tr key={row.id}>
                  <td className="font-mono">{row.requestNo}</td>
                  <td className="font-mono">{row.productCode}</td>
                  <td>{row.warehouseCode || '—'}{row.locationCode ? ` / ${row.locationCode}` : ''}</td>
                  <td className="text-right">{fmt(row.qtyDelta)}</td>
                  <td>{row.adjustmentType}</td>
                  <td>{row.status}</td>
                  <td className="text-xs text-amber-700">{row.expressQueueStatus}</td>
                </tr>
              ))}
              {requests.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--color-text-muted)]">No adjustment requests</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </TablePanel>
    </section>
  );
}
