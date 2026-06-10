import { supabase } from '../../lib/supabaseClient.js';
import {
  genForecastId,
  loadForecasts as loadLocalForecasts,
  replaceForecastsForMonth as replaceLocalForecastsForMonth,
  saveForecasts as saveLocalForecasts,
} from '../../features/sales/forecast/forecastStorage.js';

function ensureSupabase() {
  if (!supabase) return false;
  return true;
}

function rowToLegacy(row) {
  return {
    id: row.id,
    custCode: row.customer_code || null,
    sku: row.sku_code,
    skuName: row.sku_name || row.sku_code,
    qty: Number(row.qty) || 0,
    delivDate: row.deliv_date || null,
    note: row.note || '',
    approved: row.approved || false,
    week: row.week_no || null,
  };
}

function legacyToRow(entry) {
  const delivDate = entry.delivDate || null;
  return {
    customer_code: entry.custCode || null,
    sku_code: entry.sku,
    sku_name: entry.skuName || entry.sku,
    qty: Number(entry.qty) || 0,
    deliv_date: delivDate,
    delivery_month: delivDate ? delivDate.slice(0, 7) : null,
    template: entry.template || 'week',
    week_no: entry.week || null,
    note: entry.note || '',
    approved: entry.approved || false,
    created_by: entry.created_by || 'Current User',
    updated_at: new Date().toISOString(),
  };
}

export function isSupabaseConfigured() {
  return Boolean(supabase);
}

export async function listForecasts() {
  if (!ensureSupabase()) return loadLocalForecasts();

  const { data, error } = await supabase
    .from('sc_sales_forecasts')
    .select('*')
    .order('deliv_date', { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToLegacy);
}

export async function replaceForecastsForMonth(month, custCode, newRows) {
  if (!ensureSupabase()) return replaceLocalForecastsForMonth(month, custCode, newRows);

  let deleteQuery = supabase.from('sc_sales_forecasts').delete().eq('delivery_month', month);
  if (custCode) deleteQuery = deleteQuery.eq('customer_code', custCode);
  const { error: deleteError } = await deleteQuery;
  if (deleteError) throw deleteError;

  if (!newRows.length) return 0;

  const inserts = newRows.map((entry) => legacyToRow({ ...entry, template: entry.note?.includes('grid:') ? entry.note.split(':')[1] : 'week' }));
  const { error: insertError } = await supabase.from('sc_sales_forecasts').insert(inserts);
  if (insertError) throw insertError;
  return newRows.length;
}

export async function appendForecasts(newRows) {
  if (!ensureSupabase()) {
    const all = loadLocalForecasts();
    saveLocalForecasts([...all, ...newRows]);
    return newRows.length;
  }

  const inserts = newRows.map((entry) => legacyToRow(entry));
  const { error } = await supabase.from('sc_sales_forecasts').insert(inserts);
  if (error) throw error;
  return newRows.length;
}

export async function copyForecastsFromMonth(prevMonth, targetMonth, custCode) {
  const all = await listForecasts();
  const prevFc = all.filter((f) => (f.delivDate || '').startsWith(prevMonth));
  const thisFc = all.filter((f) => (f.delivDate || '').slice(0, 7) === targetMonth);
  const existKeys = new Set(thisFc.map((f) => `${f.sku}|${f.custCode || ''}`));

  const copies = prevFc
    .filter((f) => !existKeys.has(`${f.sku}|${f.custCode || ''}`))
    .filter((f) => !custCode || f.custCode === custCode)
    .map((f) => ({
      ...f,
      id: genForecastId(),
      delivDate: f.delivDate ? f.delivDate.replace(prevMonth, targetMonth) : null,
      approved: false,
      note: `[Copy from ${prevMonth}] ${f.note || ''}`.trim(),
    }));

  if (!copies.length) return 0;
  await appendForecasts(copies);
  return copies.length;
}

export async function mergeForecastsForMonth(month, custCode, newRows) {
  const all = await listForecasts();
  const filtered = all.filter((f) => {
    const fm = (f.delivDate || '').slice(0, 7);
    const matchMonth = fm === month;
    const matchCust = !custCode || f.custCode === custCode;
    return !(matchMonth && matchCust);
  });

  if (!ensureSupabase()) {
    saveLocalForecasts([...filtered, ...newRows]);
    return newRows.length;
  }

  await replaceForecastsForMonth(month, custCode, newRows);
  return newRows.length;
}
