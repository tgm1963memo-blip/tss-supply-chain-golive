const STORAGE_KEY = 'tss_golive_forecasts_v1';

export function loadForecasts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveForecasts(rows) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function replaceForecastsForMonth(month, custCode, newRows) {
  const all = loadForecasts();
  const filtered = all.filter((f) => {
    const fm = (f.delivDate || '').slice(0, 7);
    const matchMonth = fm === month;
    const matchCust = !custCode || f.custCode === custCode;
    return !(matchMonth && matchCust);
  });
  saveForecasts([...filtered, ...newRows]);
  return newRows.length;
}

export function genForecastId() {
  return `FC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
