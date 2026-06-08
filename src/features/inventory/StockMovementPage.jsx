import { useState, useEffect } from 'react';
import SupabaseEnvWarning from '../../components/system/SupabaseEnvWarning.jsx';
import { listStockMovements } from '../../services/warehouse/stockMovementService.js';

export default function StockMovementPage() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    roomCode: '',
    productCode: '',
    warehouseCode: '',
    locationCode: '',
    movementType: '',
    documentNo: '',
  });

  async function fetchMovements() {
    setLoading(true);
    try {
      const data = await listStockMovements(filters);
      setMovements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMovements();
  }, []);

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  function handleSearch(e) {
    e.preventDefault();
    fetchMovements();
  }

  return (
    <div className="space-y-6">
      <SupabaseEnvWarning />
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock Movement</h1>
          <p className="mt-1 text-sm text-slate-500">
            Read-only visibility into the inventory ledger.
          </p>
        </div>
      </header>

      <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Read-only movement visibility. This page does not post ledger or change stock.
            </h3>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-8">
            <input
              type="text"
              name="roomCode"
              placeholder="Room"
              value={filters.roomCode}
              onChange={handleFilterChange}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <input
              type="text"
              name="productCode"
              placeholder="Product"
              value={filters.productCode}
              onChange={handleFilterChange}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <input
              type="text"
              name="warehouseCode"
              placeholder="Warehouse"
              value={filters.warehouseCode}
              onChange={handleFilterChange}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <input
              type="text"
              name="locationCode"
              placeholder="Location"
              value={filters.locationCode}
              onChange={handleFilterChange}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <input
              type="text"
              name="movementType"
              placeholder="Movement Type"
              value={filters.movementType}
              onChange={handleFilterChange}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <input
              type="text"
              name="documentNo"
              placeholder="Document No"
              value={filters.documentNo}
              onChange={handleFilterChange}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <input
              type="date"
              name="startDate"
              value={filters.startDate || ''}
              onChange={handleFilterChange}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <input
              type="date"
              name="endDate"
              value={filters.endDate || ''}
              onChange={handleFilterChange}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <div className="lg:col-span-8 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
            <thead className="bg-slate-50 text-xs uppercase text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Doc No</th>
                <th className="px-4 py-3">Doc Type</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">WH/Loc</th>
                <th className="px-4 py-3">Lot</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3">UOM</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="whitespace-nowrap px-4 py-3">
                    {new Date(m.createdAt).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{m.roomCode}</td>
                  <td className="whitespace-nowrap px-4 py-3">{m.documentNo}</td>
                  <td className="whitespace-nowrap px-4 py-3">{m.documentType}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                      {m.movementType}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {m.productCode}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {m.warehouseCode}{m.locationCode ? ` / ${m.locationCode}` : ''}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{m.lotNo || '-'}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${m.qty > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {m.qty > 0 ? '+' : ''}{m.qty}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{m.uom || '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
              {movements.length === 0 && !loading && (
                <tr>
                  <td colSpan="11" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No movements found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
