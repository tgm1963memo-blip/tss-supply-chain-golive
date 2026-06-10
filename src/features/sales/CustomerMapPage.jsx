import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  getCustomerMapSalesSummary,
  isSupabaseConfigured,
} from '../../services/customerMap/customerMapService.js';

const INITIAL_FILTERS = {
  dateFrom: '',
  dateTo: '',
  roomCode: 'TSS',
  customerGroup: '',
  productGroup: '',
  salesperson: '',
  search: '',
};

const TABS = [
  { id: 'customer', label: 'By Customer / ตามลูกค้า' },
  { id: 'detail', label: 'Invoice Detail / รายละเอียด' },
  { id: 'group', label: 'By Group / กลุ่มลูกค้า' },
];

function formatMoney(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatQty(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function CustomerMapPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [submittedFilters, setSubmittedFilters] = useState(INITIAL_FILTERS);
  const [activeTab, setActiveTab] = useState('customer');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async (nextFilters) => {
    if (!isSupabaseConfigured()) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await getCustomerMapSalesSummary(nextFilters));
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(submittedFilters);
  }, [submittedFilters, loadData]);

  const filteredRows = useMemo(() => {
    if (!data?.rows) return [];
    const q = submittedFilters.search.trim().toLowerCase();
    if (!q) return data.rows;
    return data.rows.filter(
      (row) =>
        (row.customerName || '').toLowerCase().includes(q) ||
        (row.customerCode || '').toLowerCase().includes(q),
    );
  }, [data, submittedFilters.search]);

  function applyFilters(event) {
    event?.preventDefault?.();
    setSubmittedFilters({ ...filters });
  }

  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="Customer Map / สรุปยอดขาย"
        description="Legacy pgCustMap → pgMySales layout. Read-only sales summary by customer — no map SDK."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />

      <Alert variant="info">
        Legacy custmap uses the same sales overview layout as pgMySales. Data from sc_web_sales_dashboard_view / sc_express_invoices — no Express write-back.
      </Alert>

      {!isSupabaseConfigured() && (
        <Alert variant="warning">Supabase not configured — configure env vars to load live sales data.</Alert>
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
          <span>Room</span>
          <input className="tgm-input w-24" value={filters.roomCode} onChange={(e) => setFilters({ ...filters, roomCode: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Search customer</span>
          <input className="tgm-input" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Code or name" />
        </label>
        <button type="submit" className="tgm-btn tgm-btn-primary">Apply</button>
      </form>

      {loading && <Alert variant="info">Loading customer sales summary...</Alert>}
      {error ? <Alert variant="danger">{error.message}</Alert> : null}

      {data?.summary && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Total Sales" value={formatMoney(data.summary.totalSales)} />
            <KpiCard label="Customers" value={data.summary.customerCount} />
            <KpiCard label="Orders" value={data.summary.orderCount} />
            <KpiCard label="Total Qty" value={formatQty(data.summary.totalQty)} />
          </div>

          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`tgm-btn tgm-btn-sm${activeTab === tab.id ? ' tgm-btn-primary' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'customer' && (
            <TablePanel title="Sales by Customer / สรุปยอดขายตามลูกค้า">
              <table className="tgm-table">
                <thead>
                  <tr>
                    <th>Customer Code</th>
                    <th>Customer Name</th>
                    <th>Group</th>
                    <th>Salesperson</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {data.customerTotals.map((row) => (
                    <tr key={row.customerCode}>
                      <td className="font-mono text-xs">{row.customerCode}</td>
                      <td>{row.customerName}</td>
                      <td>{row.customerGroup || '—'}</td>
                      <td>{row.salesperson || '—'}</td>
                      <td className="text-right font-mono">{formatQty(row.totalQty)}</td>
                      <td className="text-right font-mono">{formatMoney(row.totalAmount)}</td>
                      <td className="text-right">{row.orderCount}</td>
                    </tr>
                  ))}
                  {data.customerTotals.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-6 text-[var(--color-text-muted)]">No customer sales in range.</td></tr>
                  )}
                </tbody>
              </table>
            </TablePanel>
          )}

          {activeTab === 'detail' && (
            <TablePanel title="Sales Detail / รายละเอียดยอดขาย">
              <table className="tgm-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Product Group</th>
                    <th>Salesperson</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.date || '—'}</td>
                      <td>
                        <div className="font-mono text-xs">{row.customerCode}</div>
                        <div>{row.customerName}</div>
                      </td>
                      <td>{row.productGroup || '—'}</td>
                      <td>{row.salesperson || '—'}</td>
                      <td className="text-right font-mono">{formatQty(row.qty)}</td>
                      <td className="text-right font-mono">{formatMoney(row.amount)}</td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-6 text-[var(--color-text-muted)]">No rows.</td></tr>
                  )}
                </tbody>
              </table>
            </TablePanel>
          )}

          {activeTab === 'group' && (
            <TablePanel title="By Customer Group / ตามกลุ่มลูกค้า">
              <table className="tgm-table">
                <thead>
                  <tr>
                    <th>Customer Group</th>
                    <th className="text-right">Sales Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.byCustomerGroup || []).map((row) => (
                    <tr key={row.label}>
                      <td>{row.label || 'Other'}</td>
                      <td className="text-right font-mono">{formatMoney(row.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TablePanel>
          )}
        </>
      )}
    </section>
  );
}
