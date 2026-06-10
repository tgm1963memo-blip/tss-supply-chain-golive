import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  exportReportCsv,
  getReportPreview,
  isSupabaseConfigured,
  listReportDefinitions,
} from '../../services/admin/adminReportsService.js';

const CATEGORIES = ['', 'Sales', 'Inventory', 'Planning', 'Consignment', 'Warehouse', 'System'];

export default function AdminReportsPage() {
  const [category, setCategory] = useState('');
  const [selectedId, setSelectedId] = useState('sales');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportMessage, setExportMessage] = useState(null);
  const [error, setError] = useState(null);

  const reports = useMemo(() => listReportDefinitions(category), [category]);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    getReportPreview(selectedId)
      .then(setPreview)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [selectedId]);

  async function handleExport() {
    setExportMessage(null);
    setError(null);
    try {
      const result = await exportReportCsv(selectedId);
      const blob = new Blob([result.content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = result.filename;
      anchor.click();
      URL.revokeObjectURL(url);
      setExportMessage(`Exported ${result.filename} — read-only CSV, no Express write-back.`);
    } catch (err) {
      setError(err);
    }
  }

  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="Reports & Export"
        description="Legacy pgReports — read-only report center with safe CSV export."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />

      <Alert variant="warning">
        Reports are read-only previews from Supabase read models. CSV export is client-side only — no Express DBF write-back, no service role key in frontend.
      </Alert>

      {!isSupabaseConfigured() ? (
        <Alert variant="info">Supabase not configured — report previews may be empty.</Alert>
      ) : null}
      {exportMessage ? <Alert variant="success">{exportMessage}</Alert> : null}
      {error ? <Alert variant="danger">{error.message || String(error)}</Alert> : null}

      <form className="flex flex-wrap gap-2">
        <select className="tgm-input text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c || 'all'} value={c}>{c || 'All categories'}</option>
          ))}
        </select>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => (
          <button
            key={report.id}
            type="button"
            onClick={() => setSelectedId(report.id)}
            className={`rounded-lg border p-4 text-left shadow-[var(--shadow-card)] transition ${
              selectedId === report.id
                ? 'border-brand-400 bg-[var(--color-surface-muted)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-brand-300'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold">{report.title}</div>
              <Badge type="neutral">{report.category}</Badge>
            </div>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">{report.description}</p>
            <Link to={report.path} className="mt-3 inline-block text-sm text-brand-600" onClick={(e) => e.stopPropagation()}>
              Open live page →
            </Link>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={handleExport} disabled={!selectedId}>
          Export CSV (Safe)
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setSelectedId(selectedId)}>
          Refresh Preview
        </button>
      </div>

      <TablePanel title={`Report Preview — ${selectedId}`}>
        {loading ? <Alert variant="info">Loading report preview...</Alert> : null}
        <div className="overflow-x-auto">
          <table className="tgm-table whitespace-nowrap min-w-max">
            <thead>
              <tr>
                {(preview?.columns || []).map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(preview?.rows || []).map((row, index) => (
                <tr key={index}>
                  {(preview?.columns || []).map((col) => (
                    <td key={col.key}>{String(row[col.key] ?? '—')}</td>
                  ))}
                </tr>
              ))}
              {!loading && !(preview?.rows?.length) ? (
                <tr>
                  <td colSpan={(preview?.columns || []).length || 1} className="py-8 text-center text-[var(--color-text-muted)]">
                    No rows for this report — sync data or adjust filters.
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
