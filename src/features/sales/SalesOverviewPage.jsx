import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  getSalesByCustomerGroup,
  getSalesByMonth,
  getSalesByProductGroup,
  getSalesOverviewSummary,
  isSupabaseConfigured,
  listSalesOverviewRows,
} from '../../services/sales/salesOverviewService.js';

const INITIAL_FILTERS = {
  dateFrom: '',
  dateTo: '',
  roomCode: 'TSS',
  customerGroup: '',
  productGroup: '',
  salesperson: '',
  search: '',
};

function formatMoney(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatQty(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function ChartBars({ title, data, valueLabel = 'Value' }) {
  const max = Math.max(...(data || []).map((item) => item.value), 1);
  return (
    <TablePanel title={title}>
      {!data?.length ? (
        <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">No chart data for selected filters.</p>
      ) : (
        <div className="space-y-2">
          {data.map((item) => (
            <div key={item.label} className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0 truncate" title={item.label}>{item.label || 'Other'}</span>
              <div className="flex-1 h-5 bg-[var(--color-surface-muted)] rounded overflow-hidden">
                <div
                  className="h-full bg-[var(--color-primary)] rounded"
                  style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
                />
              </div>
              <span className="w-24 text-right font-mono">{formatMoney(item.value)}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-[var(--color-text-muted)] mt-3">{valueLabel} — read-only from Supabase read models.</p>
    </TablePanel>
  );
}

export default function SalesOverviewPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [submittedFilters, setSubmittedFilters] = useState(INITIAL_FILTERS);
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [byMonth, setByMonth] = useState([]);
  const [byCustomerGroup, setByCustomerGroup] = useState([]);
  const [byProductGroup, setByProductGroup] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async (nextFilters) => {
    if (!isSupabaseConfigured()) {
      setSummary(null);
      setRows([]);
      setByMonth([]);
      setByCustomerGroup([]);
      setByProductGroup([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [summaryData, rowData, monthData, custGroupData, prodGroupData] = await Promise.all([
        getSalesOverviewSummary(nextFilters),
        listSalesOverviewRows(nextFilters),
        getSalesByMonth(nextFilters),
        getSalesByCustomerGroup(nextFilters),
        getSalesByProductGroup(nextFilters),
      ]);
      setSummary(summaryData);
      setRows(rowData);
      setByMonth(monthData);
      setByCustomerGroup(custGroupData);
      setByProductGroup(prodGroupData);
    } catch (err) {
      setError(err);
      setSummary(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(submittedFilters);
  }, [submittedFilters, loadData]);

  const filterOptions = useMemo(() => {
    const customerGroups = [...new Set(rows.map((row) => row.customerGroup).filter(Boolean))].sort();
    const productGroups = [...new Set(rows.map((row) => row.productGroup).filter(Boolean))].sort();
    const salespeople = [...new Set(rows.map((row) => row.salesperson).filter(Boolean))].sort();
    return { customerGroups, productGroups, salespeople };
  }, [rows]);

  function applyFilters(event) {
    event?.preventDefault?.();
    setSubmittedFilters({ ...filters });
  }

  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="Sales Overview / ภาพรวมยอดขาย"
        description="Migrated from legacy pgMySales (mysales). Read-only analytics from Express sync read models."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />

      <Alert variant="info">
        Data is read-only from Supabase read models (sc_web_sales_dashboard_view / sc_express_invoices).
        No Express write-back, no stock posting, no SO creation from this page.
      </Alert>

      {!isSupabaseConfigured() && (
        <Alert variant="warning">
          Supabase not configured — showing empty structure. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
        </Alert>
      )}

      <form className="tgm-filter-bar flex flex-wrap gap-3 items-end" onSubmit={applyFilters}>
        <label className="flex flex-col gap-1 text-sm">
          <span>Date from</span>
          <input type="date" className="tgm-input" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Date to</span>
          <input type="date" className="tgm-input" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Room / Company</span>
          <select className="tgm-input" value={filters.roomCode} onChange={(e) => setFilters({ ...filters, roomCode: e.target.value })}>
            <option value="TSS">TSS</option>
            <option value="TGD">TGD</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Customer group</span>
          <select className="tgm-input" value={filters.customerGroup} onChange={(e) => setFilters({ ...filters, customerGroup: e.target.value })}>
            <option value="">All</option>
            {filterOptions.customerGroups.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Product group</span>
          <select className="tgm-input" value={filters.productGroup} onChange={(e) => setFilters({ ...filters, productGroup: e.target.value })}>
            <option value="">All</option>
            {filterOptions.productGroups.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Salesperson</span>
          <select className="tgm-input" value={filters.salesperson} onChange={(e) => setFilters({ ...filters, salesperson: e.target.value })}>
            <option value="">All</option>
            {filterOptions.salespeople.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm min-w-[180px] flex-1">
          <span>Search</span>
          <input
            type="search"
            className="tgm-input"
            placeholder="Customer, invoice, salesperson..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </label>
        <button type="submit" className="tgm-btn tgm-btn-primary">Apply filters</button>
      </form>

      {loading && <Alert variant="info">Loading sales overview from Supabase...</Alert>}
      {error ? <Alert variant="danger">{error.message}</Alert> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total Sales" value={formatMoney(summary?.totalSales)} />
        <KpiCard label="Total Qty" value={formatQty(summary?.totalQty)} />
        <KpiCard label="Number of Customers" value={summary?.customerCount ?? 0} />
        <KpiCard label="Number of Orders / Invoices" value={summary?.orderCount ?? 0} />
        <KpiCard label="Average Sales / Day" value={formatMoney(summary?.averageSalesPerDay)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <ChartBars title="Sales by month" data={byMonth} valueLabel="Monthly total (amount or qty proxy)" />
        <ChartBars title="Sales by customer group" data={byCustomerGroup} />
        <ChartBars title="Sales by product group" data={byProductGroup} />
      </div>

      <TablePanel title="Sales detail (legacy tab: รายลูกค้า / รายสินค้า / รายเซลส์)">
        <table className="tgm-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Product group</th>
              <th>Salesperson</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Amount</th>
              <th>Channel / type</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id || `${row.documentNo}-${row.date}`}>
                <td>{row.date || '—'}</td>
                <td>
                  <div className="font-medium">{row.customerName || row.customerCode || '—'}</div>
                  {row.customerCode ? <div className="text-xs text-[var(--color-text-muted)] font-mono">{row.customerCode}</div> : null}
                </td>
                <td>{row.productGroup || '—'}</td>
                <td>{row.salesperson || '—'}</td>
                <td className="text-right">{formatQty(row.qty)}</td>
                <td className="text-right">{formatMoney(row.amount)}</td>
                <td>{row.channel || '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-[var(--color-text-muted)] py-6">
                  No sales rows for selected filters. Sync Express invoices or adjust date range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TablePanel>
    </section>
  );
}
