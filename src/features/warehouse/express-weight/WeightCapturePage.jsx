import { useCallback, useState } from 'react';
import { KpiCard } from '../../../components/scm-ui/Card.jsx';
import TablePanel from '../../../components/scm-ui/TablePanel.jsx';
import {
  ExpressWeightPageLayout,
  SafeModeButton,
  StatusPill,
} from './components/ExpressWeightLayout.jsx';
import {
  createWeightCaptureDraft,
  listWeightCaptures,
  submitWeightCaptureForReview,
} from '../../../services/expressWeight/expressWeightService.js';

const EMPTY_FORM = {
  soNo: '',
  pickJobNo: '',
  customer: '',
  product: '',
  lot: '',
  qty: '',
  grossWeight: '',
  tareWeight: '',
  netWeight: '',
  weighedBy: 'operator.demo',
};

function Field({ label, children }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-[var(--color-text-muted)]">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  'min-h-10 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export default function WeightCapturePage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [captures, setCaptures] = useState(() => listWeightCaptures());
  const [toast, setToast] = useState(null);

  const refresh = useCallback(() => {
    setCaptures(listWeightCaptures());
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  const updateField = (name, value) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'grossWeight' || name === 'tareWeight') {
        const gross = parseFloat(name === 'grossWeight' ? value : prev.grossWeight) || 0;
        const tare = parseFloat(name === 'tareWeight' ? value : prev.tareWeight) || 0;
        next.netWeight = gross > 0 ? String(Math.max(0, gross - tare)) : prev.netWeight;
      }
      return next;
    });
  };

  const handleSaveDraft = () => {
    const result = createWeightCaptureDraft(form);
    showToast(result.message);
    refresh();
  };

  const handleSubmitReview = (captureId) => {
    const result = submitWeightCaptureForReview(captureId);
    showToast(result.message);
    refresh();
  };

  return (
    <ExpressWeightPageLayout
      title="Weight Capture"
      description="Capture gross/tare/net weight for pick jobs. Design-only — drafts stored in localStorage only."
    >
      {toast ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {toast}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Total Captures" value={captures.length} />
        <KpiCard label="Drafts" value={captures.filter((c) => c.status === 'draft').length} />
        <KpiCard label="Pending Review" value={captures.filter((c) => c.status === 'pending_review').length} />
        <KpiCard label="Express Write-back" value="Disabled" detail="Safe mode" />
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
        <h2 className="mb-4 text-base font-semibold text-[var(--color-text-main)]">New Weight Capture</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Field label="SO No.">
            <input className={inputClass} value={form.soNo} onChange={(e) => updateField('soNo', e.target.value)} />
          </Field>
          <Field label="Pick Job No.">
            <input className={inputClass} value={form.pickJobNo} onChange={(e) => updateField('pickJobNo', e.target.value)} />
          </Field>
          <Field label="Customer">
            <input className={inputClass} value={form.customer} onChange={(e) => updateField('customer', e.target.value)} />
          </Field>
          <Field label="Product">
            <input className={inputClass} value={form.product} onChange={(e) => updateField('product', e.target.value)} />
          </Field>
          <Field label="Lot">
            <input className={inputClass} value={form.lot} onChange={(e) => updateField('lot', e.target.value)} />
          </Field>
          <Field label="Qty">
            <input type="number" className={inputClass} value={form.qty} onChange={(e) => updateField('qty', e.target.value)} />
          </Field>
          <Field label="Gross Weight">
            <input type="number" step="0.01" className={inputClass} value={form.grossWeight} onChange={(e) => updateField('grossWeight', e.target.value)} />
          </Field>
          <Field label="Tare Weight">
            <input type="number" step="0.01" className={inputClass} value={form.tareWeight} onChange={(e) => updateField('tareWeight', e.target.value)} />
          </Field>
          <Field label="Net Weight">
            <input type="number" step="0.01" className={inputClass} value={form.netWeight} onChange={(e) => updateField('netWeight', e.target.value)} />
          </Field>
          <Field label="Weighed By">
            <input className={inputClass} value={form.weighedBy} onChange={(e) => updateField('weighedBy', e.target.value)} />
          </Field>
          <Field label="Weighed At">
            <input className={inputClass} value={new Date().toLocaleString('th-TH')} readOnly disabled />
          </Field>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <SafeModeButton variant="default" onClick={handleSaveDraft}>
            Save Draft Weight
          </SafeModeButton>
          <SafeModeButton
            variant="primary"
            onClick={() => {
              const result = createWeightCaptureDraft(form);
              if (result.record) submitWeightCaptureForReview(result.record.id);
              showToast('Submitted for review (safe mode — no Express write-back)');
              setForm(EMPTY_FORM);
              refresh();
            }}
          >
            Submit for Review
          </SafeModeButton>
        </div>
      </div>

      <TablePanel title="Weight Capture Records (local design data)">
        <table className="tgm-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>SO No.</th>
              <th>Pick Job</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Lot</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Net Wt</th>
              <th>Weighed By</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {captures.map((row) => (
              <tr key={row.id}>
                <td className="font-mono text-xs">{row.id}</td>
                <td>{row.soNo}</td>
                <td className="font-mono text-xs">{row.pickJobNo}</td>
                <td className="max-w-[140px] truncate">{row.customer}</td>
                <td className="max-w-[160px] truncate">{row.product}</td>
                <td>{row.lot}</td>
                <td className="text-right">{row.qty}</td>
                <td className="text-right font-medium">{row.netWeight}</td>
                <td>{row.weighedBy}</td>
                <td><StatusPill status={row.status} /></td>
                <td>
                  {row.status === 'draft' ? (
                    <SafeModeButton variant="primary" onClick={() => handleSubmitReview(row.id)}>
                      Submit
                    </SafeModeButton>
                  ) : '—'}
                </td>
              </tr>
            ))}
            {captures.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-6 text-center text-[var(--color-text-muted)]">No captures yet</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TablePanel>
    </ExpressWeightPageLayout>
  );
}
