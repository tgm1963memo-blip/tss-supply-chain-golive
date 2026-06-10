import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  getStockPlanningData,
  PS_CRITS_ALL,
  isSupabaseConfigured,
} from '../../services/planning/stockPlanningService.js';
import { DEFAULT_PS_CRITS, THAI_MONTHS } from '../../constants/stockPlanningLegacy.js';

function fmt(v) {
  return Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function StatusBadge({ status }) {
  const styles = {
    urgent: 'bg-rose-100 text-rose-800 border-rose-200',
    watch: 'bg-amber-100 text-amber-800 border-amber-200',
    ok: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status.key] || styles.ok}`}>
      {status.label}
    </span>
  );
}

export default function StockPlanningPage() {
  const now = new Date();
  const [productGroup, setProductGroup] = useState('');
  const [search, setSearch] = useState('');
  const [criteria, setCriteria] = useState(DEFAULT_PS_CRITS);
  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(now.getFullYear());
  const [sortCol, setSortCol] = useState('days');
  const [sortDir, setSortDir] = useState('asc');
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [productGroups, setProductGroups] = useState([]);
  const [criteriaLabels, setCriteriaLabels] = useState([]);
  const [source, setSource] = useState('seed');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getStockPlanningData({
        productGroup,
        search,
        criteria,
        periodMonth,
        periodYear,
        sortCol,
        sortDir,
      });
      setRows(result.rows);
      setSummary(result.summary);
      setProductGroups(result.productGroups);
      setCriteriaLabels(result.criteriaLabels);
      setSource(result.source);
    } catch (err) {
      setError(err);
      setRows([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [productGroup, search, criteria, periodMonth, periodYear, sortCol, sortDir]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function toggleCriterion(key) {
    setCriteria((current) => {
      if (current.includes(key)) {
        return current.length > 1 ? current.filter((c) => c !== key) : current;
      }
      return [...current, key];
    });
  }

  function handleSort(col) {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir(col === 'days' ? 'asc' : 'desc');
    }
  }

  const sortIndicator = (col) => {
    if (sortCol !== col) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  const titleSuffix = useMemo(() => {
    if (!criteriaLabels.length) return '';
    return ` — ${criteriaLabels.join(', ')}`;
  }, [criteriaLabels]);

  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title={`Stock & Planning${titleSuffix}`}
        description="Legacy pgPlanStock — stock vs forecast benchmarks. Read-only; no production order or PO creation."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
            <Badge type="warning">SUGGESTION ONLY</Badge>
          </>
        }
      />

      <Alert variant="warning">
        Read-only stock planning from WMS/Express sync and Sales Forecast. Production orders and PO creation are
        BLOCKED_BY_GOVERNANCE — use Production / Purchase Suggestion for review only.
      </Alert>

      {source === 'seed' ? (
        <Alert variant="info">
          Using seed data — configure Supabase for live stock from sc_web_stock_balance_view and sc_sales_forecasts.
        </Alert>
      ) : (
        <Alert variant="info">Live data from sc_web_stock_balance_view · sc_sales_forecasts · reservations</Alert>
      )}

      {error ? <Alert variant="danger">{error.message || 'Unable to load stock planning data.'}</Alert> : null}

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">กลุ่มสินค้า</span>
          <select
            className="tgm-input min-w-[140px]"
            value={productGroup}
            onChange={(e) => setProductGroup(e.target.value)}
          >
            <option value="">ทั้งหมด</option>
            {productGroups.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">ค้นหา</span>
          <input
            type="search"
            className="tgm-input w-44"
            placeholder="รหัส/ชื่อ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <div className="space-y-1">
          <span className="block text-sm text-[var(--color-text-muted)]">เกณฑ์เปรียบเทียบ</span>
          <div className="flex flex-wrap gap-2">
            {PS_CRITS_ALL.map((c) => (
              <label
                key={c.key}
                className={`inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs ${
                  criteria.includes(c.key)
                    ? 'border-brand-500 bg-brand-50 text-brand-800'
                    : 'border-[var(--color-border)] bg-[var(--color-bg)]'
                }`}
              >
                <input
                  type="checkbox"
                  className="rounded"
                  checked={criteria.includes(c.key)}
                  onChange={() => toggleCriterion(c.key)}
                />
                {c.lbl}
              </label>
            ))}
          </div>
        </div>

        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">ดูถึงเดือน</span>
          <div className="flex gap-2">
            <select
              className="tgm-input"
              value={periodMonth}
              onChange={(e) => setPeriodMonth(Number(e.target.value))}
            >
              {THAI_MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              className="tgm-input"
              value={periodYear}
              onChange={(e) => setPeriodYear(Number(e.target.value))}
            >
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </label>

        <span className="ml-auto text-xs text-[var(--color-text-muted)]">
          {isSupabaseConfigured() ? '🔴 Live from WMS sync' : 'Offline seed mode'}
        </span>
      </div>

      {summary ? (
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
          <KpiCard label="SKU Lines" value={summary.skuCount} />
          <KpiCard label="สั่งด่วน" value={summary.urgentCount} />
          <KpiCard label="เฝ้าระวัง" value={summary.watchCount} />
          <KpiCard label="Effective Stock" value={fmt(summary.totalStock)} />
          <KpiCard label="Reserved (SC)" value={fmt(summary.totalReserved)} />
          <KpiCard label="แนะนำผลิตรวม" value={fmt(summary.totalRecQty)} />
        </div>
      ) : null}

      {loading ? <Alert variant="info">Loading stock planning...</Alert> : null}

      <TablePanel title="Stock Planning Table">
        <div className="overflow-x-auto">
          <table className="tgm-table whitespace-nowrap min-w-max">
            <thead>
              <tr>
                <th className="cursor-pointer" onClick={() => handleSort('code')}>
                  รหัสสินค้า{sortIndicator('code')}
                </th>
                <th>ชื่อสินค้า</th>
                <th className="cursor-pointer text-right" onClick={() => handleSort('stock')}>
                  Stock{sortIndicator('stock')}
                </th>
                <th className="text-right text-blue-600">จอง (SC)</th>
                <th className="cursor-pointer text-right" onClick={() => handleSort('min')}>
                  ขั้นต่ำ{sortIndicator('min')}
                </th>
                {criteria.map((crit) => {
                  const info = PS_CRITS_ALL.find((x) => x.key === crit) || { lbl: crit };
                  return (
                    <th key={crit} className="text-right text-brand-700">
                      {info.lbl}
                      <br />
                      <span className="text-[10px] font-normal">{crit === 'weekly' ? 'วัน/wk' : 'วัน/เดือน'}</span>
                    </th>
                  );
                })}
                <th className="text-right text-brand-700">FC-PO</th>
                <th className="text-right text-brand-700">FC-ผลิต</th>
                <th className="text-right text-rose-600">Shortage</th>
                <th className="text-right text-amber-700">แนะนำผลิต</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 150).map((row) => (
                <tr key={row.code} className={row.days < 14 ? 'bg-rose-50/50' : row.days < 30 ? 'bg-amber-50/40' : ''}>
                  <td className="font-mono text-brand-600">{row.code}</td>
                  <td className="max-w-[200px] truncate">{row.name}</td>
                  <td className="text-right font-medium">{fmt(row.effStock)}</td>
                  <td className="text-right text-blue-600">{fmt(row.reservedQty)}</td>
                  <td className="text-right">{fmt(row.minStock)}</td>
                  {criteria.map((crit) => (
                    <td key={crit} className="text-right">
                      {row.daysMap?.[crit] >= 9999 ? '∞' : row.daysMap?.[crit]}
                    </td>
                  ))}
                  <td className="text-right">{fmt(row.forecastPo)}</td>
                  <td className="text-right">{fmt(row.forecastProd)}</td>
                  <td className="text-right text-rose-600">{fmt(row.shortageQty) || '—'}</td>
                  <td className="text-right text-amber-700 font-medium">{fmt(row.recQty)}</td>
                  <td><StatusBadge status={row.status} /></td>
                </tr>
              ))}
              {rows.length === 0 && !loading ? (
                <tr>
                  <td colSpan={9 + criteria.length} className="py-8 text-center text-[var(--color-text-muted)]">
                    No stock planning rows
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </TablePanel>
    </section>
  );
}
