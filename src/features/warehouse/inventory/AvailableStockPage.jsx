import { useCallback, useEffect, useState } from 'react';
import Alert from '../../../components/scm-ui/Alert.jsx';
import Badge from '../../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../../components/scm-ui/Card.jsx';
import PageHeader from '../../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../../components/scm-ui/TablePanel.jsx';
import { getAvailableStockData } from '../../../services/warehouse/warehouseInventoryService.js';

function fmt(v) {
  return Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function AvailableStockPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseCode, setWarehouseCode] = useState('');
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [source, setSource] = useState('seed');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAvailableStockData({
        search: searchTerm,
        warehouseCode,
      });
      setRows(result.rows);
      setSummary(result.summary);
      setWarehouses(result.warehouses);
      setSource(result.source);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, warehouseCode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleFilterSubmit(event) {
    event.preventDefault();
    loadData();
  }

  return (
    <section className="tgm-page space-y-4">
      <PageHeader
        title="Available Stock"
        description="Available qty from sc_inventory_balance_view (on hand minus reserved)."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />

      <Alert variant="warning">
        Read-only available stock visibility. No allocation posting or Express write-back.
      </Alert>

      {source === 'seed' ? (
        <Alert variant="info">Using seed data — configure Supabase for live available stock.</Alert>
      ) : null}

      {summary ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="Available Lines" value={summary.totalLines} />
          <KpiCard label="Available Qty" value={fmt(summary.totalAvailable)} />
          <KpiCard label="On Hand Qty" value={fmt(summary.totalOnHand)} />
          <KpiCard label="Warehouses" value={summary.warehouseCount} />
        </div>
      ) : null}

      <TablePanel title="Available Stock Lines">
        <form onSubmit={handleFilterSubmit} className="mb-4 flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-4">
          <select
            className="tgm-input text-sm"
            value={warehouseCode}
            onChange={(e) => setWarehouseCode(e.target.value)}
          >
            <option value="">All Warehouses</option>
            {warehouses.map((wh) => (
              <option key={wh} value={wh}>{wh}</option>
            ))}
          </select>
          <input
            type="search"
            className="tgm-input w-64 text-sm"
            placeholder="Search SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">Filter</button>
        </form>

        {loading ? <Alert variant="info">Loading available stock...</Alert> : null}

        <div className="overflow-x-auto">
          <table className="tgm-table whitespace-nowrap min-w-max">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>WH / Loc</th>
                <th>Lot</th>
                <th className="text-right">On Hand</th>
                <th className="text-right">Reserved</th>
                <th className="text-right">Available</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.productCode}:${row.warehouseCode}:${row.locationCode}:${row.lotNo}`}>
                  <td className="font-mono text-brand-600">{row.productCode}</td>
                  <td>{row.productName || row.productCode}</td>
                  <td>{row.warehouseCode}{row.locationCode ? ` / ${row.locationCode}` : ''}</td>
                  <td className="font-mono">{row.lotNo || '—'}</td>
                  <td className="text-right">{fmt(row.calculatedOnHandQty || row.erpOnHandQty)}</td>
                  <td className="text-right text-blue-600">{fmt(row.reservedQty)}</td>
                  <td className="text-right font-semibold text-emerald-700">{fmt(row.availableQty)}</td>
                </tr>
              ))}
              {rows.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--color-text-muted)]">No available stock lines</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </TablePanel>
    </section>
  );
}
