import { useEffect, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  createConsignmentSoRequest,
  isSupabaseConfigured,
  listConsignmentSoOrders,
  listConsignmentSoRequests,
} from '../../services/consignment/consignmentService.js';

const INITIAL_FORM = {
  branchCode: '',
  customerCode: '',
  customerName: '',
  deliveryDate: '',
  productCode: '',
  productName: '',
  qty: '',
  note: '',
};

function fmt(v) {
  return Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function ConsignmentSOPage() {
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
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
      const [orderRows, requestRows] = await Promise.all([
        listConsignmentSoOrders(),
        listConsignmentSoRequests(),
      ]);
      setOrders(orderRows);
      setRequests(requestRows);
    } catch (err) {
      setError(err);
      setOrders([]);
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
    if (!form.customerCode || !form.productCode || !form.qty) {
      setError(new Error('Customer, product code, and qty are required.'));
      return;
    }

    setSubmitting(true);
    try {
      const created = await createConsignmentSoRequest({
        branchCode: form.branchCode,
        customerCode: form.customerCode,
        customerName: form.customerName,
        deliveryDate: form.deliveryDate || null,
        note: form.note,
        lines: [{
          productCode: form.productCode,
          productName: form.productName || form.productCode,
          qty: form.qty,
        }],
      });
      setMessage(`Request ${created.requestNo} submitted — Express queue blocked_by_governance.`);
      setForm(INITIAL_FORM);
      setTab('requests');
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
        title="Consignment SO"
        description="Read consignment SO from Express sync; submit new SO as Supabase request only."
        actions={
          <>
            <Badge type="neutral">REQUEST ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />

      <Alert variant="warning">
        Consignment SO creation does not post to Express. Requests are stored with express_queue_status = blocked_by_governance.
      </Alert>

      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="danger">{error.message || String(error)}</Alert> : null}

      <div className="flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-3">
        <button type="button" className={`btn ${tab === 'orders' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('orders')}>
          Express SO (Read)
        </button>
        <button type="button" className={`btn ${tab === 'request' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('request')}>
          New SO Request
        </button>
        <button type="button" className={`btn ${tab === 'requests' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('requests')}>
          Submitted Requests
        </button>
      </div>

      {loading ? <Alert variant="info">Loading consignment SO...</Alert> : null}

      {tab === 'orders' ? (
        <TablePanel title="Consignment SO from Express">
          <div className="overflow-x-auto">
            <table className="tgm-table whitespace-nowrap min-w-max">
              <thead>
                <tr>
                  <th>SO No</th>
                  <th>Customer</th>
                  <th>Doc Date</th>
                  <th>Delivery</th>
                  <th className="text-right">Lines</th>
                  <th className="text-right">Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono">{row.soNo}</td>
                    <td>{row.customerName || row.customerCode}</td>
                    <td>{row.docDate || '—'}</td>
                    <td>{row.deliveryDate || '—'}</td>
                    <td className="text-right">{row.lineCount}</td>
                    <td className="text-right">{fmt(row.totalQty)}</td>
                    <td><Badge type="neutral">{row.status || 'synced'}</Badge></td>
                  </tr>
                ))}
                {!loading && orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[var(--color-text-muted)]">
                      No CONSI SO in Express sync — empty rows returned safely.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </TablePanel>
      ) : null}

      {tab === 'request' ? (
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] md:grid-cols-2"
        >
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
            <span className="text-[var(--color-text-muted)]">Product Code *</span>
            <input className="tgm-input w-full font-mono" value={form.productCode} onChange={(e) => updateField('productCode', e.target.value)} required />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--color-text-muted)]">Qty (kg) *</span>
            <input type="number" step="0.01" className="tgm-input w-full" value={form.qty} onChange={(e) => updateField('qty', e.target.value)} required />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--color-text-muted)]">Delivery Date</span>
            <input type="date" className="tgm-input w-full" value={form.deliveryDate} onChange={(e) => updateField('deliveryDate', e.target.value)} />
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="text-[var(--color-text-muted)]">Note</span>
            <textarea className="tgm-input w-full" rows={2} value={form.note} onChange={(e) => updateField('note', e.target.value)} />
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              Submit SO Request (Blocked by Governance)
            </button>
          </div>
        </form>
      ) : null}

      {tab === 'requests' ? (
        <TablePanel title="Consignment SO Requests">
          <div className="overflow-x-auto">
            <table className="tgm-table whitespace-nowrap min-w-max">
              <thead>
                <tr>
                  <th>Request No</th>
                  <th>Customer</th>
                  <th>Branch</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Express Queue</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono">{row.requestNo}</td>
                    <td>{row.customerName || row.customerCode}</td>
                    <td>{row.branchCode || '—'}</td>
                    <td>{row.requestDate || '—'}</td>
                    <td><Badge type="neutral">{row.status}</Badge></td>
                    <td><Badge type="warning">{row.expressQueueStatus}</Badge></td>
                  </tr>
                ))}
                {!loading && requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--color-text-muted)]">No SO requests yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </TablePanel>
      ) : null}
    </section>
  );
}
