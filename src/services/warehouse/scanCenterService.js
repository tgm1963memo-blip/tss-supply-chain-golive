const STORAGE_KEY = 'sc_golive_scan_log_v1';

function loadLog() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLog(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 200)));
}

export function listScanLog(filters = {}) {
  let rows = loadLog();
  if (filters.mode) {
    rows = rows.filter((r) => r.mode === filters.mode);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter(
      (r) => r.barcode.toLowerCase().includes(q)
        || (r.productCode || '').toLowerCase().includes(q)
        || (r.note || '').toLowerCase().includes(q),
    );
  }
  return rows;
}

export function recordScanEntry(entry) {
  const rows = loadLog();
  const row = {
    id: crypto.randomUUID(),
    barcode: entry.barcode,
    mode: entry.mode || 'general',
    productCode: entry.productCode || '',
    warehouseCode: entry.warehouseCode || '',
    locationCode: entry.locationCode || '',
    note: entry.note || '',
    status: 'logged_safe_mode',
    scannedAt: new Date().toISOString(),
  };
  rows.unshift(row);
  saveLog(rows);
  return row;
}

export function getScanSummary() {
  const rows = loadLog();
  return {
    totalScans: rows.length,
    receivingScans: rows.filter((r) => r.mode === 'receiving').length,
    pickingScans: rows.filter((r) => r.mode === 'picking').length,
    countScans: rows.filter((r) => r.mode === 'cycle_count').length,
  };
}
