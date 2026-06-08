import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import StatusBadge from '../../components/scm-ui/StatusBadge.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  isSupabaseConfigured,
  listSalesOrderReservationCandidates,
} from '../../services/sales/reservationSourceService.js';

const INITIAL_FILTERS = {
  roomCode: 'TSS',
  documentNo: '',
  productCode: '',
  customerCode: '',
  reservationExists: '',
};

function formatQty(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="min-h-10 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-main)] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-[var(--color-bg)] disabled:text-[var(--color-text-muted)]"
    />
  );
}

function SelectInput(props) {
  return (
    <select
      {...props}
      className="min-h-10 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-main)] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
    />
  );
}

export default function SalesOrderListPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [submittedFilters, setSubmittedFilters] = useState(INITIAL_FILTERS);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function loadCandidates(nextFilters = submittedFilters) {
    if (!isSupabaseConfigured()) {
      setRows([]);
      setError(new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await listSalesOrderReservationCandidates({
        roomCode: nextFilters.roomCode.trim(),
        documentNo: nextFilters.documentNo,
        productCode: nextFilters.productCode,
        customerCode: nextFilters.customerCode,
        reservationExists: nextFilters.reservationExists === ''
          ? undefined
          : nextFilters.reservationExists === 'yes',
        limit: 500,
      });
      setRows(data);
    } catch (err) {
      setError(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCandidates(INITIAL_FILTERS);
  }, []);

  function handleFilterSubmit(event) {
    event.preventDefault();
    setSubmittedFilters(filters);
    loadCandidates(filters);
  }

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="tgm-page">
      <PageHeader
        title="Sales Order"
        description="Read-only sales order lines from Express SO reservation candidate view. No stock deduction or write-back."
        actions={<Badge type="neutral">Read-only</Badge>}
      />

      <Alert variant="warning">
        Migrated from SCM Reservation SO Candidates. Preview source lines before reservation — no mutations on this page.
      </Alert>

      {!isSupabaseConfigured() && (
        <Alert variant="info">
          Configure Supabase environment variables to load live SO data. Showing empty list until configured.
        </Alert>
      )}

      {error ? (
        <Alert variant="danger">{error.message || 'Unable to load sales orders.'}</Alert>
      ) : null}

      <section className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[var(--color-text-main)]">Sales order lines</h3>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Source: sc_so_reservation_candidate_view
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadCandidates(submittedFilters)}
            className="tgm-button-secondary"
          >
            Refresh
          </button>
        </div>

        <form onSubmit={handleFilterSubmit} className="grid gap-3 md:grid-cols-[120px_1fr_1fr_1fr_160px_auto]">
          <TextInput
            value={filters.roomCode}
            onChange={(event) => updateFilter('roomCode', event.target.value)}
            placeholder="Room"
          />
          <TextInput
            type="search"
            value={filters.documentNo}
            onChange={(event) => updateFilter('documentNo', event.target.value)}
            placeholder="SO document"
          />
          <TextInput
            type="search"
            value={filters.productCode}
            onChange={(event) => updateFilter('productCode', event.target.value)}
            placeholder="Product"
          />
          <TextInput
            type="search"
            value={filters.customerCode}
            onChange={(event) => updateFilter('customerCode', event.target.value)}
            placeholder="Customer"
          />
          <SelectInput
            value={filters.reservationExists}
            onChange={(event) => updateFilter('reservationExists', event.target.value)}
          >
            <option value="">All candidates</option>
            <option value="no">Not reserved</option>
            <option value="yes">Reserved</option>
          </SelectInput>
          <button type="submit" className="tgm-button-primary">
            Search
          </button>
        </form>

        <TablePanel title="Sales Order Worklist">
          <table className="tgm-table">
            <thead>
              <tr>
                <th>SO</th>
                <th>Customer</th>
                <th>Dates</th>
                <th>Product</th>
                <th>Qty</th>
                <th>WH / LOC</th>
                <th>Status</th>
                <th>Reservation</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center text-[var(--color-text-muted)] py-8">
                    Loading sales orders...
                  </td>
                </tr>
              ) : null}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-[var(--color-text-muted)] py-8">
                    No sales order lines found.
                  </td>
                </tr>
              ) : null}
              {!loading && rows.map((row) => (
                <tr key={`${row.roomCode}:${row.documentNo}:${row.lineNo ?? ''}`}>
                  <td className="whitespace-nowrap">
                    <Link
                      to={`/sales/orders/${encodeURIComponent(row.documentNo)}`}
                      className="font-mono font-semibold text-[var(--color-text-main)] hover:text-brand-600"
                    >
                      {row.documentNo}
                    </Link>
                    <div className="text-xs text-[var(--color-text-muted)]">Line {row.lineNo ?? '-'}</div>
                  </td>
                  <td>{row.customerCode || '-'}</td>
                  <td className="text-xs">
                    <div>{row.documentDate || '-'}</div>
                    <div className="text-[var(--color-text-muted)]">{row.deliveryDate || '-'}</div>
                  </td>
                  <td className="font-mono">{row.productCode}</td>
                  <td>
                    <div className="font-semibold text-[var(--color-text-main)]">
                      {formatQty(row.candidateRequestedQty)}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      Ordered {formatQty(row.orderedQty)}
                    </div>
                  </td>
                  <td>
                    {(row.warehouseCode || '-')}/{(row.locationCode || '-')}
                  </td>
                  <td>
                    <StatusBadge status={row.documentStatus || row.lineStatus} />
                  </td>
                  <td>
                    {row.reservationExists ? (
                      <StatusBadge status={row.reservationStatus} />
                    ) : (
                      <span className="text-xs font-medium text-[var(--color-text-muted)]">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TablePanel>
      </section>
    </section>
  );
}
