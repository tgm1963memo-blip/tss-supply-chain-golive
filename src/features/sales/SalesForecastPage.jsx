import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  avg3FromMonthly,
  currentYm,
  fcColIndexForDate,
  fcGridKey,
  fcTemplateCols,
  fcTplLabel,
  fmtQty,
  prevMonthYm,
  prevYearYm,
} from './forecast/forecastUtils.js';
import {
  genForecastId,
} from './forecast/forecastStorage.js';
import {
  appendForecasts,
  copyForecastsFromMonth,
  listForecasts,
  mergeForecastsForMonth,
  replaceForecastsForMonth,
} from '../../services/sales/salesForecastService.js';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import {
  DEFAULT_GRID_SKUS,
  LEGACY_CUSTOMERS,
  LEGACY_SALES_HIST,
  LEGACY_SKUS,
} from './forecast/legacyForecastData.js';
import './forecast/legacy-forecast.css';

const TABS = [
  { id: 'grid', label: 'ตารางแผน' },
  { id: 'summary', label: 'สรุปรับของ' },
  { id: 'entry', label: 'นำเข้าตาราง' },
  { id: 'list', label: 'รายการ' },
  { id: 'doc', label: 'เอกสารลูกค้า' },
];

const skuMap = Object.fromEntries(LEGACY_SKUS.map((s) => [s.code, s]));
const custMap = Object.fromEntries(LEGACY_CUSTOMERS.map((c) => [c.code, c.name]));

function buildFcDataFromRows(rows, selMonth, selCust, cols) {
  const fcData = {};
  rows
    .filter(
      (f) =>
        (!selMonth || (f.delivDate || '').slice(0, 7) === selMonth) &&
        (!selCust || f.custCode === selCust),
    )
    .forEach((f) => {
      const idx = fcColIndexForDate(f.delivDate || '', cols);
      if (idx < 0) return;
      if (!fcData[f.sku]) fcData[f.sku] = {};
      fcData[f.sku][idx] = (fcData[f.sku][idx] || 0) + (Number(f.qty) || 0);
    });
  return fcData;
}

function exportCsv(filename, headers, rows) {
  const escape = (v) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))];
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ForecastGridTab({
  selMonth,
  selCust,
  template,
  forecasts,
  gridSkus,
  gridValues,
  aiSuggest,
  onGridValuesChange,
  onGridSkusChange,
  onAiSuggestChange,
  onSave,
  onToast,
}) {
  const cols = useMemo(() => fcTemplateCols(selMonth, template), [selMonth, template]);
  const prevYm = prevMonthYm(selMonth);
  const prevYrYm = prevYearYm(selMonth);
  const custName = selCust ? custMap[selCust] || selCust : 'ทุกลูกค้า';

  const showSkus = gridSkus.map((code) => skuMap[code]).filter(Boolean);

  const footerTotals = useMemo(() => {
    const colTotals = cols.map((_, i) =>
      showSkus.reduce((sum, s) => sum + (Number(gridValues[s.code]?.[i]) || 0), 0),
    );
    const all = colTotals.reduce((a, b) => a + b, 0);
    return { colTotals, all };
  }, [cols, showSkus, gridValues]);

  const rowTotal = (skuCode) =>
    cols.reduce((sum, _, i) => sum + (Number(gridValues[skuCode]?.[i]) || 0), 0);

  const setCell = (skuCode, colIndex, value) => {
    onGridValuesChange((prev) => ({
      ...prev,
      [skuCode]: { ...(prev[skuCode] || {}), [colIndex]: value === '' ? '' : Number(value) },
    }));
  };

  const loadAiSuggest = () => {
    const next = {};
    showSkus.forEach((s) => {
      const avg3 = avg3FromMonthly(LEGACY_SALES_HIST[s.code]?.monthly);
      next[s.code] = avg3 > 0 ? Math.round(avg3 * 1.05) : 0;
    });
    onAiSuggestChange(next);
    onToast('โหลด AI แนะนำแล้ว (จาก avg 3 เดือน)');
  };

  const fillAllAi = () => {
    if (!Object.keys(aiSuggest).length) {
      onToast('กด "โหลด" ในคอลัมน์ AI แนะนำก่อน', 'warn');
      return;
    }
    onGridValuesChange((prev) => {
      const next = { ...prev };
      showSkus.forEach((s) => {
        const suggest = aiSuggest[s.code] || 0;
        if (!suggest) return;
        const perWeek = Math.round(suggest / cols.length);
        const remainder = suggest - perWeek * (cols.length - 1);
        next[s.code] = {};
        cols.forEach((_, i) => {
          next[s.code][i] = i === cols.length - 1 ? remainder : perWeek;
        });
      });
      return next;
    });
    onToast('กรอก AI ทั้งหมดแล้ว');
  };

  const loadFromPrevMonth = () => {
    const prevCols = fcTemplateCols(prevYm, template);
    const prevData = buildFcDataFromRows(forecasts, prevYm, selCust, prevCols);
    onGridValuesChange((prev) => {
      const next = { ...prev };
      showSkus.forEach((s) => {
        const src = prevData[s.code];
        if (!src) return;
        next[s.code] = {};
        cols.forEach((_, i) => {
          next[s.code][i] = src[i] || '';
        });
      });
      return next;
    });
    onToast('โหลดจากเดือนก่อนแล้ว');
  };

  const addSku = () => {
    const code = window.prompt('รหัสสินค้า:');
    if (!code || !skuMap[code.trim()]) {
      if (code) onToast('ไม่พบรหัสสินค้า', 'warn');
      return;
    }
    const trimmed = code.trim();
    if (gridSkus.includes(trimmed)) {
      onToast('มีสินค้านี้ในตารางแล้ว', 'warn');
      return;
    }
    onGridSkusChange([...gridSkus, trimmed]);
  };

  const removeSku = (code) => {
    onGridSkusChange(gridSkus.filter((c) => c !== code));
    onGridValuesChange((prev) => {
      const next = { ...prev };
      delete next[code];
      return next;
    });
  };

  const exportGrid = () => {
    const headers = [
      'รหัสสินค้า',
      'ชื่อสินค้า',
      ...cols.map((c) => c.lbl),
      'รวม',
    ];
    const rows = showSkus.map((s) => {
      const vals = cols.map((_, i) => gridValues[s.code]?.[i] || '');
      const tot = rowTotal(s.code);
      return [s.code, s.name, ...vals, tot || ''];
    });
    exportCsv(`Forecast_${selMonth}_${template}.csv`, headers, rows);
  };

  return (
    <div className="card">
      <div className="fc-card-head">
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700 }}>{custName}</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>
            Forecast {fcTplLabel(template)} · {selMonth}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className="btn btn-xs"
            style={{ background: 'rgba(255,255,255,.18)', color: '#fff', borderColor: 'rgba(255,255,255,.35)' }}
            onClick={loadFromPrevMonth}
          >
            📋 โหลดจากใบเก่า
          </button>
          <button
            type="button"
            className="btn btn-xs"
            style={{ background: 'rgba(255,255,255,.18)', color: '#fff', borderColor: 'rgba(255,255,255,.35)' }}
            onClick={addSku}
          >
            + เพิ่มรายการสินค้า
          </button>
        </div>
      </div>

      <div className="fc-grid-wrap">
        <table className="fc-grid-table">
          <thead>
            <tr>
              <th className="sticky-col">รหัสสินค้า</th>
              <th>ชื่อสินค้า</th>
              <th className="r" style={{ color: 'var(--TX2)' }}>เดือนก่อน</th>
              <th className="r" style={{ color: 'var(--TX2)' }}>avg 3 เดือน</th>
              <th className="r" style={{ color: 'var(--TX2)' }}>ปีก่อน</th>
              <th style={{ textAlign: 'center', background: 'var(--LBL)', color: 'var(--BL)', minWidth: '90px' }}>
                🤖 AI แนะนำ
                <br />
                <span style={{ fontSize: '9.5px', fontWeight: 400, color: 'var(--TX3)' }}>กก./เดือน</span>
                <br />
                <button type="button" className="btn btn-xs btn-ai" style={{ marginTop: '2px' }} onClick={loadAiSuggest}>
                  โหลด
                </button>
              </th>
              {cols.map((c, i) => (
                <th
                  key={c.date}
                  style={{
                    textAlign: 'center',
                    color: 'var(--BL)',
                    borderLeft: i === 0 ? '2px solid var(--BD)' : undefined,
                  }}
                >
                  {c.lbl}
                  <br />
                  <span style={{ fontWeight: 400, color: 'var(--TX3)', fontSize: '10px' }}>{c.sub}</span>
                </th>
              ))}
              <th className="r" style={{ color: 'var(--N)', fontWeight: 700, borderLeft: '2px solid var(--BD)' }}>
                รวม
              </th>
              <th />
            </tr>
          </thead>
          <tbody>
            {showSkus.map((s) => {
              const h = LEGACY_SALES_HIST[s.code]?.monthly || {};
              const avg3 = avg3FromMonthly(h);
              const tot = rowTotal(s.code);
              const highlighted = tot > 0;
              return (
                <tr key={s.code} className={highlighted ? 'highlighted' : undefined}>
                  <td className="sticky-col" style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--TX2)' }}>
                    {s.code}
                  </td>
                  <td style={{ fontSize: '12px' }}>{s.name.substring(0, 30)}</td>
                  <td className="r" style={{ fontSize: '11px', color: 'var(--TX3)' }}>{fmtQty(h[prevYm])}</td>
                  <td className="r" style={{ fontSize: '11px', color: 'var(--TX3)' }}>{avg3 > 0 ? avg3.toLocaleString() : '—'}</td>
                  <td className="r" style={{ fontSize: '11px', color: 'var(--TX3)' }}>{fmtQty(h[prevYrYm])}</td>
                  <td style={{ textAlign: 'center', background: 'var(--LBL)', fontSize: '11px' }}>
                    {aiSuggest[s.code] ? aiSuggest[s.code].toLocaleString() : '—'}
                  </td>
                  {cols.map((c, i) => {
                    const val = gridValues[s.code]?.[i] ?? '';
                    return (
                      <td key={c.date} style={{ borderLeft: i === 0 ? '2px solid var(--BD)' : undefined }}>
                        <input
                          className={`fcg-inp${val ? ' has-value' : ''}`}
                          type="number"
                          min="0"
                          step="100"
                          value={val}
                          onChange={(e) => setCell(s.code, i, e.target.value)}
                        />
                      </td>
                    );
                  })}
                  <td className="r" style={{ fontWeight: 700, color: 'var(--N)', borderLeft: '2px solid var(--BD)' }}>
                    {tot > 0 ? tot.toLocaleString() : ''}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button type="button" className="btn btn-xs btn-r" onClick={() => removeSku(s.code)}>
                      ลบ
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--bg2)', fontWeight: 700, fontSize: '12px' }}>
              <td colSpan={6} style={{ padding: '8px 10px' }}>
                รวมทั้งหมด
              </td>
              {footerTotals.colTotals.map((v, i) => (
                <td
                  key={i}
                  style={{
                    textAlign: 'center',
                    color: 'var(--BL)',
                    borderLeft: i === 0 ? '2px solid var(--BD)' : undefined,
                  }}
                >
                  {v > 0 ? v.toLocaleString() : ''}
                </td>
              ))}
              <td className="r" style={{ color: 'var(--N)', borderLeft: '2px solid var(--BD)' }}>
                {footerTotals.all > 0 ? footerTotals.all.toLocaleString() : ''}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="fc-footer-actions">
        <button type="button" className="btn btn-ai" style={{ marginRight: 'auto' }} onClick={fillAllAi}>
          ✅ กรอก AI ทั้งหมด
        </button>
        <button type="button" className="btn btn-p" onClick={onSave}>
          บันทึกแผน
        </button>
        <button type="button" className="btn btn-g" onClick={exportGrid}>
          Export Excel
        </button>
      </div>
    </div>
  );
}

function ForecastSummaryTab({ forecasts, selMonth, selCust }) {
  const rows = forecasts.filter(
    (f) =>
      (!selMonth || (f.delivDate || '').slice(0, 7) === selMonth) &&
      (!selCust || f.custCode === selCust),
  );
  const total = rows.reduce((s, f) => s + (Number(f.qty) || 0), 0);

  return (
    <>
      <div className="krow">
        <div className="kpi">
          <div className="kl">Forecast</div>
          <div className="kv">{rows.length}</div>
          <div style={{ fontSize: '12px', color: 'var(--TX2)' }}>{total.toLocaleString()} กก.</div>
        </div>
        <div className="kpi">
          <div className="kl">มีแผนรับของ</div>
          <div className="kv">—</div>
          <div style={{ fontSize: '12px', color: 'var(--TX2)' }}>รายการ</div>
        </div>
        <div className="kpi">
          <div className="kl">พร้อม/ได้รับแล้ว</div>
          <div className="kv">—</div>
          <div style={{ fontSize: '12px', color: 'var(--TX2)' }}>รายการ</div>
        </div>
      </div>
      <div className="card">
        <div className="fc-card-head">
          <div style={{ fontSize: '14px', fontWeight: 600 }}>สรุป Forecast → วันที่รับสินค้า</div>
        </div>
        {!rows.length ? (
          <div style={{ padding: '20px', color: 'var(--TX3)', textAlign: 'center' }}>ยังไม่มี Forecast ในช่วงนี้</div>
        ) : (
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>ลูกค้า</th>
                  <th>สินค้า</th>
                  <th className="r">Forecast</th>
                  <th>วันต้องการ</th>
                  <th>สถานะรับของ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{custMap[f.custCode] || f.custCode || '—'}</div>
                    </td>
                    <td>
                      <div style={{ fontFamily: 'monospace' }}>{f.sku}</div>
                      <div style={{ fontSize: '12px' }}>{skuMap[f.sku]?.name?.substring(0, 34) || ''}</div>
                    </td>
                    <td className="r" style={{ fontWeight: 700 }}>
                      {Number(f.qty || 0).toLocaleString()}
                    </td>
                    <td>{f.delivDate || '—'}</td>
                    <td>
                      <span className="badge bba">รอ Planner</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function ForecastEntryTab({ selMonth, selCust, template, onSaveEntry, onToast }) {
  const [paste, setPaste] = useState('');
  const cols = fcTemplateCols(selMonth, template);
  const custName = selCust ? custMap[selCust] || selCust : 'ทุกลูกค้า';

  const downloadTemplate = () => {
    const headers = ['รหัสสินค้า', 'ชื่อสินค้า', ...cols.map((c) => c.lbl)];
    const rows = LEGACY_SKUS.slice(0, 5).map((s) => [s.code, s.name, ...cols.map(() => '')]);
    exportCsv(`Forecast_Template_${template}_${selMonth}.csv`, headers, rows);
  };

  const saveFromTable = () => {
    const valid = new Set(LEGACY_SKUS.map((s) => s.code));
    const newRows = [];
    paste.split(/\r?\n/).forEach((line) => {
      const p = line.split(/\t|,/).map((x) => String(x || '').trim());
      const sku = p[0];
      if (!valid.has(sku)) return;
      const offset = Number.isFinite(parseFloat(p[1])) ? 1 : 2;
      cols.forEach((c, i) => {
        const qty = parseFloat(p[offset + i] || 0) || 0;
        if (qty > 0) {
          newRows.push({
            id: genForecastId(),
            custCode: selCust || null,
            sku,
            qty,
            delivDate: c.date,
            note: `import table:${template}`,
            approved: false,
          });
        }
      });
    });
    if (!newRows.length) {
      onToast('ไม่พบข้อมูลที่นำเข้าได้', 'warn');
      return;
    }
    onSaveEntry(newRows);
    setPaste('');
    onToast(`บันทึก Forecast ${newRows.length} รายการแล้ว`);
  };

  return (
    <div className="card">
      <div className="fc-card-head">
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700 }}>นำเข้า Forecast แบบตาราง — {custName}</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>
            {selMonth} · Template {fcTplLabel(template)} · คอลัมน์: รหัสสินค้า, ชื่อสินค้า,{' '}
            {cols.map((c) => c.lbl).join(', ')}
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <textarea
          className="fc-entry-textarea"
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder="SKU001\t100\t200\t0\t300"
        />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button type="button" className="btn btn-xs" onClick={downloadTemplate}>
            ⬇ Template Excel
          </button>
          <button type="button" className="btn btn-xs btn-p" onClick={saveFromTable}>
            💾 บันทึกจากตาราง
          </button>
        </div>
      </div>
    </div>
  );
}

function ForecastListTab({ forecasts, selMonth, selCust }) {
  const filtered = forecasts.filter(
    (f) =>
      (!selMonth || (f.delivDate || '').slice(0, 7) === selMonth) &&
      (!selCust || f.custCode === selCust),
  );

  return (
    <div className="card">
      <div style={{ padding: '12px 16px', fontWeight: 600 }}>
        รายการ Forecast ({filtered.length} รายการ)
      </div>
      {!filtered.length ? (
        <p style={{ padding: '16px', color: 'var(--TX3)' }}>ยังไม่มีข้อมูล</p>
      ) : (
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>รหัสลูกค้า</th>
                <th>รหัสสินค้า</th>
                <th>ชื่อสินค้า</th>
                <th className="r">จำนวน</th>
                <th>วันต้องการ</th>
                <th>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{f.custCode || '—'}</td>
                  <td style={{ fontFamily: 'monospace' }}>{f.sku}</td>
                  <td style={{ fontSize: '12px' }}>{skuMap[f.sku]?.name?.substring(0, 26) || ''}</td>
                  <td className="r" style={{ fontWeight: 700 }}>
                    {Math.round(Number(f.qty) || 0).toLocaleString()}
                  </td>
                  <td>{f.delivDate || '—'}</td>
                  <td style={{ fontSize: '11px', color: 'var(--TX2)' }}>{f.note || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ForecastDocTab({ selMonth, selCust }) {
  const prevYm = prevMonthYm(selMonth);
  const prevYrYm = prevYearYm(selMonth);
  const custName = selCust ? custMap[selCust] || selCust : 'ทุกลูกค้า';

  return (
    <div className="card">
      <div className="fc-card-head">
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700 }}>เอกสารลูกค้า — {custName}</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>
            เปรียบเทียบยอดขาย {prevYm} / {prevYrYm} · {selMonth}
          </div>
        </div>
      </div>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>รหัสสินค้า</th>
              <th>ชื่อสินค้า</th>
              <th className="r">เดือนก่อน</th>
              <th className="r">ปีก่อน</th>
              <th className="r">avg 3 เดือน</th>
            </tr>
          </thead>
          <tbody>
            {LEGACY_SKUS.map((s) => {
              const h = LEGACY_SALES_HIST[s.code]?.monthly || {};
              const avg3 = avg3FromMonthly(h);
              return (
                <tr key={s.code}>
                  <td style={{ fontFamily: 'monospace' }}>{s.code}</td>
                  <td style={{ fontSize: '12px' }}>{s.name.substring(0, 34)}</td>
                  <td className="r">{fmtQty(h[prevYm])}</td>
                  <td className="r">{fmtQty(h[prevYrYm])}</td>
                  <td className="r">{avg3 > 0 ? avg3.toLocaleString() : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SalesForecastPage() {
  const [activeTab, setActiveTab] = useState('grid');
  const [template, setTemplate] = useState('week');
  const [selMonth, setSelMonth] = useState(currentYm);
  const [selCust, setSelCust] = useState('');
  const [forecasts, setForecasts] = useState([]);
  const [gridSkusByKey, setGridSkusByKey] = useState({});
  const [gridValues, setGridValues] = useState({});
  const [aiSuggest, setAiSuggest] = useState({});
  const [toast, setToast] = useState(null);

  const stateKey = fcGridKey(selMonth, selCust, template);
  const cols = useMemo(() => fcTemplateCols(selMonth, template), [selMonth, template]);

  const showToast = useCallback((msg, type = 'ok') => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const prevStateKeyRef = useRef('');

  useEffect(() => {
    listForecasts().then(setForecasts).catch(() => setForecasts([]));
  }, []);

  useEffect(() => {
    const fcData = buildFcDataFromRows(forecasts, selMonth, selCust, cols);
    const activeSku = Object.keys(fcData);
    setGridSkusByKey((prev) => {
      if (prev[stateKey]) return prev;
      const topSku = LEGACY_SKUS.filter((s) => LEGACY_SALES_HIST[s.code]?.avg3 > 0)
        .sort((a, b) => (LEGACY_SALES_HIST[b.code]?.avg3 || 0) - (LEGACY_SALES_HIST[a.code]?.avg3 || 0))
        .map((s) => s.code);
      const skus = [...new Set([...activeSku, ...topSku, ...DEFAULT_GRID_SKUS])].slice(0, 30);
      return { ...prev, [stateKey]: skus };
    });

    if (prevStateKeyRef.current !== stateKey) {
      prevStateKeyRef.current = stateKey;
      const skus =
        gridSkusByKey[stateKey] ||
        [...new Set([...activeSku, ...DEFAULT_GRID_SKUS])].slice(0, 30);
      const next = {};
      skus.forEach((code) => {
        next[code] = fcData[code] ? { ...fcData[code] } : {};
      });
      setGridValues(next);
      setAiSuggest({});
    }
  }, [forecasts, selMonth, selCust, cols, stateKey, gridSkusByKey]);

  const gridSkus = gridSkusByKey[stateKey] || DEFAULT_GRID_SKUS;

  const setGridSkus = (skus) => {
    setGridSkusByKey((prev) => ({ ...prev, [stateKey]: skus }));
  };

  const saveGrid = async () => {
    const rows = [];
    gridSkus.forEach((skuCode) => {
      cols.forEach((c, i) => {
        const qty = parseFloat(gridValues[skuCode]?.[i] || 0) || 0;
        if (qty <= 0) return;
        rows.push({
          id: genForecastId(),
          custCode: selCust || null,
          sku: skuCode,
          skuName: skuMap[skuCode]?.name || skuCode,
          qty,
          delivDate: c.date,
          week: i + 1,
          note: `grid:${template}`,
          approved: false,
        });
      });
    });
    if (!rows.length) {
      showToast('กรุณากรอกจำนวนอย่างน้อย 1 รายการ', 'warn');
      return;
    }
    try {
      const count = await replaceForecastsForMonth(selMonth, selCust, rows);
      setForecasts(await listForecasts());
      showToast(`บันทึกแผน ${count} รายการแล้ว (Supabase / local fallback)`);
    } catch (err) {
      showToast(err.message || 'Save failed', 'warn');
    }
  };

  const copyLastMonth = async () => {
    const prevYm = prevMonthYm(selMonth);
    try {
      const count = await copyForecastsFromMonth(prevYm, selMonth, selCust || '');
      if (!count) {
        showToast(`ไม่มีข้อมูลให้ copy จาก ${prevYm}`, 'warn');
        return;
      }
      setForecasts(await listForecasts());
      showToast(`📋 Copy สำเร็จ ${count} รายการ`);
    } catch (err) {
      showToast(err.message || 'Copy failed', 'warn');
    }
  };

  const exportAll = () => {
    const filtered = forecasts.filter(
      (f) =>
        (!selMonth || (f.delivDate || '').slice(0, 7) === selMonth) &&
        (!selCust || f.custCode === selCust),
    );
    exportCsv(
      `Forecast_Export_${selMonth}.csv`,
      ['รหัสลูกค้า', 'รหัสสินค้า', 'จำนวน', 'วันต้องการ', 'หมายเหตุ'],
      filtered.map((f) => [f.custCode || '', f.sku, f.qty, f.delivDate || '', f.note || '']),
    );
  };

  const saveEntryRows = async (newRows) => {
    try {
      await mergeForecastsForMonth(selMonth, selCust, newRows);
      setForecasts(await listForecasts());
    } catch (err) {
      showToast(err.message || 'Import failed', 'warn');
    }
  };

  const tabBtnStyle = (id) =>
    activeTab === id
      ? { background: 'var(--N)', color: '#fff', borderColor: 'var(--N)', fontWeight: 600 }
      : undefined;

  return (
    <section className="legacy-forecast tgm-page">
      <PageHeader
        title="Sales Forecast / แผนยอดขาย"
        description="Legacy pgForecast — Supabase sc_sales_forecasts (local fallback when offline)."
        actions={
          <>
            <Badge type="info">DATA ENTRY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />
      <Alert variant="warning" className="mb-3">
        Forecast data is stored in Supabase only. No Express SO creation or stock reservation from this page.
      </Alert>
      {toast && (
        <div
          className="fc-toast"
          style={
            toast.type === 'warn'
              ? { background: 'var(--LY)', color: 'var(--A)', borderColor: 'rgba(122,69,0,.2)' }
              : undefined
          }
        >
          {toast.msg}
        </div>
      )}

      <div className="frow">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="btn btn-xs"
            style={tabBtnStyle(t.id)}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}

        <div style={{ width: '1px', background: 'var(--BD)', alignSelf: 'stretch', margin: '0 2px' }} />

        <select
          className="fc-select"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
        >
          <option value="day">Template: วัน</option>
          <option value="week">Template: สัปดาห์</option>
          <option value="month">Template: เดือน</option>
          <option value="cust">Template: ลูกค้า</option>
        </select>

        <input
          type="month"
          className="fc-input"
          value={selMonth}
          onChange={(e) => setSelMonth(e.target.value)}
        />

        {template !== 'cust' && (
          <select
            className="fc-select"
            style={{ minWidth: '180px' }}
            value={selCust}
            onChange={(e) => setSelCust(e.target.value)}
          >
            <option value="">— ลูกค้า (ทั้งหมด) —</option>
            {LEGACY_CUSTOMERS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name || c.code}
              </option>
            ))}
          </select>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button type="button" className="btn btn-xs" onClick={copyLastMonth} title="คัดลอก Forecast จากเดือนที่แล้ว">
            📋 Copy เดือนที่แล้ว
          </button>
          <button type="button" className="btn btn-xs btn-p" onClick={() => showToast('ใช้ + เพิ่มรายการสินค้า ในตารางแผน')}>
            + เพิ่ม
          </button>
          <button type="button" className="btn btn-xs btn-g" onClick={exportAll}>
            Export Excel
          </button>
        </div>
      </div>

      {activeTab === 'grid' && template !== 'cust' && (
        <ForecastGridTab
          selMonth={selMonth}
          selCust={selCust}
          template={template}
          forecasts={forecasts}
          gridSkus={gridSkus}
          gridValues={gridValues}
          aiSuggest={aiSuggest}
          onGridValuesChange={setGridValues}
          onGridSkusChange={setGridSkus}
          onAiSuggestChange={setAiSuggest}
          onSave={saveGrid}
          onToast={showToast}
        />
      )}

      {activeTab === 'grid' && template === 'cust' && (
        <div className="fc-safe-note">
          Template ลูกค้า: ใช้แท็บ ตารางแผน ด้วย Template สัปดาห์/วัน/เดือน — มุมมองรายลูกค้าแบบ legacy จะเชื่อมในเฟสถัดไป
        </div>
      )}

      {activeTab === 'summary' && (
        <ForecastSummaryTab forecasts={forecasts} selMonth={selMonth} selCust={selCust} />
      )}

      {activeTab === 'entry' && (
        <ForecastEntryTab
          selMonth={selMonth}
          selCust={selCust}
          template={template}
          onSaveEntry={saveEntryRows}
          onToast={showToast}
        />
      )}

      {activeTab === 'list' && (
        <ForecastListTab forecasts={forecasts} selMonth={selMonth} selCust={selCust} />
      )}

      {activeTab === 'doc' && <ForecastDocTab selMonth={selMonth} selCust={selCust} />}
    </section>
  );
}
