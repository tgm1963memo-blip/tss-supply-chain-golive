import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import StatusBadge from '../../components/scm-ui/StatusBadge.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  approveSampleRequest,
  createSampleDraft,
  getSampleRequest,
  listSampleApprovalLogs,
  listSampleRequests,
  rejectSampleRequest,
  SAMPLE_UNITS,
  searchCustomersForSample,
  setSampleDispatchStatus,
  submitSampleRequest,
  updateSampleDraft,
} from '../../services/sales/sampleConsumableService.js';

const EMPTY_ITEM = { sku_code: '', sku_name: '', qty: 1, unit: 'กก.', note: '' };

const EMPTY_FORM = {
  request_no: '',
  request_date: new Date().toISOString().slice(0, 10),
  customer_code: '',
  customer_name: '',
  contact_person: '',
  phone: '',
  purpose: '',
  delivery_date: '',
  delivery_address: '',
  note: '',
  status: 'draft',
  requester: 'Current User',
  items: [{ ...EMPTY_ITEM }],
};

function Field({ label, children, span = 1 }) {
  const spanClass = span === 2 ? 'col-span-2' : span === 3 ? 'col-span-3' : '';
  return (
    <label className={`flex flex-col gap-1 text-sm ${spanClass}`.trim()}>
      <span className="text-[var(--color-text-muted)]">{label}</span>
      {children}
    </label>
  );
}

export default function SampleConsumablePage() {
  const [view, setView] = useState('list');
  const [tab, setTab] = useState('all');
  const [filter, setFilter] = useState('');
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [requestId, setRequestId] = useState(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [approvalLogs, setApprovalLogs] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const readOnly = useMemo(() => ['approved', 'rejected', 'received', 'cancelled'].includes(form.status), [form.status]);
  const canEdit = useMemo(() => ['draft', 'pending'].includes(form.status), [form.status]);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRequests(await listSampleRequests());
    } catch (err) {
      setError(err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'list') loadList();
  }, [view, loadList]);

  const filteredList = useMemo(() => {
    const q = filter.trim().toLowerCase();
    let rows = requests;
    if (tab === 'pending') rows = rows.filter((r) => r.status === 'pending');
    if (tab === 'dispatch') rows = rows.filter((r) => ['approved', 'preparing'].includes(r.status));
    if (q) {
      rows = rows.filter(
        (r) =>
          (r.customer_name || '').toLowerCase().includes(q) ||
          (r.customer_code || '').toLowerCase().includes(q) ||
          (r.request_no || '').toLowerCase().includes(q),
      );
    }
    return rows;
  }, [requests, tab, filter]);

  const kpis = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    dispatch: requests.filter((r) => ['preparing', 'dispatched'].includes(r.status)).length,
  }), [requests]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateItem(index, patch) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  }

  async function runCustomerSearch() {
    if (!customerSearch.trim()) return;
    setLoading(true);
    try {
      setCustomerResults(await searchCustomersForSample(customerSearch));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  function selectCustomer(row) {
    updateField('customer_code', row.customer_code);
    updateField('customer_name', row.customer_name);
    setCustomerResults([]);
    setCustomerSearch(row.customer_code);
  }

  async function openRequest(id) {
    setLoading(true);
    setError(null);
    try {
      const data = await getSampleRequest(id);
      setForm({ ...EMPTY_FORM, ...data, items: data.items?.length ? data.items : [{ ...EMPTY_ITEM }] });
      setRequestId(id);
      setApprovalLogs(await listSampleApprovalLogs(id));
      setView('form');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  function startNew() {
    setForm({ ...EMPTY_FORM, request_no: `SR-${Date.now().toString().slice(-6)}` });
    setRequestId(null);
    setApprovalLogs([]);
    setView('form');
  }

  async function saveDraft() {
    setLoading(true);
    setError(null);
    try {
      const payload = { ...form, items: form.items.filter((i) => i.sku_code && Number(i.qty) > 0) };
      const saved = requestId ? await updateSampleDraft(requestId, payload) : await createSampleDraft(payload);
      setForm({ ...EMPTY_FORM, ...saved, items: saved.items?.length ? saved.items : [{ ...EMPTY_ITEM }] });
      setRequestId(saved.id);
      setMessage('Draft saved. No stock deduction or goods issue to Express.');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  async function runWorkflow(actionFn, successMessage) {
    if (!requestId) return;
    setLoading(true);
    try {
      const saved = await actionFn(requestId, approvalComment);
      setForm({ ...EMPTY_FORM, ...saved, items: saved.items || [] });
      setApprovalLogs(await listSampleApprovalLogs(requestId));
      setApprovalComment('');
      setMessage(successMessage);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  if (view === 'list') {
    return (
      <section className="tgm-page space-y-4">
        <PageHeader
          title="Sample & Consumable / ขอสินค้าตัวอย่าง"
          description="Legacy pgSample — sample_requests workflow in Supabase."
          actions={
            <>
              <Badge type="info">REQUEST ONLY</Badge>
              <Badge type="warning">SAFE MODE</Badge>
              <button type="button" className="tgm-btn tgm-btn-primary" onClick={startNew}>+ New Request</button>
            </>
          }
        />
        <Alert variant="warning">No stock deduction, goods issue, picking confirmation, or ledger posting to Express.</Alert>
        <div className="grid gap-4 md:grid-cols-4">
          <KpiCard label="All Requests" value={kpis.total} />
          <KpiCard label="Pending Approval" value={kpis.pending} />
          <KpiCard label="Approved" value={kpis.approved} />
          <KpiCard label="Preparing / Dispatched" value={kpis.dispatch} />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending Approval' },
            { id: 'dispatch', label: 'Prepare / Dispatch' },
          ].map((t) => (
            <button key={t.id} type="button" className={`tgm-btn tgm-btn-sm${tab === t.id ? ' tgm-btn-primary' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
          <input className="tgm-input ml-auto" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search customer / request no" />
        </div>
        {error ? <Alert variant="danger">{error.message}</Alert> : null}
        <TablePanel title="Sample requests">
          <table className="tgm-table">
            <thead>
              <tr>
                <th>Request No.</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Purpose</th>
                <th>Delivery Date</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredList.map((row) => (
                <tr key={row.id}>
                  <td className="font-mono">{row.request_no || '—'}</td>
                  <td>{row.request_date || '—'}</td>
                  <td>{row.customer_name || row.customer_code || '—'}</td>
                  <td>{(row.purpose || '').slice(0, 40)}</td>
                  <td>{row.delivery_date || '—'}</td>
                  <td><StatusBadge status={row.status} /></td>
                  <td><button type="button" className="tgm-btn tgm-btn-sm" onClick={() => openRequest(row.id)}>Open</button></td>
                </tr>
              ))}
              {filteredList.length === 0 && <tr><td colSpan={7} className="text-center py-5 text-[var(--color-text-muted)]">No requests.</td></tr>}
            </tbody>
          </table>
        </TablePanel>
      </section>
    );
  }

  return (
    <section className="tgm-page space-y-4">
      <PageHeader title="Sample Request Form" description="Legacy _srRenderForm fields" actions={<><Badge type="info">REQUEST ONLY</Badge><Badge type="warning">SAFE MODE</Badge></>} />
      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="danger">{error.message}</Alert> : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" className="tgm-btn" onClick={() => setView('list')}>Back</button>
        {canEdit && (
          <>
            <button type="button" className="tgm-btn" onClick={saveDraft} disabled={loading}>Save Draft</button>
            {requestId && form.status === 'draft' && (
              <button type="button" className="tgm-btn tgm-btn-primary" onClick={() => runWorkflow(submitSampleRequest, 'Submitted for approval.')} disabled={loading}>Submit for Approval</button>
            )}
          </>
        )}
        {form.status === 'pending' && (
          <>
            <button type="button" className="tgm-btn tgm-btn-primary" onClick={() => runWorkflow(approveSampleRequest, 'Approved.')} disabled={loading}>Approve</button>
            <button type="button" className="tgm-btn" onClick={() => runWorkflow(rejectSampleRequest, 'Rejected.')} disabled={loading}>Reject</button>
          </>
        )}
        {form.status === 'approved' && (
          <button type="button" className="tgm-btn tgm-btn-primary" onClick={() => runWorkflow((id, c) => setSampleDispatchStatus(id, 'preparing', c), 'Preparing.')} disabled={loading}>Start Preparing</button>
        )}
        {form.status === 'preparing' && (
          <button type="button" className="tgm-btn tgm-btn-primary" onClick={() => runWorkflow((id, c) => setSampleDispatchStatus(id, 'dispatched', c), 'Dispatched.')} disabled={loading}>Mark Dispatched</button>
        )}
        {form.status === 'dispatched' && (
          <button type="button" className="tgm-btn tgm-btn-primary" onClick={() => runWorkflow((id, c) => setSampleDispatchStatus(id, 'received', c), 'Received confirmed.')} disabled={loading}>Confirm Received</button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 border rounded-lg p-4">
        <Field label="Customer search">
          <div className="flex gap-2">
            <input className="tgm-input flex-1" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} disabled={readOnly} />
            <button type="button" className="tgm-btn tgm-btn-sm" onClick={runCustomerSearch} disabled={readOnly}>Search</button>
          </div>
        </Field>
        <Field label="Customer Code *"><input className="tgm-input" value={form.customer_code} onChange={(e) => updateField('customer_code', e.target.value)} disabled={readOnly} /></Field>
        <Field label="Customer Name"><input className="tgm-input" value={form.customer_name} onChange={(e) => updateField('customer_name', e.target.value)} disabled={readOnly} /></Field>
        <Field label="Contact Person"><input className="tgm-input" value={form.contact_person} onChange={(e) => updateField('contact_person', e.target.value)} disabled={readOnly} /></Field>
        <Field label="Phone"><input className="tgm-input" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} disabled={readOnly} /></Field>
        <Field label="Delivery Date *"><input type="date" className="tgm-input" value={form.delivery_date || ''} onChange={(e) => updateField('delivery_date', e.target.value)} disabled={readOnly} /></Field>
        <Field label="Purpose *" span={3}><textarea className="tgm-input min-h-[68px]" value={form.purpose} onChange={(e) => updateField('purpose', e.target.value)} disabled={readOnly} placeholder="ทดสอบสูตรใหม่, ทดลองตลาด..." /></Field>
        <Field label="Delivery Address" span={2}><input className="tgm-input" value={form.delivery_address} onChange={(e) => updateField('delivery_address', e.target.value)} disabled={readOnly} /></Field>
        <Field label="Note"><input className="tgm-input" value={form.note} onChange={(e) => updateField('note', e.target.value)} disabled={readOnly} /></Field>
      </div>

      {customerResults.length > 0 && (
        <TablePanel title="Customer search results">
          <table className="tgm-table">
            <tbody>
              {customerResults.map((row) => (
                <tr key={row.customer_code}>
                  <td className="font-mono">{row.customer_code}</td>
                  <td>{row.customer_name}</td>
                  <td><button type="button" className="tgm-btn tgm-btn-sm" onClick={() => selectCustomer(row)}>Select</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TablePanel>
      )}

      <TablePanel title="Sample Items / รายการสินค้าตัวอย่าง">
        <table className="tgm-table">
          <thead>
            <tr><th>SKU Code</th><th>SKU Name</th><th>Qty</th><th>Unit</th><th>Note</th><th /></tr>
          </thead>
          <tbody>
            {form.items.map((item, index) => (
              <tr key={index}>
                <td><input className="tgm-input" value={item.sku_code} onChange={(e) => updateItem(index, { sku_code: e.target.value })} disabled={readOnly} /></td>
                <td><input className="tgm-input" value={item.sku_name} onChange={(e) => updateItem(index, { sku_name: e.target.value })} disabled={readOnly} /></td>
                <td><input type="number" className="tgm-input w-24" value={item.qty} onChange={(e) => updateItem(index, { qty: e.target.value })} disabled={readOnly} /></td>
                <td>
                  <select className="tgm-input" value={item.unit} onChange={(e) => updateItem(index, { unit: e.target.value })} disabled={readOnly}>
                    {SAMPLE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </td>
                <td><input className="tgm-input" value={item.note} onChange={(e) => updateItem(index, { note: e.target.value })} disabled={readOnly} /></td>
                <td>{canEdit && form.items.length > 1 ? <button type="button" className="tgm-btn tgm-btn-sm" onClick={() => setForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== index) }))}>Remove</button> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {canEdit && (
          <button type="button" className="tgm-btn tgm-btn-sm mt-3" onClick={() => setForm((p) => ({ ...p, items: [...p.items, { ...EMPTY_ITEM }] }))}>+ Add Item</button>
        )}
      </TablePanel>

      <TablePanel title="Approval Timeline">
        <textarea className="tgm-input w-full mb-3 min-h-[60px]" value={approvalComment} onChange={(e) => setApprovalComment(e.target.value)} placeholder="Comment" />
        <table className="tgm-table">
          <thead><tr><th>When</th><th>Action</th><th>From</th><th>To</th><th>Actor</th><th>Comment</th></tr></thead>
          <tbody>
            {approvalLogs.map((log) => (
              <tr key={log.id}>
                <td>{log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</td>
                <td>{log.action}</td>
                <td>{log.from_status || '—'}</td>
                <td>{log.to_status || '—'}</td>
                <td>{log.actor_name || '—'}</td>
                <td>{log.comment || '—'}</td>
              </tr>
            ))}
            {approvalLogs.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-[var(--color-text-muted)]">No actions yet.</td></tr>}
          </tbody>
        </table>
      </TablePanel>
    </section>
  );
}
