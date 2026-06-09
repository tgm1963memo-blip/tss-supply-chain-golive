import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import StatusBadge from '../../components/scm-ui/StatusBadge.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  approveCustomerRegistration,
  buildDocumentSlotMetadata,
  createCustomerRegistrationDraft,
  getCustomerRegistrationRequest,
  isStorageConfigured,
  listCustomerRegistrationApprovalLogs,
  listCustomerRegistrationRequests,
  loadExistingCustomerSnapshot,
  rejectCustomerRegistration,
  requestCustomerRegistrationRevision,
  searchExistingCustomers,
  submitCustomerRegistration,
  updateCustomerRegistrationDraft,
} from '../../services/sales/customerRegistrationService.js';
import {
  CR_DOC_SLOTS,
  CUSTREG_REQUEST_TYPES,
  emptyDocumentSlots,
} from '../../constants/customerRegistrationLegacy.js';
import './customer-registration.css';

const REQUEST_TYPES = CUSTREG_REQUEST_TYPES;
const EXISTING_CUSTOMER_TYPES = ['edit_customer', 'add_branch', 'credit_change', 'suspend'];

const EMPTY_FORM = {
  request_no: '',
  request_date: new Date().toISOString().slice(0, 10),
  requester: 'Current User',
  salesperson: '',
  request_type: 'new_customer',
  status: 'draft',
  customer_code_requested: '',
  customer_name_th: '',
  customer_name_en: '',
  corporate_group: '',
  customer_category: '',
  channel: '',
  contact_person: '',
  phone: '',
  email: '',
  line_id: '',
  tax_id: '',
  branch_no: '',
  tax_invoice_name: '',
  billing_address: '',
  province: '',
  district: '',
  subdistrict: '',
  postal_code: '',
  branch_name: '',
  delivery_name: '',
  delivery_address: '',
  delivery_province: '',
  delivery_contact: '',
  delivery_phone: '',
  gps_map_link: '',
  credit_term: '',
  credit_limit_requested: '',
  payment_method: '',
  price_tier: '',
  gp_discount_condition: '',
  billing_cycle: '',
  collection_method: '',
  remark: '',
  doc_business_registration: '',
  doc_tax_certificate: '',
  doc_storefront_photo: '',
  doc_map_location: '',
  doc_other: '',
  internal_note: '',
  drive_link: '',
  attachments_notes: '',
  existing_customer_code: '',
  original_customer_snapshot: null,
  proposed_changes: {},
  document_slots: emptyDocumentSlots(),
  credit_change_requested: '',
  suspend_reason: '',
  final_note: '',
};

function normalizeForm(data) {
  return {
    ...EMPTY_FORM,
    ...data,
    credit_limit_requested: data?.credit_limit_requested ?? '',
    document_slots: data?.document_slots?.length ? data.document_slots : emptyDocumentSlots(),
    original_customer_snapshot: data?.original_customer_snapshot || null,
    proposed_changes: data?.proposed_changes || {},
  };
}

function Field({ label, children, span = 1 }) {
  const spanClass = span === 4 ? 'custreg-field--span4' : span === 3 ? 'custreg-field--span3' : span === 2 ? 'custreg-field--span2' : '';
  return (
    <label className={`custreg-field ${spanClass}`.trim()}>
      <span className="custreg-field__label">{label}</span>
      {children}
    </label>
  );
}

function TextInput(props) {
  return <input {...props} className="tgm-input" />;
}

function TextArea(props) {
  return <textarea {...props} className="tgm-input min-h-[68px]" rows={2} />;
}

function SelectInput(props) {
  return <select {...props} className="tgm-input" />;
}

function FormCard({ titleTh, titleEn, children }) {
  return (
    <section className="custreg-card">
      <div className="custreg-card__head">
        <h2 className="custreg-card__title">
          {titleTh}
          <span className="custreg-card__title-en">/ {titleEn}</span>
        </h2>
      </div>
      <div className="custreg-card__body">{children}</div>
    </section>
  );
}

export default function CustomerRegistrationPage() {
  const [view, setView] = useState('list');
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [requestId, setRequestId] = useState(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [approvalLogs, setApprovalLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [storageNote] = useState(() => !isStorageConfigured());

  const needsExistingCustomer = useMemo(
    () => EXISTING_CUSTOMER_TYPES.includes(form.request_type),
    [form.request_type],
  );

  const readOnly = useMemo(
    () => ['approved', 'rejected', 'cancelled'].includes(form.status),
    [form.status],
  );

  const canEdit = useMemo(
    () => ['draft', 'revision_requested'].includes(form.status),
    [form.status],
  );

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRequests(await listCustomerRegistrationRequests());
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

  async function openRequest(id) {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomerRegistrationRequest(id);
      setForm(normalizeForm(data));
      setRequestId(id);
      setApprovalLogs(await listCustomerRegistrationApprovalLogs(id));
      setApprovalComment('');
      setView('form');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  function startNewRequest() {
    setForm({ ...EMPTY_FORM, request_no: `REG-${6073 + requests.length + 1}` });
    setRequestId(null);
    setApprovalLogs([]);
    setApprovalComment('');
    setView('form');
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateProposedChange(field, value) {
    setForm((prev) => ({
      ...prev,
      proposed_changes: { ...(prev.proposed_changes || {}), [field]: value },
    }));
  }

  function updateDocumentSlot(slotId, patch) {
    setForm((prev) => ({
      ...prev,
      document_slots: (prev.document_slots || emptyDocumentSlots()).map((slot) =>
        slot.id === slotId ? { ...slot, ...patch } : slot,
      ),
    }));
  }

  function handleSlotFiles(slotId, fileList) {
    const files = buildDocumentSlotMetadata(fileList, slotId);
    updateDocumentSlot(slotId, { files });
  }

  async function runCustomerSearch() {
    if (!customerSearch.trim()) return;
    setSearchLoading(true);
    setError(null);
    try {
      setCustomerResults(await searchExistingCustomers(customerSearch));
    } catch (err) {
      setError(err);
      setCustomerResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  async function selectExistingCustomer(code) {
    setSearchLoading(true);
    setError(null);
    try {
      const snapshot = await loadExistingCustomerSnapshot(code);
      if (!snapshot) {
        setMessage('');
        setError(new Error(`Customer ${code} not found in read model.`));
        return;
      }
      setForm((prev) => ({
        ...prev,
        existing_customer_code: code,
        customer_code_requested: code,
        customer_name_th: snapshot.customer_name || prev.customer_name_th,
        original_customer_snapshot: snapshot,
        proposed_changes: prev.proposed_changes || {},
      }));
      setCustomerResults([]);
      setCustomerSearch(code);
      setMessage(`Loaded read-only snapshot for ${code} (no Express write-back).`);
    } catch (err) {
      setError(err);
    } finally {
      setSearchLoading(false);
    }
  }

  async function saveDraft() {
    setLoading(true);
    setError(null);
    setMessage('');
    try {
      const saved = requestId
        ? await updateCustomerRegistrationDraft(requestId, form)
        : await createCustomerRegistrationDraft(form);
      setForm(normalizeForm(saved));
      setRequestId(saved.id);
      setMessage('Draft saved to Supabase (no Express ARMAS update).');
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
    setMessage('');
    try {
      const saved = await actionFn(requestId, approvalComment);
      setForm(normalizeForm(saved));
      setApprovalLogs(await listCustomerRegistrationApprovalLogs(requestId));
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
          title="Customer Registration / ขึ้นทะเบียนลูกค้า"
          description="Legacy pgCustReg — Supabase request workflow only."
          actions={
            <>
              <Badge type="info">DATA ENTRY</Badge>
              <Badge type="warning">SAFE MODE</Badge>
              <button type="button" className="tgm-btn tgm-btn-primary" onClick={startNewRequest}>+ New Request</button>
            </>
          }
        />
        <Alert variant="warning">
          This page records customer registration requests only. It does not create or update Express customer master (ARMAS).
        </Alert>
        {loading && <Alert variant="info">Loading requests...</Alert>}
        {error ? <Alert variant="danger">{error.message}</Alert> : null}
        <TablePanel title="Registration requests">
          <table className="tgm-table">
            <thead>
              <tr>
                <th>Request No.</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Salesperson</th>
                <th>Status</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {requests.map((row) => (
                <tr key={row.id}>
                  <td className="font-mono">{row.request_no || '—'}</td>
                  <td>{row.customer_name_th || row.customer_name_en || '—'}</td>
                  <td>{row.request_type || '—'}</td>
                  <td>{row.salesperson || '—'}</td>
                  <td><StatusBadge status={row.status} /></td>
                  <td>{row.request_date || '—'}</td>
                  <td><button type="button" className="tgm-btn tgm-btn-sm" onClick={() => openRequest(row.id)}>View / Edit</button></td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr><td colSpan={7} className="text-center text-[var(--color-text-muted)] py-5">No registration requests yet.</td></tr>
              )}
            </tbody>
          </table>
        </TablePanel>
      </section>
    );
  }

  return (
    <section className="tgm-page space-y-3">
      <PageHeader
        title="Customer Registration / ขึ้นทะเบียนลูกค้า"
        description="Single-page registration document — scroll to complete all sections."
        actions={
          <>
            <Badge type="info">DATA ENTRY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />

      <Alert variant="warning">
        This page records customer registration requests only. It does not create or update Express customer master (ARMAS).
      </Alert>
      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="danger">{error.message}</Alert> : null}

      <div className="custreg-doc">
        <div className="custreg-action-bar custreg-action-bar--sticky">
          <div className="custreg-action-bar__hint">
            Supabase-only workflow — no Express DBF / ARMAS write-back.
          </div>
          <button type="button" className="tgm-btn" onClick={() => setView('list')}>Back to List</button>
          {canEdit && (
            <>
              <button type="button" className="tgm-btn" onClick={saveDraft} disabled={loading}>Save Draft</button>
              {requestId && (
                <button type="button" className="tgm-btn tgm-btn-primary" onClick={() => runWorkflow(submitCustomerRegistration, 'Submitted for approval.')} disabled={loading}>
                  Submit for Approval
                </button>
              )}
            </>
          )}
          {form.status === 'submitted' && (
            <>
              <button type="button" className="tgm-btn tgm-btn-primary" onClick={() => runWorkflow(approveCustomerRegistration, 'Approved (Supabase only).')} disabled={loading}>Approve</button>
              <button type="button" className="tgm-btn" onClick={() => runWorkflow(rejectCustomerRegistration, 'Rejected.')} disabled={loading}>Reject</button>
              <button type="button" className="tgm-btn" onClick={() => runWorkflow(requestCustomerRegistrationRevision, 'Revision requested.')} disabled={loading}>Request Revision</button>
            </>
          )}
        </div>

        <FormCard titleTh="1. ข้อมูลคำขอ" titleEn="Request Header">
          <div className="custreg-form-grid">
            <Field label="Request No. / เลขที่เอกสาร"><TextInput value={form.request_no} onChange={(e) => updateField('request_no', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Request Date / วันที่"><TextInput type="date" value={form.request_date || ''} onChange={(e) => updateField('request_date', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Requester / ผู้บันทึก"><TextInput value={form.requester} onChange={(e) => updateField('requester', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Salesperson / Sales เจ้าของงาน"><TextInput value={form.salesperson} onChange={(e) => updateField('salesperson', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Request Type / ประเภทคำขอ">
              <SelectInput value={form.request_type} onChange={(e) => updateField('request_type', e.target.value)} disabled={readOnly}>
                {REQUEST_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </SelectInput>
            </Field>
            <Field label="Status / สถานะ"><TextInput value={form.status} disabled /></Field>
          </div>
        </FormCard>

        {needsExistingCustomer && (
          <FormCard titleTh="1b. ค้นหาลูกค้าเดิม" titleEn="Existing Customer Search">
            <Alert variant="info">
              Loads read-only data from sc_web_customer_master_view (fallback sc_express_customers). Never reads Express DBF from frontend.
            </Alert>
            <div className="custreg-form-grid">
              <Field label="Search by code or name / ค้นหารหัสหรือชื่อ" span={3}>
                <div className="flex gap-2">
                  <TextInput
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    disabled={readOnly}
                    placeholder="Customer code or name"
                  />
                  <button type="button" className="tgm-btn" onClick={runCustomerSearch} disabled={readOnly || searchLoading}>
                    Search
                  </button>
                </div>
              </Field>
              <Field label="Selected existing code / รหัสลูกค้าเดิม">
                <TextInput value={form.existing_customer_code || ''} disabled />
              </Field>
            </div>
            {customerResults.length > 0 && (
              <TablePanel title="Search results">
                <table className="tgm-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Group</th>
                      <th>Sales</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {customerResults.map((row) => (
                      <tr key={row.customer_code}>
                        <td className="font-mono">{row.customer_code}</td>
                        <td>{row.customer_name}</td>
                        <td>{row.customer_group || '—'}</td>
                        <td>{row.sales_code || '—'}</td>
                        <td>
                          <button type="button" className="tgm-btn tgm-btn-sm" onClick={() => selectExistingCustomer(row.customer_code)} disabled={readOnly}>
                            Load snapshot
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TablePanel>
            )}
          </FormCard>
        )}

        {form.original_customer_snapshot && (
          <FormCard titleTh="1c. ข้อมูลลูกค้าเดิม (อ่านอย่างเดียว)" titleEn="Original Customer Snapshot">
            <div className="custreg-form-grid">
              <Field label="Customer Code"><TextInput value={form.original_customer_snapshot.customer_code || ''} disabled /></Field>
              <Field label="Customer Name"><TextInput value={form.original_customer_snapshot.customer_name || ''} disabled /></Field>
              <Field label="Customer Group"><TextInput value={form.original_customer_snapshot.customer_group || ''} disabled /></Field>
              <Field label="Sales Code"><TextInput value={form.original_customer_snapshot.sales_code || ''} disabled /></Field>
              <Field label="Snapshot loaded at" span={2}>
                <TextInput value={form.original_customer_snapshot.loaded_at || '—'} disabled />
              </Field>
            </div>
          </FormCard>
        )}

        {needsExistingCustomer && (
          <FormCard titleTh="1d. การเปลี่ยนแปลงที่เสนอ" titleEn="Proposed Changes">
            <div className="custreg-form-grid">
              <Field label="Proposed name / ชื่อที่เสนอ" span={2}>
                <TextInput
                  value={form.proposed_changes?.customer_name || ''}
                  onChange={(e) => updateProposedChange('customer_name', e.target.value)}
                  disabled={readOnly}
                />
              </Field>
              <Field label="Proposed address / ที่อยู่ที่เสนอ" span={4}>
                <TextArea
                  value={form.proposed_changes?.billing_address || ''}
                  onChange={(e) => updateProposedChange('billing_address', e.target.value)}
                  disabled={readOnly}
                />
              </Field>
              {form.request_type === 'credit_change' && (
                <Field label="Credit change requested / เปลี่ยนเครดิต" span={2}>
                  <TextArea
                    value={form.credit_change_requested || ''}
                    onChange={(e) => updateField('credit_change_requested', e.target.value)}
                    disabled={readOnly}
                    placeholder="Describe credit term/limit change"
                  />
                </Field>
              )}
              {form.request_type === 'suspend' && (
                <Field label="Suspend reason / เหตุผลระงับ" span={2}>
                  <TextArea
                    value={form.suspend_reason || ''}
                    onChange={(e) => updateField('suspend_reason', e.target.value)}
                    disabled={readOnly}
                  />
                </Field>
              )}
            </div>
          </FormCard>
        )}

        <FormCard titleTh="2. ข้อมูลลูกค้า" titleEn="Customer Information">
          <div className="custreg-form-grid">
            <Field label="Customer Code requested / รหัสลูกค้า"><TextInput value={form.customer_code_requested} onChange={(e) => updateField('customer_code_requested', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Corporate Group / กลุ่มบริษัท"><TextInput value={form.corporate_group} onChange={(e) => updateField('corporate_group', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Customer Name TH / ชื่อลูกค้า"><TextInput value={form.customer_name_th} onChange={(e) => updateField('customer_name_th', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Customer Name EN"><TextInput value={form.customer_name_en} onChange={(e) => updateField('customer_name_en', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Customer Category / ประเภทร้าน"><TextInput value={form.customer_category} onChange={(e) => updateField('customer_category', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Channel / ช่องทาง"><TextInput value={form.channel} onChange={(e) => updateField('channel', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Contact Person / ผู้ติดต่อ"><TextInput value={form.contact_person} onChange={(e) => updateField('contact_person', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Phone / เบอร์โทร"><TextInput value={form.phone} onChange={(e) => updateField('phone', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Email / อีเมล"><TextInput type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Line ID"><TextInput value={form.line_id} onChange={(e) => updateField('line_id', e.target.value)} disabled={readOnly} /></Field>
          </div>
        </FormCard>

        <FormCard titleTh="3. ข้อมูลภาษีและวางบิล" titleEn="Billing & Tax">
          <div className="custreg-form-grid">
            <Field label="Tax ID / เลขผู้เสียภาษี"><TextInput value={form.tax_id} onChange={(e) => updateField('tax_id', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Branch No. / สาขา"><TextInput value={form.branch_no} onChange={(e) => updateField('branch_no', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Tax Invoice Name / ชื่อใบกำกับ" span={2}><TextInput value={form.tax_invoice_name} onChange={(e) => updateField('tax_invoice_name', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Billing Address / ที่อยู่วางบิล" span={4}><TextArea value={form.billing_address} onChange={(e) => updateField('billing_address', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Province / จังหวัด"><TextInput value={form.province} onChange={(e) => updateField('province', e.target.value)} disabled={readOnly} /></Field>
            <Field label="District / อำเภอ-เขต"><TextInput value={form.district} onChange={(e) => updateField('district', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Subdistrict / ตำบล-แขวง"><TextInput value={form.subdistrict} onChange={(e) => updateField('subdistrict', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Postal Code / รหัสไปรษณีย์"><TextInput value={form.postal_code} onChange={(e) => updateField('postal_code', e.target.value)} disabled={readOnly} /></Field>
          </div>
        </FormCard>

        <FormCard titleTh="4. สถานที่จัดส่ง" titleEn="Delivery / Branch">
          <div className="custreg-form-grid">
            <Field label="Branch Name / ชื่อสาขา"><TextInput value={form.branch_name} onChange={(e) => updateField('branch_name', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Delivery Name / ชื่อสถานที่"><TextInput value={form.delivery_name} onChange={(e) => updateField('delivery_name', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Delivery Address / ที่อยู่จัดส่ง" span={4}><TextArea value={form.delivery_address} onChange={(e) => updateField('delivery_address', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Delivery Province / จังหวัด"><TextInput value={form.delivery_province} onChange={(e) => updateField('delivery_province', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Delivery Contact / ผู้รับ"><TextInput value={form.delivery_contact} onChange={(e) => updateField('delivery_contact', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Delivery Phone / เบอร์จัดส่ง"><TextInput value={form.delivery_phone} onChange={(e) => updateField('delivery_phone', e.target.value)} disabled={readOnly} /></Field>
            <Field label="GPS / Map Link / แผนที่" span={2}><TextInput value={form.gps_map_link} onChange={(e) => updateField('gps_map_link', e.target.value)} disabled={readOnly} placeholder="https://maps.google.com/..." /></Field>
          </div>
        </FormCard>

        <FormCard titleTh="5. เงื่อนไขการค้า" titleEn="Credit & Trade Condition">
          <div className="custreg-form-grid">
            <Field label="Credit Term / เครดิต (วัน)"><TextInput value={form.credit_term} onChange={(e) => updateField('credit_term', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Credit Limit Requested / วงเงิน"><TextInput type="number" value={form.credit_limit_requested} onChange={(e) => updateField('credit_limit_requested', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Payment Method / วิธีชำระ"><TextInput value={form.payment_method} onChange={(e) => updateField('payment_method', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Price Tier / ระดับราคา"><TextInput value={form.price_tier} onChange={(e) => updateField('price_tier', e.target.value)} disabled={readOnly} /></Field>
            <Field label="GP / Discount Condition / ส่วนลด" span={2}><TextArea value={form.gp_discount_condition} onChange={(e) => updateField('gp_discount_condition', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Billing Cycle / รอบวางบิล"><TextInput value={form.billing_cycle} onChange={(e) => updateField('billing_cycle', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Collection Method / ช่องทางเก็บเงิน"><TextInput value={form.collection_method} onChange={(e) => updateField('collection_method', e.target.value)} disabled={readOnly} /></Field>
            <Field label="Remark / หมายเหตุ" span={4}><TextArea value={form.remark} onChange={(e) => updateField('remark', e.target.value)} disabled={readOnly} /></Field>
          </div>
        </FormCard>

        <FormCard titleTh="6. เอกสารแนบ (CR_DOC_SLOTS)" titleEn="Attachments & Notes">
          {storageNote && (
            <Alert variant="warning">
              Supabase Storage bucket is not configured for this environment. Attachments are stored as metadata only (filename, size, type) — no binary upload. Use Drive link for full documents.
            </Alert>
          )}
          <div className="custreg-doc-slots space-y-3">
            {CR_DOC_SLOTS.map((slotDef) => {
              const slot = (form.document_slots || []).find((s) => s.id === slotDef.id) || { id: slotDef.id, files: [], note: '' };
              return (
                <div key={slotDef.id} className="custreg-slot border border-[var(--color-border)] rounded-lg p-3">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <strong>{slotDef.label}</strong>
                    {slotDef.req ? <Badge type="warning">Required</Badge> : null}
                    <span className="text-sm text-[var(--color-text-muted)]">{slotDef.hint}</span>
                  </div>
                  <div className="custreg-form-grid">
                    <Field label={`Upload (metadata only, max ${slotDef.maxFiles})`} span={2}>
                      <input
                        type="file"
                        multiple={slotDef.maxFiles > 1}
                        disabled={readOnly}
                        onChange={(e) => handleSlotFiles(slotDef.id, e.target.files)}
                      />
                    </Field>
                    <Field label="Slot note / หมายเหตุ">
                      <TextInput
                        value={slot.note || ''}
                        onChange={(e) => updateDocumentSlot(slotDef.id, { note: e.target.value })}
                        disabled={readOnly}
                      />
                    </Field>
                  </div>
                  {(slot.files || []).length > 0 && (
                    <ul className="text-sm mt-2 space-y-1">
                      {slot.files.map((f, idx) => (
                        <li key={`${slotDef.id}-${idx}`}>
                          {f.name} ({f.size} bytes) — metadata only
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
          <div className="custreg-doc-grid mt-3">
            <Field label="Drive link / โฟลเดอร์เอกสาร" span={2}>
              <TextInput value={form.drive_link} onChange={(e) => updateField('drive_link', e.target.value)} disabled={readOnly} placeholder="Google Drive URL" />
            </Field>
            <Field label="Legacy doc fields (optional text refs)" span={2}>
              <TextInput value={form.doc_other} onChange={(e) => updateField('doc_other', e.target.value)} disabled={readOnly} placeholder="Other document reference" />
            </Field>
          </div>
          <div className="custreg-form-grid mt-3">
            <Field label="Internal note / หมายเหตุภายใน" span={4}>
              <TextArea value={form.internal_note} onChange={(e) => updateField('internal_note', e.target.value)} disabled={readOnly} />
            </Field>
            <Field label="Final note / หมายเหตุสุดท้าย (legacy cr-final-note)" span={4}>
              <TextArea value={form.final_note} onChange={(e) => updateField('final_note', e.target.value)} disabled={readOnly} placeholder="Final note before submit" />
            </Field>
          </div>
        </FormCard>

        <FormCard titleTh="7. การอนุมัติ" titleEn="Approval Status">
          <div className="custreg-approval-status">
            <span>Current Status / สถานะปัจจุบัน:</span>
            <StatusBadge status={form.status} />
          </div>
          <Field label="Comment / ความเห็นอนุมัติ" span={4}>
            <TextArea value={approvalComment} onChange={(e) => setApprovalComment(e.target.value)} disabled={readOnly && form.status !== 'submitted'} placeholder="Comment for submit / approve / reject / revision" />
          </Field>
          <div className="custreg-timeline-table mt-3">
            <TablePanel title="Approval Timeline / ประวัติการอนุมัติ">
              <table className="tgm-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Action</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Actor</th>
                    <th>Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {approvalLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</td>
                      <td>{log.action || '—'}</td>
                      <td>{log.from_status || '—'}</td>
                      <td>{log.to_status || '—'}</td>
                      <td>{log.actor_name || '—'}</td>
                      <td>{log.comment || '—'}</td>
                    </tr>
                  ))}
                  {approvalLogs.length === 0 && (
                    <tr><td colSpan={6} className="text-center text-[var(--color-text-muted)] py-4">No approval actions yet.</td></tr>
                  )}
                </tbody>
              </table>
            </TablePanel>
          </div>
        </FormCard>
      </div>
    </section>
  );
}
