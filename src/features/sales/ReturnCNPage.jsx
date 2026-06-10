import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import StatusBadge from '../../components/scm-ui/StatusBadge.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  approveReturnCn,
  createReturnCnDraft,
  getReturnCnRequest,
  listReturnCnApprovalLogs,
  listReturnCnRequests,
  rejectReturnCn,
  requestReturnCnRevision,
  searchCustomersForReturn,
  submitReturnCn,
  updateReturnCnDraft,
} from '../../services/sales/returnCnService.js';

const EMPTY_LINE = { product_code: '', product_name: '', qty: '', unit: 'กก.', lot_no: '', line_reason: '' };

const EMPTY_FORM = {
  request_no: '',
  request_date: new Date().toISOString().slice(0, 10),
  request_type: 'return',
  reason: '',
  customer_code: '',
  customer_name: '',
  invoice_ref: '',
  stock_impact_flag: false,
  status: 'draft',
  express_queue_status: 'blocked_by_governance',
  requester: 'Current User',
  internal_note: '',
  lines: [{ ...EMPTY_LINE }],
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

export default function ReturnCNPage() {
  const [view, setView] = useState('list');
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

  const readOnly = useMemo(() => ['approved', 'rejected', 'cancelled'].includes(form.status), [form.status]);
  const canEdit = useMemo(() => ['draft', 'revision_requested'].includes(form.status), [form.status]);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRequests(await listReturnCnRequests());
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

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateLine(index, patch) {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    }));
  }

  function addLine() {
    setForm((prev) => ({ ...prev, lines: [...prev.lines, { ...EMPTY_LINE }] }));
  }

  function removeLine(index) {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.length > 1 ? prev.lines.filter((_, i) => i !== index) : prev.lines,
    }));
  }

  async function runCustomerSearch() {
    if (!customerSearch.trim()) return;
    setLoading(true);
    try {
      setCustomerResults(await searchCustomersForReturn(customerSearch));
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
      const data = await getReturnCnRequest(id);
      setForm({ ...EMPTY_FORM, ...data, lines: data.lines?.length ? data.lines : [{ ...EMPTY_LINE }] });
      setRequestId(id);
      setApprovalLogs(await listReturnCnApprovalLogs(id));
      setView('form');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  function startNew() {
    setForm({ ...EMPTY_FORM, request_no: `RCN-${Date.now().toString().slice(-6)}` });
    setRequestId(null);
    setApprovalLogs([]);
    setApprovalComment('');
    setView('form');
  }

  async function saveDraft() {
    setLoading(true);
    setError(null);
    setMessage('');
    try {
      const payload = { ...form, lines: form.lines.filter((l) => l.product_code || l.qty) };
      const saved = requestId
        ? await updateReturnCnDraft(requestId, payload)
        : await createReturnCnDraft(payload);
      setForm({ ...EMPTY_FORM, ...saved, lines: saved.lines?.length ? saved.lines : [{ ...EMPTY_LINE }] });
      setRequestId(saved.id);
      setMessage('Draft saved to Supabase. Express CN posting remains BLOCKED_BY_GOVERNANCE.');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  async function runWorkflow(actionFn, successMessage) {
    if (!requestId) return;
    setLoading(true);
    setError(null);
    try {
      const saved = await actionFn(requestId, approvalComment);
      setForm({ ...EMPTY_FORM, ...saved, lines: saved.lines || [] });
      setApprovalLogs(await listReturnCnApprovalLogs(requestId));
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
          title="Return / CN / คืนสินค้า-ใบลดหนี้"
          description="CN/Return request workflow — Supabase only. No Express ARTRN post."
          actions={
            <>
              <Badge type="info">REQUEST ONLY</Badge>
              <Badge type="warning">SAFE MODE</Badge>
              <button type="button" className="tgm-btn tgm-btn-primary" onClick={startNew}>+ New Request</button>
            </>
          }
        />
        <Alert variant="warning">
          Draft CN/return requests are stored in Supabase only. Express queue status is always blocked_by_governance — no live CN post to Express.
        </Alert>
        {loading && <Alert variant="info">Loading...</Alert>}
        {error ? <Alert variant="danger">{error.message}</Alert> : null}
        <TablePanel title="Return / CN requests">
          <table className="tgm-table">
            <thead>
              <tr>
                <th>Request No.</th>
                <th>Type</th>
                <th>Customer</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Express Queue</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {requests.map((row) => (
                <tr key={row.id}>
                  <td className="font-mono">{row.request_no || '—'}</td>
                  <td>{row.request_type}</td>
                  <td>{row.customer_name || row.customer_code || '—'}</td>
                  <td>{(row.reason || '').slice(0, 40) || '—'}</td>
                  <td><StatusBadge status={row.status} /></td>
                  <td><Badge type="warning">{row.express_queue_status || 'blocked'}</Badge></td>
                  <td><button type="button" className="tgm-btn tgm-btn-sm" onClick={() => openRequest(row.id)}>Open</button></td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr><td colSpan={7} className="text-center py-5 text-[var(--color-text-muted)]">No requests yet.</td></tr>
              )}
            </tbody>
          </table>
        </TablePanel>
      </section>
    );
  }

  return (
    <section className="tgm-page space-y-4">
      <PageHeader
        title="Return / CN Request"
        description="Legacy cn-return workflow — request form with lines and approval."
        actions={<><Badge type="info">REQUEST ONLY</Badge><Badge type="warning">SAFE MODE</Badge></>}
      />
      <Alert variant="warning">No return receiving, stock update, or Express CN write-back from this page.</Alert>
      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="danger">{error.message}</Alert> : null}

      <div className="flex flex-wrap gap-2 sticky top-0 z-10 bg-[var(--color-bg)] py-2">
        <button type="button" className="tgm-btn" onClick={() => setView('list')}>Back to List</button>
        {canEdit && (
          <>
            <button type="button" className="tgm-btn" onClick={saveDraft} disabled={loading}>Save Draft</button>
            {requestId && (
              <button type="button" className="tgm-btn tgm-btn-primary" onClick={() => runWorkflow(submitReturnCn, 'Submitted.')} disabled={loading}>
                Submit for Approval
              </button>
            )}
          </>
        )}
        {form.status === 'submitted' && (
          <>
            <button type="button" className="tgm-btn tgm-btn-primary" onClick={() => runWorkflow(approveReturnCn, 'Approved (Supabase only).')} disabled={loading}>Approve</button>
            <button type="button" className="tgm-btn" onClick={() => runWorkflow(rejectReturnCn, 'Rejected.')} disabled={loading}>Reject</button>
            <button type="button" className="tgm-btn" onClick={() => runWorkflow(requestReturnCnRevision, 'Revision requested.')} disabled={loading}>Request Revision</button>
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Field label="Request No."><input className="tgm-input" value={form.request_no} onChange={(e) => updateField('request_no', e.target.value)} disabled={readOnly} /></Field>
        <Field label="Request Date"><input type="date" className="tgm-input" value={form.request_date || ''} onChange={(e) => updateField('request_date', e.target.value)} disabled={readOnly} /></Field>
        <Field label="Type">
          <select className="tgm-input" value={form.request_type} onChange={(e) => updateField('request_type', e.target.value)} disabled={readOnly}>
            <option value="return">Return / คืนสินค้า</option>
            <option value="cn">CN / ใบลดหนี้</option>
          </select>
        </Field>
        <Field label="Invoice Ref"><input className="tgm-input" value={form.invoice_ref} onChange={(e) => updateField('invoice_ref', e.target.value)} disabled={readOnly} /></Field>
        <Field label="Requester"><input className="tgm-input" value={form.requester} disabled /></Field>
        <Field label="Status"><input className="tgm-input" value={form.status} disabled /></Field>
        <Field label="Reason" span={3}><textarea className="tgm-input min-h-[68px]" value={form.reason} onChange={(e) => updateField('reason', e.target.value)} disabled={readOnly} /></Field>
        <Field label="Internal Note" span={3}><textarea className="tgm-input min-h-[68px]" value={form.internal_note} onChange={(e) => updateField('internal_note', e.target.value)} disabled={readOnly} /></Field>
        <label className="flex items-center gap-2 text-sm col-span-3">
          <input type="checkbox" checked={form.stock_impact_flag} onChange={(e) => updateField('stock_impact_flag', e.target.checked)} disabled={readOnly} />
          Stock impact flag (request metadata only — no stock posting)
        </label>
      </div>

      <TablePanel title="Customer lookup (read-only sc_web_customer_master_view)">
        <div className="flex gap-2 mb-3">
          <input className="tgm-input flex-1" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Customer code or name" disabled={readOnly} />
          <button type="button" className="tgm-btn" onClick={runCustomerSearch} disabled={readOnly}>Search</button>
        </div>
        <div className="grid gap-2 md:grid-cols-2 mb-3">
          <Field label="Customer Code"><input className="tgm-input" value={form.customer_code} onChange={(e) => updateField('customer_code', e.target.value)} disabled={readOnly} /></Field>
          <Field label="Customer Name"><input className="tgm-input" value={form.customer_name} onChange={(e) => updateField('customer_name', e.target.value)} disabled={readOnly} /></Field>
        </div>
        {customerResults.length > 0 && (
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
        )}
      </TablePanel>

      <TablePanel title="Return / CN Lines">
        <table className="tgm-table">
          <thead>
            <tr>
              <th>Product Code</th>
              <th>Product Name</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Lot</th>
              <th>Line Reason</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {form.lines.map((line, index) => (
              <tr key={index}>
                <td><input className="tgm-input" value={line.product_code} onChange={(e) => updateLine(index, { product_code: e.target.value })} disabled={readOnly} /></td>
                <td><input className="tgm-input" value={line.product_name} onChange={(e) => updateLine(index, { product_name: e.target.value })} disabled={readOnly} /></td>
                <td><input type="number" className="tgm-input w-24" value={line.qty} onChange={(e) => updateLine(index, { qty: e.target.value })} disabled={readOnly} /></td>
                <td><input className="tgm-input w-20" value={line.unit} onChange={(e) => updateLine(index, { unit: e.target.value })} disabled={readOnly} /></td>
                <td><input className="tgm-input" value={line.lot_no} onChange={(e) => updateLine(index, { lot_no: e.target.value })} disabled={readOnly} /></td>
                <td><input className="tgm-input" value={line.line_reason} onChange={(e) => updateLine(index, { line_reason: e.target.value })} disabled={readOnly} /></td>
                <td>{canEdit && form.lines.length > 1 ? <button type="button" className="tgm-btn tgm-btn-sm" onClick={() => removeLine(index)}>Remove</button> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {canEdit && <button type="button" className="tgm-btn tgm-btn-sm mt-3" onClick={addLine}>+ Add Line</button>}
      </TablePanel>

      <TablePanel title="Approval Timeline">
        <textarea className="tgm-input w-full mb-3 min-h-[60px]" value={approvalComment} onChange={(e) => setApprovalComment(e.target.value)} placeholder="Approval comment" disabled={readOnly && form.status !== 'submitted'} />
        <table className="tgm-table">
          <thead>
            <tr><th>When</th><th>Action</th><th>From</th><th>To</th><th>Actor</th><th>Comment</th></tr>
          </thead>
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
            {approvalLogs.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-[var(--color-text-muted)]">No approval actions yet.</td></tr>}
          </tbody>
        </table>
      </TablePanel>
    </section>
  );
}
