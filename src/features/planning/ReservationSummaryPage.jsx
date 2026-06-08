import { useEffect, useMemo, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import StatusBadge from '../../components/scm-ui/StatusBadge.jsx';
import { listReservations } from '../../services/planning/reservationService.js';
import { isSupabaseConfigured } from '../../services/sales/reservationSourceService.js';

const STATUS_OPTIONS = ['', 'draft', 'active', 'partially_released', 'released', 'cancelled', 'expired'];

const INITIAL_FILTERS = {
  status: '',
  documentNo: '',
  productCode: '',
};

function formatQty(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="min-h-10 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-main)] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
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

export default function ReservationSummaryPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [submittedFilters, setSubmittedFilters] = useState(INITIAL_FILTERS);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const summary = useMemo(() => {
    const byStatus = reservations.reduce((acc, row) => {
      const key = row.status || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const totalLines = reservations.reduce((total, row) => total + row.lines.length, 0);
    const totalRequestedQty = reservations.reduce(
      (total, row) => total + row.lines.reduce((lineTotal, line) => lineTotal + line.requestedQty, 0),
      0,
    );
    const totalReservedQty = reservations.reduce(
      (total, row) => total + row.lines.reduce((lineTotal, line) => lineTotal + line.reservedQty, 0),
      0,
    );

    return {
      totalReservations: reservations.length,
      totalLines,
      totalRequestedQty,
      totalReservedQty,
      byStatus,
    };
  }, [reservations]);

  async function loadReservations(nextFilters = submittedFilters) {
    if (!isSupabaseConfigured()) {
      setError(new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'));
      setReservations([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const rows = await listReservations({
        status: nextFilters.status,
        documentNo: nextFilters.documentNo,
        productCode: nextFilters.productCode,
        limit: 200,
      });
      setReservations(rows);
    } catch (err) {
      setError(err);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReservations(INITIAL_FILTERS);
  }, []);

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function handleFilterSubmit(event) {
    event.preventDefault();
    setSubmittedFilters(filters);
    loadReservations(filters);
  }

  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="Reservation Summary"
        description="Read-only summary of active reservations by warehouse, SKU, and sales order."
      />

      {error ? (
        <Alert variant="danger">{error.message || 'Unable to load reservations.'}</Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Reservations" value={summary.totalReservations} />
        <SummaryCard label="Total Lines" value={summary.totalLines} />
        <SummaryCard label="Requested Qty" value={formatQty(summary.totalRequestedQty)} />
        <SummaryCard label="Reserved Qty" value={formatQty(summary.totalReservedQty)} highlight="success" />
      </div>

      {Object.keys(summary.byStatus).length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {Object.entries(summary.byStatus).map(([status, count]) => (
            <span key={status} className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm">
              <StatusBadge status={status} />
              <span className="font-medium text-[var(--color-text-main)]">{count}</span>
            </span>
          ))}
        </div>
      ) : null}

      <section className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
        <form onSubmit={handleFilterSubmit} className="grid gap-3 md:grid-cols-[160px_1fr_1fr_auto]">
          <SelectInput value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
            {STATUS_OPTIONS.map((status) => (
              <option key={status || 'all'} value={status}>
                {status || 'All statuses'}
              </option>
            ))}
          </SelectInput>
          <TextInput
            type="search"
            value={filters.documentNo}
            onChange={(event) => updateFilter('documentNo', event.target.value)}
            placeholder="Document no"
          />
          <TextInput
            type="search"
            value={filters.productCode}
            onChange={(event) => updateFilter('productCode', event.target.value)}
            placeholder="Product code"
          />
          <button
            type="submit"
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-main)] shadow-sm transition hover:bg-[var(--color-bg)]"
          >
            Filter
          </button>
        </form>

        <div className="overflow-hidden rounded-md border border-[var(--color-border)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
              <thead className="bg-[var(--color-bg)] text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                <tr>
                  <th className="px-4 py-3">Document</th>
                  <th className="px-4 py-3">Room</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Lines</th>
                  <th className="px-4 py-3 text-right">Requested</th>
                  <th className="px-4 py-3 text-right">Reserved</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]/40 text-[var(--color-text-muted)]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">Loading reservations...</td>
                  </tr>
                ) : null}
                {!loading && reservations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">No reservations found.</td>
                  </tr>
                ) : null}
                {!loading && reservations.map((reservation) => {
                  const requestedQty = reservation.lines.reduce((total, line) => total + line.requestedQty, 0);
                  const reservedQty = reservation.lines.reduce((total, line) => total + line.reservedQty, 0);
                  return (
                    <tr key={reservation.id}>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="font-mono font-semibold text-[var(--color-text-main)]">{reservation.documentNo}</div>
                        <div className="text-xs">{reservation.documentType || '-'}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{reservation.roomCode}</td>
                      <td className="whitespace-nowrap px-4 py-3"><StatusBadge status={reservation.status} /></td>
                      <td className="whitespace-nowrap px-4 py-3">{reservation.lines.length}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">{formatQty(requestedQty)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">{formatQty(reservedQty)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {reservation.createdAt ? new Date(reservation.createdAt).toLocaleString() : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </section>
  );
}

function SummaryCard({ label, value, highlight }) {
  const valueClass = highlight === 'success'
    ? 'text-emerald-600'
    : 'text-[var(--color-text-main)]';

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <p className="text-xs font-medium uppercase text-[var(--color-text-muted)]">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}
