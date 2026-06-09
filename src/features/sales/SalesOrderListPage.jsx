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
      className="tgm-input"
    />
  );
}

function SelectInput(props) {
  return (
    <select
      {...props}
      className="tgm-input"
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
    <section className="tgm-page space-y-4">
      <PageHeader
        title="Sales Orders"
        description="View and track all Sales Orders from Express and Supabase."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />
      
      <Alert variant="warning">
        This module operates in Safe Mode. Sales Orders are read directly from read-models. Creation of new SOs or Express write-back is disabled.
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-l-blue-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Total Orders</div>
          <div className="text-2xl font-bold mt-1">2,451</div>
        </div>
        <div className="card p-4 border-l-4 border-l-green-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Confirmed</div>
          <div className="text-2xl font-bold mt-1 text-green-600">1,830</div>
        </div>
        <div className="card p-4 border-l-4 border-l-yellow-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Pending ATP</div>
          <div className="text-2xl font-bold mt-1 text-yellow-600">420</div>
        </div>
        <div className="card p-4 border-l-4 border-l-red-500">
          <div className="text-xs text-gray-500 uppercase font-semibold">Shortage</div>
          <div className="text-2xl font-bold mt-1 text-red-600">201</div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
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
            className="btn btn-secondary"
          >
            Refresh
          </button>
        </div>

        {error && (
          <Alert variant="danger">{error.message || 'Unable to load sales orders.'}</Alert>
        )}

        <form onSubmit={handleFilterSubmit} className="grid gap-3 grid-cols-2 md:grid-cols-6 items-center">
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
          <button type="submit" className="btn btn-p w-full">
            Search
          </button>
        </form>

        <TablePanel>
          <div className="overflow-x-auto">
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
          </div>
        </TablePanel>
      </div>
    </section>
  );
}
