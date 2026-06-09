import React, { useMemo, useState, useEffect } from 'react';
import Badge from '../../components/scm-ui/Badge.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  listPromotions,
  createPromotionDraft,
  updatePromotionDraft,
  submitPromotion,
  approvePromotion,
  rejectPromotion,
  requestPromotionRevision,
  cancelPromotion,
  listApprovalLogs,
} from '../../services/sales/promotionService.js';
import './sales-promotions.css';

const STATUS_LABELS = {
  draft: 'DRAFT',
  submitted: 'SUBMITTED',
  approved: 'APPROVED',
  rejected: 'REJECTED',
  revision_requested: 'REVISION REQUESTED',
  cancelled: 'CANCELLED',
};

function statusPillClass(status) {
  if (status === 'submitted') return 'promo-status-submitted';
  if (status === 'approved') return 'promo-status-approved';
  if (status === 'rejected') return 'promo-status-rejected';
  if (status === 'revision_requested') return 'promo-status-revision';
  if (status === 'cancelled') return 'promo-status-cancelled';
  return 'promo-status-draft';
}

function listStatusBadgeType(status) {
  if (status === 'approved') return 'success';
  if (status === 'submitted') return 'warning';
  if (status === 'rejected') return 'danger';
  if (status === 'revision_requested') return 'info';
  return 'neutral';
}

function formatNumber(value, digits = 2) {
  const num = Number(value) || 0;
  return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: digits });
}

function FormCard({ title, titleEn, actions, children, className = '' }) {
  return (
    <section className={`promo-form-card ${className}`.trim()}>
      <div className="promo-form-card__head">
        <h3 className="promo-form-card__title">
          {title}
          {titleEn ? <span className="promo-form-card__title-en">{titleEn}</span> : null}
        </h3>
        {actions || null}
      </div>
      <div className="promo-form-card__body">{children}</div>
    </section>
  );
}

function Field({ label, children, span = 1 }) {
  const spanClass = span === 4 ? 'promo-field--span4' : span === 2 ? 'promo-field--span2' : '';
  return (
    <div className={`promo-field ${spanClass}`.trim()}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function CheckRow({ label, checked, onChange, disabled }) {
  return (
    <label className="promo-check-row">
      <input type="checkbox" checked={checked || false} onChange={onChange} disabled={disabled} />
      <span className="promo-check-row__label">{label}</span>
    </label>
  );
}

function AmountRow({ label, amount, onAmount, disabled, placeholder = '0.00' }) {
  return (
    <div className="promo-check-row">
      <span className="promo-check-row__label">{label}</span>
      <input
        type="number"
        className="tgm-input promo-check-row__amount"
        value={amount ?? ''}
        onChange={onAmount}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );
}

function CheckTextRow({ label, value, onChange, disabled, placeholder = '' }) {
  return (
    <div className="promo-check-row">
      <span className="promo-check-row__label">{label}</span>
      <input
        type="text"
        className="tgm-input promo-check-row__text"
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );
}

function ConditionSubCard({ title, children }) {
  return (
    <div className="promo-cond-subcard">
      <div className="promo-cond-subcard__title">{title}</div>
      <div className="promo-check-grid">{children}</div>
    </div>
  );
}

function emptyDraft() {
  return {
    id: null,
    status: 'draft',
    promotion_no: '',
    write_date: new Date().toISOString().slice(0, 10),
    customer: '',
    branch_count: '',
    promotion_name: '',
    objective: '',
    start_date: '',
    end_date: '',
    total_days: 0,
    starting_cost: 0,
    is_new_item: false,
    no_entry_fee: false,
    entry_fee_amount: 0,
    media_fee_amount: 0,
    regular_point: false,
    promo_point: false,
    has_pretty: false,
    other_sales_point: '',
    sell_out_no_return: false,
    sell_out_with_return: false,
    consignment: false,
    other_condition: '',
    tss_fresh_cabinet: false,
    tgm_fresh_cabinet: false,
    pack_tss: false,
    pack_tgm: false,
    pack_hb: false,
    buy_1_get_1: false,
    price_discount: false,
    compensate: false,
    has_giveaway: false,
    regular_discount_pct: 0,
    item_discount_pct: 0,
    other_discount_pct: 0,
    lines: [],
  };
}

export default function SalesPromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [activePromo, setActivePromo] = useState(null);
  const [logs, setLogs] = useState([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const loadPromotions = async () => {
    try {
      const data = await listPromotions();
      setPromotions(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, []);

  const handleCreateNew = () => {
    setActivePromo(emptyDraft());
    setLogs([]);
    setComment('');
  };

  const loadPromoDetails = async (promo) => {
    setActivePromo({ ...promo, lines: promo.lines || [] });
    if (promo.id) {
      try {
        const logData = await listApprovalLogs(promo.id);
        setLogs(logData || []);
      } catch (e) {
        console.error(e);
      }
    } else {
      setLogs([]);
    }
    setComment('');
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      if (activePromo.id) {
        const updated = await updatePromotionDraft(activePromo.id, activePromo);
        setActivePromo({ ...updated, lines: updated.lines || [] });
      } else {
        const created = await createPromotionDraft(activePromo);
        setActivePromo({ ...created, lines: created.lines || [] });
      }
      await loadPromotions();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleWorkflowAction = async (actionFn) => {
    if (!activePromo?.id) return;
    setLoading(true);
    try {
      const result = await actionFn(activePromo.id, comment);
      setActivePromo({ ...result, lines: result.lines || [] });
      const logData = await listApprovalLogs(activePromo.id);
      setLogs(logData || []);
      setComment('');
      await loadPromotions();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const addLine = () => {
    setActivePromo({
      ...activePromo,
      lines: [
        ...activePromo.lines,
        {
          id: Date.now().toString(),
          seq_no: activePromo.lines.length + 1,
          product_code: '',
          product_name: '',
          last_promo_no: '',
          last_promo_period: '',
          last_promo_price: 0,
          weight: 0,
          regular_selling_price: 0,
          regular_gp: 0,
          net_cost: 0,
          compensate_amount: 0,
          promo_selling_price: 0,
          promo_gp: 0,
          promo_net_cost: 0,
          last_month_sales: 0,
          sales_estimate: 0,
          remark: '',
        },
      ],
    });
  };

  const removeLine = (index) => {
    const newLines = [...activePromo.lines];
    newLines.splice(index, 1);
    setActivePromo({ ...activePromo, lines: newLines });
  };

  const updateLine = (index, field, value) => {
    const newLines = [...activePromo.lines];
    newLines[index][field] = value;
    setActivePromo({ ...activePromo, lines: newLines });
  };

  const lineSummary = useMemo(() => {
    const lines = activePromo?.lines || [];
    const skuCount = lines.length;
    const totalEstimate = lines.reduce((sum, line) => sum + (Number(line.sales_estimate) || 0), 0);
    const totalPromoValue = lines.reduce(
      (sum, line) => sum + (Number(line.promo_selling_price) || 0) * (Number(line.sales_estimate) || 0),
      0,
    );
    const avgGp = skuCount
      ? lines.reduce((sum, line) => sum + (Number(line.promo_gp) || 0), 0) / skuCount
      : 0;
    return { skuCount, totalEstimate, totalPromoValue, avgGp };
  }, [activePromo?.lines]);

  if (!activePromo) {
    return (
      <section className="tgm-page promo-page">
        <div className="promo-toolbar">
          <div className="promo-toolbar__meta">
            <div className="promo-toolbar__title">Promotion / เคาะราคาห้าง</div>
            <div className="promo-toolbar__subtitle">Modern Trade Price Proposal</div>
            <div className="promo-toolbar__badges">
              <Badge type="neutral">DATA ENTRY ONLY</Badge>
              <Badge type="warning">SAFE MODE</Badge>
            </div>
          </div>
          <div className="promo-toolbar__actions">
            <button type="button" className="tgm-button-primary" onClick={handleCreateNew}>
              + New Promotion
            </button>
          </div>
        </div>

        <div className="promo-safety-banner">
          This page is for promotion data collection only. It does not update Express price, SO, stock, invoice, or reservation.
        </div>

        <FormCard title="Promotion List" titleEn="รายการเอกสาร">
          <TablePanel>
            <table className="tgm-table">
              <thead>
                <tr>
                  <th>Promotion No</th>
                  <th>Name</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promotions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-gray-500">
                      No promotions found
                    </td>
                  </tr>
                ) : (
                  promotions.map((p) => (
                    <tr key={p.id}>
                      <td>{p.promotion_no}</td>
                      <td>{p.promotion_name}</td>
                      <td>{p.customer}</td>
                      <td>
                        <Badge type={listStatusBadgeType(p.status)}>{p.status}</Badge>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="text-brand-600 hover:underline text-sm font-semibold"
                          onClick={() => loadPromoDetails(p)}
                        >
                          View / Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TablePanel>
        </FormCard>
      </section>
    );
  }

  const isEditable = activePromo.status === 'draft' || activePromo.status === 'revision_requested';
  const canSubmit = isEditable && activePromo.id;
  const canApprove = activePromo.status === 'submitted';
  const canCancel = activePromo.id && activePromo.status !== 'cancelled';

  return (
    <section className="tgm-page promo-page">
      <div className="promo-toolbar">
        <div className="promo-toolbar__meta">
          <div className="promo-toolbar__title">Promotion / เคาะราคาห้าง</div>
          <div className="promo-toolbar__subtitle">Modern Trade Price Proposal</div>
          <div className="promo-toolbar__badges">
            <span className={`promo-status-pill ${statusPillClass(activePromo.status)}`}>
              {STATUS_LABELS[activePromo.status] || activePromo.status}
            </span>
            <Badge type="neutral">DATA ENTRY ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </div>
        </div>

        <div className="promo-toolbar__actions">
          <button type="button" className="tgm-button-secondary" onClick={() => setActivePromo(null)}>
            ← Back to List
          </button>
          {isEditable ? (
            <button type="button" className="tgm-button-primary" onClick={handleSaveDraft} disabled={loading}>
              Save Draft
            </button>
          ) : null}
          {canSubmit ? (
            <button
              type="button"
              className="tgm-button-primary"
              onClick={() => handleWorkflowAction(submitPromotion)}
              disabled={loading}
            >
              Submit for Approval
            </button>
          ) : null}
          {canApprove ? (
            <>
              <button
                type="button"
                className="tgm-button-secondary promo-btn-success"
                onClick={() => handleWorkflowAction(approvePromotion)}
                disabled={loading}
              >
                Approve
              </button>
              <button
                type="button"
                className="tgm-button-secondary promo-btn-reject"
                onClick={() => handleWorkflowAction(rejectPromotion)}
                disabled={loading}
              >
                Reject
              </button>
              <button
                type="button"
                className="tgm-button-secondary promo-btn-purple"
                onClick={() => handleWorkflowAction(requestPromotionRevision)}
                disabled={loading}
              >
                Request Revision
              </button>
            </>
          ) : null}
          {canCancel ? (
            <button
              type="button"
              className="tgm-button-secondary promo-btn-danger"
              onClick={() => handleWorkflowAction(cancelPromotion)}
              disabled={loading}
            >
              Cancel Promotion
            </button>
          ) : null}
        </div>
      </div>

      <div className="promo-safety-banner">
        This page is for promotion data collection only. It does not update Express price, SO, stock, invoice, or reservation.
      </div>

      <FormCard title="A. ข้อมูลเอกสาร" titleEn="Document Header">
        <div className="promo-grid-header">
          <Field label="Promotion No.">
            <input
              type="text"
              className="tgm-input"
              value={activePromo.promotion_no || ''}
              onChange={(e) => setActivePromo({ ...activePromo, promotion_no: e.target.value })}
              disabled={!isEditable}
            />
          </Field>
          <Field label="วันที่เขียนใบ Pro">
            <input
              type="date"
              className="tgm-input"
              value={activePromo.write_date || ''}
              onChange={(e) => setActivePromo({ ...activePromo, write_date: e.target.value })}
              disabled={!isEditable}
            />
          </Field>
          <Field label="ห้าง / ร้านค้า">
            <input
              type="text"
              className="tgm-input"
              value={activePromo.customer || ''}
              onChange={(e) => setActivePromo({ ...activePromo, customer: e.target.value })}
              disabled={!isEditable}
            />
          </Field>
          <Field label="สาขา / จำนวน">
            <input
              type="text"
              className="tgm-input"
              value={activePromo.branch_count || ''}
              onChange={(e) => setActivePromo({ ...activePromo, branch_count: e.target.value })}
              disabled={!isEditable}
            />
          </Field>
        </div>
      </FormCard>

      <FormCard title="B. รายละเอียดรายการ" titleEn="Promotion Detail">
        <div className="promo-grid-header">
          <Field label="ชื่อรายการ Promotion" span={4}>
            <input
              type="text"
              className="tgm-input"
              value={activePromo.promotion_name || ''}
              onChange={(e) => setActivePromo({ ...activePromo, promotion_name: e.target.value })}
              disabled={!isEditable}
            />
          </Field>
          <Field label="วัตถุประสงค์" span={4}>
            <input
              type="text"
              className="tgm-input"
              value={activePromo.objective || ''}
              onChange={(e) => setActivePromo({ ...activePromo, objective: e.target.value })}
              disabled={!isEditable}
            />
          </Field>
          <Field label="เริ่มตั้งแต่">
            <input
              type="date"
              className="tgm-input"
              value={activePromo.start_date || ''}
              onChange={(e) => setActivePromo({ ...activePromo, start_date: e.target.value })}
              disabled={!isEditable}
            />
          </Field>
          <Field label="ถึงวันที่">
            <input
              type="date"
              className="tgm-input"
              value={activePromo.end_date || ''}
              onChange={(e) => setActivePromo({ ...activePromo, end_date: e.target.value })}
              disabled={!isEditable}
            />
          </Field>
          <Field label="รวมจำนวนวัน">
            <input
              type="number"
              className="tgm-input"
              value={activePromo.total_days || 0}
              onChange={(e) => setActivePromo({ ...activePromo, total_days: parseInt(e.target.value, 10) || 0 })}
              disabled={!isEditable}
            />
          </Field>
          <Field label="ทุนเริ่ม">
            <input
              type="number"
              className="tgm-input"
              value={activePromo.starting_cost || 0}
              onChange={(e) => setActivePromo({ ...activePromo, starting_cost: parseFloat(e.target.value) || 0 })}
              disabled={!isEditable}
            />
          </Field>
        </div>
      </FormCard>

      <FormCard title="C. เงื่อนไขรายการ" titleEn="Conditions">
        <div className="promo-conditions-grid">
          <ConditionSubCard title="Objective / วัตถุประสงค์">
            <CheckRow
              label="New item"
              checked={activePromo.is_new_item}
              onChange={(e) => setActivePromo({ ...activePromo, is_new_item: e.target.checked })}
              disabled={!isEditable}
            />
            <CheckRow
              label="ไม่มีค่าแรกเข้า"
              checked={activePromo.no_entry_fee}
              onChange={(e) => setActivePromo({ ...activePromo, no_entry_fee: e.target.checked })}
              disabled={!isEditable}
            />
            <AmountRow
              label="มีค่าแรกเข้า"
              amount={activePromo.entry_fee_amount}
              onAmount={(e) => setActivePromo({ ...activePromo, entry_fee_amount: parseFloat(e.target.value) || 0 })}
              disabled={!isEditable}
            />
            <AmountRow
              label="ลงสื่อ"
              amount={activePromo.media_fee_amount}
              onAmount={(e) => setActivePromo({ ...activePromo, media_fee_amount: parseFloat(e.target.value) || 0 })}
              disabled={!isEditable}
            />
          </ConditionSubCard>

          <ConditionSubCard title="Sales Location / สถานที่ขาย">
            <CheckRow
              label="จุดประจำ"
              checked={activePromo.regular_point}
              onChange={(e) => setActivePromo({ ...activePromo, regular_point: e.target.checked })}
              disabled={!isEditable}
            />
            <CheckRow
              label="จุดโปร"
              checked={activePromo.promo_point}
              onChange={(e) => setActivePromo({ ...activePromo, promo_point: e.target.checked })}
              disabled={!isEditable}
            />
            <CheckRow
              label="มีพริตตี้"
              checked={activePromo.has_pretty}
              onChange={(e) => setActivePromo({ ...activePromo, has_pretty: e.target.checked })}
              disabled={!isEditable}
            />
            <CheckTextRow
              label="จุดขายอื่น ๆ"
              value={activePromo.other_sales_point}
              onChange={(e) => setActivePromo({ ...activePromo, other_sales_point: e.target.value })}
              disabled={!isEditable}
            />
          </ConditionSubCard>

          <ConditionSubCard title="Trade Condition / เงื่อนไข">
            <CheckRow
              label="ขายขาด ไม่รับคืน"
              checked={activePromo.sell_out_no_return}
              onChange={(e) => setActivePromo({ ...activePromo, sell_out_no_return: e.target.checked })}
              disabled={!isEditable}
            />
            <CheckRow
              label="ขายขาด รับคืน"
              checked={activePromo.sell_out_with_return}
              onChange={(e) => setActivePromo({ ...activePromo, sell_out_with_return: e.target.checked })}
              disabled={!isEditable}
            />
            <CheckRow
              label="ฝากขาย"
              checked={activePromo.consignment}
              onChange={(e) => setActivePromo({ ...activePromo, consignment: e.target.checked })}
              disabled={!isEditable}
            />
            <CheckTextRow
              label="อื่น ๆ"
              value={activePromo.other_condition}
              onChange={(e) => setActivePromo({ ...activePromo, other_condition: e.target.value })}
              disabled={!isEditable}
            />
          </ConditionSubCard>

          <ConditionSubCard title="Product Type / ประเภทสินค้า">
            <CheckRow label="ตู้สด TSS" checked={activePromo.tss_fresh_cabinet} onChange={(e) => setActivePromo({ ...activePromo, tss_fresh_cabinet: e.target.checked })} disabled={!isEditable} />
            <CheckRow label="ตู้สด TGM" checked={activePromo.tgm_fresh_cabinet} onChange={(e) => setActivePromo({ ...activePromo, tgm_fresh_cabinet: e.target.checked })} disabled={!isEditable} />
            <CheckRow label="PACK TSS" checked={activePromo.pack_tss} onChange={(e) => setActivePromo({ ...activePromo, pack_tss: e.target.checked })} disabled={!isEditable} />
            <CheckRow label="PACK TGM" checked={activePromo.pack_tgm} onChange={(e) => setActivePromo({ ...activePromo, pack_tgm: e.target.checked })} disabled={!isEditable} />
            <CheckRow label="PACK HB" checked={activePromo.pack_hb} onChange={(e) => setActivePromo({ ...activePromo, pack_hb: e.target.checked })} disabled={!isEditable} />
            <CheckRow label="1 แถม 1 / แพ็คคู่" checked={activePromo.buy_1_get_1} onChange={(e) => setActivePromo({ ...activePromo, buy_1_get_1: e.target.checked })} disabled={!isEditable} />
          </ConditionSubCard>

          <ConditionSubCard title="Promotion Type / ลักษณะรายการ">
            <CheckRow label="ลดราคา / ลดทุน" checked={activePromo.price_discount} onChange={(e) => setActivePromo({ ...activePromo, price_discount: e.target.checked })} disabled={!isEditable} />
            <CheckRow label="Compensate" checked={activePromo.compensate} onChange={(e) => setActivePromo({ ...activePromo, compensate: e.target.checked })} disabled={!isEditable} />
            <CheckRow label="มีของแถม" checked={activePromo.has_giveaway} onChange={(e) => setActivePromo({ ...activePromo, has_giveaway: e.target.checked })} disabled={!isEditable} />
          </ConditionSubCard>

          <ConditionSubCard title="Discount / ส่วนลด">
            <AmountRow
              label="ส่วนลดปกติ %"
              amount={activePromo.regular_discount_pct}
              onAmount={(e) => setActivePromo({ ...activePromo, regular_discount_pct: parseFloat(e.target.value) || 0 })}
              disabled={!isEditable}
            />
            <AmountRow
              label="ส่วนลดรายการ %"
              amount={activePromo.item_discount_pct}
              onAmount={(e) => setActivePromo({ ...activePromo, item_discount_pct: parseFloat(e.target.value) || 0 })}
              disabled={!isEditable}
            />
            <AmountRow
              label="ส่วนลดอื่น ๆ %"
              amount={activePromo.other_discount_pct}
              onAmount={(e) => setActivePromo({ ...activePromo, other_discount_pct: parseFloat(e.target.value) || 0 })}
              disabled={!isEditable}
            />
          </ConditionSubCard>
        </div>
      </FormCard>

      <FormCard
        title="D. รายการสินค้า Promotion"
        titleEn="Product Lines"
        className="promo-lines-card"
        actions={
          isEditable ? (
            <button type="button" className="tgm-button-secondary" onClick={addLine}>
              + Add Line
            </button>
          ) : null
        }
      >
        <div className="promo-lines-scroll">
          <table className="promo-lines-table">
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>รหัสสินค้า</th>
                <th>ชื่อสินค้า / Kg / Pack</th>
                <th>Pro สุดท้าย เลขที่</th>
                <th>Pro สุดท้าย Period</th>
                <th>ราคา Pro สุดท้าย</th>
                <th>น้ำหนัก</th>
                <th>ราคาขายปกติ</th>
                <th>GP ปกติ</th>
                <th>ราคาทุนสุทธิ</th>
                <th>Compensate</th>
                <th>ราคาขาย Promotion</th>
                <th>GP Promotion</th>
                <th>ราคาทุนสุทธิ Promotion</th>
                <th>ยอดขายเดือนที่แล้ว</th>
                <th>ประมาณการขาย</th>
                <th>หมายเหตุ</th>
                {isEditable ? <th>Action</th> : null}
              </tr>
            </thead>
            <tbody>
              {(!activePromo.lines || activePromo.lines.length === 0) ? (
                <tr>
                  <td colSpan={isEditable ? 18 : 17} className="promo-lines-empty">
                    No product lines added. Click &quot;+ Add Line&quot; to begin.
                  </td>
                </tr>
              ) : (
                activePromo.lines.map((line, i) => (
                  <tr key={line.id || i}>
                    <td className="text-center">{i + 1}</td>
                    <td>
                      <input type="text" className="promo-line-input" value={line.product_code || ''} onChange={(e) => updateLine(i, 'product_code', e.target.value)} disabled={!isEditable} />
                    </td>
                    <td>
                      <input type="text" className="promo-line-input promo-line-input--wide" value={line.product_name || ''} onChange={(e) => updateLine(i, 'product_name', e.target.value)} disabled={!isEditable} />
                    </td>
                    <td>
                      <input type="text" className="promo-line-input" value={line.last_promo_no || ''} onChange={(e) => updateLine(i, 'last_promo_no', e.target.value)} disabled={!isEditable} />
                    </td>
                    <td>
                      <input type="text" className="promo-line-input promo-line-input--wide" value={line.last_promo_period || ''} onChange={(e) => updateLine(i, 'last_promo_period', e.target.value)} disabled={!isEditable} />
                    </td>
                    <td>
                      <input type="number" className="promo-line-input promo-line-input--num" value={line.last_promo_price ?? ''} onChange={(e) => updateLine(i, 'last_promo_price', parseFloat(e.target.value) || 0)} disabled={!isEditable} />
                    </td>
                    <td>
                      <input type="number" className="promo-line-input promo-line-input--num" value={line.weight ?? ''} onChange={(e) => updateLine(i, 'weight', parseFloat(e.target.value) || 0)} disabled={!isEditable} />
                    </td>
                    <td>
                      <input type="number" className="promo-line-input promo-line-input--num" value={line.regular_selling_price ?? ''} onChange={(e) => updateLine(i, 'regular_selling_price', parseFloat(e.target.value) || 0)} disabled={!isEditable} />
                    </td>
                    <td>
                      <input type="number" className="promo-line-input promo-line-input--num" value={line.regular_gp ?? ''} onChange={(e) => updateLine(i, 'regular_gp', parseFloat(e.target.value) || 0)} disabled={!isEditable} />
                    </td>
                    <td>
                      <input type="number" className="promo-line-input promo-line-input--num" value={line.net_cost ?? ''} onChange={(e) => updateLine(i, 'net_cost', parseFloat(e.target.value) || 0)} disabled={!isEditable} />
                    </td>
                    <td>
                      <input type="number" className="promo-line-input promo-line-input--num" value={line.compensate_amount ?? ''} onChange={(e) => updateLine(i, 'compensate_amount', parseFloat(e.target.value) || 0)} disabled={!isEditable} />
                    </td>
                    <td>
                      <input type="number" className="promo-line-input promo-line-input--num" value={line.promo_selling_price ?? ''} onChange={(e) => updateLine(i, 'promo_selling_price', parseFloat(e.target.value) || 0)} disabled={!isEditable} />
                    </td>
                    <td>
                      <input type="number" className="promo-line-input promo-line-input--num" value={line.promo_gp ?? ''} onChange={(e) => updateLine(i, 'promo_gp', parseFloat(e.target.value) || 0)} disabled={!isEditable} />
                    </td>
                    <td>
                      <input type="number" className="promo-line-input promo-line-input--num" value={line.promo_net_cost ?? ''} onChange={(e) => updateLine(i, 'promo_net_cost', parseFloat(e.target.value) || 0)} disabled={!isEditable} />
                    </td>
                    <td>
                      <input type="number" className="promo-line-input promo-line-input--num" value={line.last_month_sales ?? ''} onChange={(e) => updateLine(i, 'last_month_sales', parseFloat(e.target.value) || 0)} disabled={!isEditable} />
                    </td>
                    <td>
                      <input type="number" className="promo-line-input promo-line-input--num" value={line.sales_estimate ?? ''} onChange={(e) => updateLine(i, 'sales_estimate', parseFloat(e.target.value) || 0)} disabled={!isEditable} />
                    </td>
                    <td>
                      <input type="text" className="promo-line-input promo-line-input--remark" value={line.remark || ''} onChange={(e) => updateLine(i, 'remark', e.target.value)} disabled={!isEditable} />
                    </td>
                    {isEditable ? (
                      <td>
                        <button type="button" className="tgm-button-secondary promo-btn-danger" onClick={() => removeLine(i)}>
                          Remove
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <dl className="promo-lines-summary">
          <div>
            <dt>จำนวน SKU</dt>
            <dd>{lineSummary.skuCount}</dd>
          </div>
          <div>
            <dt>ยอดขายประมาณการรวม</dt>
            <dd>{formatNumber(lineSummary.totalEstimate, 0)}</dd>
          </div>
          <div>
            <dt>มูลค่า Promotion รวม</dt>
            <dd>{formatNumber(lineSummary.totalPromoValue)}</dd>
          </div>
          <div>
            <dt>GP เฉลี่ย</dt>
            <dd>{formatNumber(lineSummary.avgGp)}%</dd>
          </div>
        </dl>
      </FormCard>

      <FormCard title="E. การอนุมัติ" titleEn="Approval Timeline" className="promo-approval-card">
        <div className="promo-approval-card__body">
          <div>
            <div className="mb-2">
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">Current status</span>
              <div className="mt-1">
                <span className={`promo-status-pill ${statusPillClass(activePromo.status)}`}>
                  {STATUS_LABELS[activePromo.status] || activePromo.status}
                </span>
              </div>
            </div>

            <Field label="Comment / Note">
              <textarea
                className="tgm-input min-h-[4.5rem] w-full text-sm"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter approval or rejection comments..."
              />
            </Field>
          </div>

          <div className="promo-timeline">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">
              Timeline
            </div>
            {logs.length === 0 ? (
              <div className="promo-timeline__empty">
                No approval activity yet. Save draft and submit to start the workflow.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="promo-timeline__item">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <strong className="text-[var(--color-text-main)]">{log.action}</strong>
                    <span className="text-[var(--color-text-muted)]">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                    </span>
                  </div>
                  {log.action_by ? <p className="mt-1 text-xs text-[var(--color-text-muted)]">{log.action_by}</p> : null}
                  {log.comment ? (
                    <p className="mt-1 border-l-2 border-[var(--color-border)] pl-2 text-xs italic text-[var(--color-text-main)]">
                      {log.comment}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </FormCard>
    </section>
  );
}
