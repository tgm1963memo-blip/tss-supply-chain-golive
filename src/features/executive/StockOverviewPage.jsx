import { useEffect, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  getInventoryDashboardMetrics,
  isSupabaseConfigured,
} from '../../services/executive/executiveDashboardService.js';

function formatQty(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function StockOverviewPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured()) {
        setMetrics(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getInventoryDashboardMetrics();
        setMetrics(data);
      } catch (err) {
        setError(err);
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <section className="tgm-page">
      <PageHeader
        title="Stock Overview"
        description="Executive inventory health migrated from SCM ReportsPage (Inventory Dashboard tab). Read-only."
        actions={<Badge type="neutral">Read-only</Badge>}
      />

      <Alert variant="info">
        Reads from sc_inventory_balance_view. No data mutation, no stock posting, no Express write-back.
      </Alert>

      {!isSupabaseConfigured() && (
        <Alert variant="warning">
          Supabase not configured — KPIs unavailable. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
        </Alert>
      )}

      {loading && <Alert variant="info">Loading live data from Supabase views...</Alert>}
      {error ? <Alert variant="danger">{error.message}</Alert> : null}

      {metrics && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Total ERP On Hand" value={formatQty(metrics.totalOnHand)} />
            <KpiCard label="Total Reserved" value={formatQty(metrics.totalReserved)} />
            <KpiCard label="Total Available" value={formatQty(metrics.totalAvailable)} />
            <KpiCard label="Locations Count" value={metrics.locations} />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <TablePanel title="Shortage List (Negative Available)">
              <table className="tgm-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Location</th>
                    <th className="text-right">Available</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.shortageList.map((row) => (
                    <tr key={`${row.productCode}-${row.warehouseCode}-${row.locationCode}`}>
                      <td className="font-mono">{row.productCode}</td>
                      <td>{row.warehouseCode}/{row.locationCode}</td>
                      <td className="text-right text-rose-500 font-medium">{formatQty(row.availableQty)}</td>
                    </tr>
                  ))}
                  {metrics.shortageList.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center text-[var(--color-text-muted)] py-4">No shortages</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TablePanel>

            <TablePanel title="Zero Stock / Low Stock">
              <table className="tgm-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Location</th>
                    <th className="text-right">Available</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.lowStockList.map((row) => (
                    <tr key={`${row.productCode}-${row.warehouseCode}-${row.locationCode}-low`}>
                      <td className="font-mono">{row.productCode}</td>
                      <td>{row.warehouseCode}/{row.locationCode}</td>
                      <td className="text-right font-medium">{formatQty(row.availableQty)}</td>
                    </tr>
                  ))}
                  {metrics.lowStockList.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center text-[var(--color-text-muted)] py-4">No low stock items</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TablePanel>
          </div>

          <TablePanel title="Top Reserved (Qty)">
            <table className="tgm-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Location</th>
                  <th className="text-right">Reserved</th>
                  <th className="text-right">Available</th>
                </tr>
              </thead>
              <tbody>
                {metrics.topReserved.map((row) => (
                  <tr key={`${row.productCode}-${row.warehouseCode}-${row.locationCode}-rsv`}>
                    <td className="font-mono">{row.productCode}</td>
                    <td>{row.warehouseCode}/{row.locationCode}</td>
                    <td className="text-right text-blue-600 font-medium">{formatQty(row.reservedQty)}</td>
                    <td className="text-right">{formatQty(row.availableQty)}</td>
                  </tr>
                ))}
                {metrics.topReserved.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-[var(--color-text-muted)] py-4">No reserved stock</td>
                  </tr>
                )}
              </tbody>
            </table>
          </TablePanel>
        </>
      )}
    </section>
  );
}
