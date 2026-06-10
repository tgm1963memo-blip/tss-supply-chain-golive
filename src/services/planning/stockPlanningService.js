import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';
import { listForecasts } from '../sales/salesForecastService.js';
import { LEGACY_SKUS, LEGACY_SALES_HIST } from '../../features/sales/forecast/legacyForecastData.js';
import { PS_CRITS_ALL } from '../../constants/stockPlanningLegacy.js';

function avg(values) {
  const nums = values.filter((v) => Number(v) > 0);
  return nums.length ? nums.reduce((s, v) => s + v, 0) / nums.length : 0;
}

function monthKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function periodDaysUntil(year, month) {
  const now = new Date();
  const curYm = monthKey(now.getFullYear(), now.getMonth() + 1);
  const selYm = monthKey(year, month);
  if (selYm <= curYm) return 0;
  const selDate = new Date(year, month - 1, 28);
  return Math.max(0, Math.round((selDate - now) / 86400000));
}

function computeBenchmark(crit, histMonthly, selYm, fallback) {
  const vals = Object.entries(histMonthly || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => Number(v) || 0)
    .filter((v) => v > 0);

  const a3 = fallback || avg(vals.slice(-3)) || 0;

  if (crit === 'avg4') return avg(vals.slice(-4)) || a3;
  if (crit === 'last1') return vals.slice(-1)[0] || a3;
  if (crit === 'prevyear') {
    const [py, pm] = selYm.split('-').map(Number);
    return histMonthly?.[`${py - 1}-${String(pm).padStart(2, '0')}`] || a3;
  }
  if (crit === 'weekly') return a3 / 4;
  return a3;
}

function computeDaysCoverage(effStock, bench, crit) {
  if (bench <= 0) return 9999;
  const unit = crit === 'weekly' ? 7 : 30;
  return Math.round((effStock / bench) * unit);
}

function buildStatus(effStock, minStock, days) {
  if (effStock < minStock) return { key: 'urgent', label: 'สั่งด่วน' };
  if (days < 30) return { key: 'watch', label: 'เฝ้าระวัง' };
  return { key: 'ok', label: 'ปกติ' };
}

function enrichRow(base, context) {
  const {
    criteria,
    selYm,
    periodDays,
    forecastBySku,
    reservedBySku,
    shortageBySku,
  } = context;

  const hist = LEGACY_SALES_HIST[base.code]?.monthly || {};
  const benchMap = {};
  criteria.forEach((crit) => {
    benchMap[crit] = computeBenchmark(crit, hist, selYm, base.avg3Monthly);
  });
  const primaryCrit = criteria[0] || 'avg3';
  const bench = benchMap[primaryCrit] || 0;

  const fcRows = forecastBySku[base.code] || { total: 0, po: 0, prod: 0 };
  const reserved = reservedBySku[base.code] || 0;
  const shortage = shortageBySku[base.code] || 0;
  const minStock = base.minStock || 0;

  const consumed = bench > 0 && periodDays > 0 ? bench * (periodDays / 30) : 0;
  const effStock = periodDays > 0 ? Math.max(0, base.stockQty - consumed) : base.stockQty;
  const daysMap = {};
  criteria.forEach((crit) => {
    daysMap[crit] = computeDaysCoverage(effStock, benchMap[crit] || bench, crit);
  });
  const days = daysMap[primaryCrit] || 9999;
  const recQty = Math.max(0, Math.ceil(Math.max(minStock - effStock, 0) + bench));
  const status = buildStatus(effStock, minStock, days);

  return {
    ...base,
    reservedQty: reserved,
    shortageQty: shortage,
    forecastTotal: fcRows.total,
    forecastPo: fcRows.po,
    forecastProd: fcRows.prod,
    bench,
    benchMap,
    days,
    daysMap,
    effStock,
    recQty,
    status,
    primaryCrit,
  };
}

function aggregateForecasts(forecasts) {
  const bySku = {};
  forecasts.forEach((f) => {
    if (!bySku[f.sku]) bySku[f.sku] = { total: 0, po: 0, prod: 0 };
    bySku[f.sku].total += Number(f.qty || 0);
    const fcType = f.fcType || f.template || 'PO';
    if (String(fcType).toLowerCase().includes('prod')) {
      bySku[f.sku].prod += Number(f.qty || 0);
    } else {
      bySku[f.sku].po += Number(f.qty || 0);
    }
  });
  return bySku;
}

function buildSeedRows() {
  return LEGACY_SKUS.map((sku) => {
    const hist = LEGACY_SALES_HIST[sku.code];
    const stockQty = sku.code === '10001' ? 4200 : sku.code === '10003' ? 1800 : 900;
    return {
      code: sku.code,
      name: sku.name,
      productGroup: sku.code.startsWith('2') ? 'Sample' : 'Finished Goods',
      stockQty,
      availableQty: stockQty,
      minStock: Math.round((hist?.avg3 || 1000) * 0.5),
      avg3Monthly: hist?.avg3 || 0,
      leadTime: sku.lt,
    };
  });
}

async function loadLiveStockBaseRows() {
  let stockRows = null;
  let stockErr = null;

  const compact = await supabase
    .from('sc_rm_stock_balance')
    .select('product_code, product_name, qty_on_hand, qty_available')
    .limit(5000);
  if (!compact.error && (compact.data || []).length) {
    stockRows = (compact.data || []).map((row) => ({
      product_code: row.product_code,
      product_name: row.product_name,
      product_group: '',
      qty_on_hand: row.qty_on_hand,
    }));
  } else {
    const legacy = await supabase
      .from('sc_web_stock_balance_view')
      .select('product_code, product_name, product_group, qty_on_hand')
      .limit(5000);
    stockRows = legacy.data;
    stockErr = legacy.error;
  }

  if (stockErr) throw stockErr;

  const bySku = {};
  (stockRows || []).forEach((row) => {
    const code = row.product_code;
    if (!code) return;
    if (!bySku[code]) {
      bySku[code] = {
        code,
        name: row.product_name || code,
        productGroup: row.product_group || '',
        stockQty: 0,
        availableQty: 0,
        minStock: 0,
        avg3Monthly: LEGACY_SALES_HIST[code]?.avg3 || 0,
        leadTime: LEGACY_SKUS.find((s) => s.code === code)?.lt || 7,
      };
    }
    bySku[code].stockQty += Number(row.qty_on_hand || 0);
    bySku[code].availableQty += Number(row.qty_on_hand || 0);
  });

  const { data: shortageRows } = await supabase
    .from('sc_web_shortage_view')
    .select('product_code, shortage_qty')
    .limit(5000);

  const shortageBySku = {};
  (shortageRows || []).forEach((row) => {
    shortageBySku[row.product_code] = (shortageBySku[row.product_code] || 0) + Number(row.shortage_qty || 0);
  });

  Object.values(bySku).forEach((row) => {
    row.minStock = Math.round((row.avg3Monthly || row.stockQty * 0.3 || 100) * 0.5);
  });

  return { rows: Object.values(bySku), shortageBySku };
}

async function loadReservedBySku() {
  const { data, error } = await supabase
    .from('sc_reservation_lines')
    .select('product_code, reserved_qty, status')
    .eq('status', 'active')
    .limit(5000);

  if (error) return {};
  return (data || []).reduce((acc, row) => {
    acc[row.product_code] = (acc[row.product_code] || 0) + Number(row.reserved_qty || 0);
    return acc;
  }, {});
}

export async function getStockPlanningData(filters = {}) {
  const now = new Date();
  const periodYear = filters.periodYear || now.getFullYear();
  const periodMonth = filters.periodMonth || now.getMonth() + 1;
  const criteria = (filters.criteria && filters.criteria.length > 0)
    ? filters.criteria
    : ['avg3'];
  const selYm = monthKey(periodYear, periodMonth);
  const periodDays = periodDaysUntil(periodYear, periodMonth);

  let baseRows = buildSeedRows();
  let source = 'seed';
  let shortageBySku = {};

  if (isSupabaseConfigured()) {
    try {
      const live = await loadLiveStockBaseRows();
      if (live.rows.length > 0) {
        baseRows = live.rows;
        shortageBySku = live.shortageBySku;
        source = 'live';
      }
    } catch {
      baseRows = buildSeedRows();
      source = 'seed';
    }
  }

  const forecasts = await listForecasts().catch(() => []);
  const forecastBySku = aggregateForecasts(forecasts);

  let reservedBySku = {};
  if (isSupabaseConfigured() && source === 'live') {
    reservedBySku = await loadReservedBySku().catch(() => ({}));
  } else {
    baseRows.forEach((row) => {
      reservedBySku[row.code] = row.code === '10001' ? 600 : 0;
    });
  }

  const context = {
    criteria,
    selYm,
    periodDays,
    forecastBySku,
    reservedBySku,
    shortageBySku,
  };

  let rows = baseRows.map((base) => enrichRow(base, context));

  if (filters.productGroup) {
    rows = rows.filter((r) => r.productGroup === filters.productGroup);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter(
      (r) => r.code.toLowerCase().includes(q) || (r.name || '').toLowerCase().includes(q),
    );
  }

  const sortCol = filters.sortCol || 'days';
  const sortDir = filters.sortDir === 'desc' ? -1 : 1;
  rows.sort((a, b) => {
    if (sortCol === 'code') return sortDir * (a.code || '').localeCompare(b.code || '');
    if (sortCol === 'stock') return sortDir * (b.effStock - a.effStock);
    if (sortCol === 'bench') return sortDir * (b.bench - a.bench);
    if (sortCol === 'min') return sortDir * (b.minStock - a.minStock);
    return sortDir * (a.days - b.days);
  });

  const summary = {
    skuCount: rows.length,
    urgentCount: rows.filter((r) => r.status.key === 'urgent').length,
    watchCount: rows.filter((r) => r.status.key === 'watch').length,
    totalStock: rows.reduce((s, r) => s + r.effStock, 0),
    totalReserved: rows.reduce((s, r) => s + r.reservedQty, 0),
    totalRecQty: rows.reduce((s, r) => s + r.recQty, 0),
  };

  const productGroups = [...new Set(baseRows.map((r) => r.productGroup).filter(Boolean))].sort();

  return {
    rows,
    summary,
    source,
    productGroups,
    criteriaLabels: criteria.map((c) => PS_CRITS_ALL.find((x) => x.key === c)?.lbl || c),
    periodLabel: periodDays > 0 ? selYm : null,
  };
}

export { isSupabaseConfigured, PS_CRITS_ALL };
