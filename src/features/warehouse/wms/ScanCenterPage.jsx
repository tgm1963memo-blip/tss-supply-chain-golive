import { useEffect, useState } from 'react';
import Alert from '../../../components/scm-ui/Alert.jsx';
import Badge from '../../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../../components/scm-ui/Card.jsx';
import PageHeader from '../../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../../components/scm-ui/TablePanel.jsx';
import {
  getScanSummary,
  listScanLog,
  recordScanEntry,
} from '../../../services/warehouse/scanCenterService.js';

const MODES = [
  { value: 'receiving', label: 'Receiving' },
  { value: 'picking', label: 'Picking' },
  { value: 'cycle_count', label: 'Cycle Count' },
  { value: 'general', label: 'General' },
];

export default function ScanCenterPage() {
  const [mode, setMode] = useState('receiving');
  const [barcode, setBarcode] = useState('');
  const [productCode, setProductCode] = useState('');
  const [warehouseCode, setWarehouseCode] = useState('');
  const [locationCode, setLocationCode] = useState('');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [message, setMessage] = useState(null);

  function refreshLog(nextSearch = search) {
    setRows(listScanLog({ mode: '', search: nextSearch }));
    setSummary(getScanSummary());
  }

  useEffect(() => {
    refreshLog('');
  }, []);

  function handleScanSubmit(event) {
    event.preventDefault();
    if (!barcode.trim()) return;

    const entry = recordScanEntry({
      barcode: barcode.trim(),
      mode,
      productCode: productCode.trim(),
      warehouseCode: warehouseCode.trim(),
      locationCode: locationCode.trim(),
      note: 'Safe mode log only — no stock posting',
    });

    setMessage(`Logged scan ${entry.barcode} (${mode}) — no WMS posting.`);
    setBarcode('');
    refreshLog(search);
  }

  function handleFilterSubmit(event) {
    event.preventDefault();
    refreshLog(search);
  }

  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="Scan Center"
        description="Barcode scan hub for receiving, picking, and cycle count — safe mode log only."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />

      <Alert variant="warning">
        Scans are logged locally for UAT only. No receiving confirmation, pick confirmation, or Express write-back.
      </Alert>

      {message ? <Alert variant="success">{message}</Alert> : null}

      {summary ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="Total Scans" value={summary.totalScans} />
          <KpiCard label="Receiving" value={summary.receivingScans} />
          <KpiCard label="Picking" value={summary.pickingScans} />
          <KpiCard label="Cycle Count" value={summary.countScans} />
        </div>
      ) : null}

      <form
        onSubmit={handleScanSubmit}
        className="grid gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] md:grid-cols-2"
      >
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-[var(--color-text-muted)]">Scan Mode</span>
          <select className="tgm-input w-full" value={mode} onChange={(e) => setMode(e.target.value)}>
            {MODES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-[var(--color-text-muted)]">Barcode *</span>
          <input
            className="tgm-input w-full font-mono"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Scan or type barcode..."
            autoFocus
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Product Code</span>
          <input className="tgm-input w-full" value={productCode} onChange={(e) => setProductCode(e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Warehouse</span>
          <input className="tgm-input w-full" value={warehouseCode} onChange={(e) => setWarehouseCode(e.target.value)} />
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-[var(--color-text-muted)]">Location</span>
          <input className="tgm-input w-full" value={locationCode} onChange={(e) => setLocationCode(e.target.value)} />
        </label>
        <div className="md:col-span-2">
          <button type="submit" className="btn btn-primary">Log Scan (Safe Mode)</button>
        </div>
      </form>

      <TablePanel title="Scan Log">
        <form onSubmit={handleFilterSubmit} className="mb-4 flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-4">
          <input
            type="search"
            className="tgm-input w-64 text-sm"
            placeholder="Filter barcode / SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">Filter</button>
        </form>
        <div className="overflow-x-auto">
          <table className="tgm-table whitespace-nowrap min-w-max">
            <thead>
              <tr>
                <th>Time</th>
                <th>Mode</th>
                <th>Barcode</th>
                <th>SKU</th>
                <th>WH / Loc</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.scannedAt).toLocaleString()}</td>
                  <td>{row.mode}</td>
                  <td className="font-mono">{row.barcode}</td>
                  <td className="font-mono">{row.productCode || '—'}</td>
                  <td>{row.warehouseCode || '—'}{row.locationCode ? ` / ${row.locationCode}` : ''}</td>
                  <td><Badge type="neutral">{row.status}</Badge></td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--color-text-muted)]">No scans logged yet</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </TablePanel>
    </section>
  );
}
