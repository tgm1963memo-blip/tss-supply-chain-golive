import { useState, useEffect } from 'react';
import SupabaseEnvWarning from '../../components/system/SupabaseEnvWarning.jsx';
import { listStockBalances } from '../../services/warehouse/stockBalanceService.js';

export default function StockBalancePage() {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    roomCode: '',
    productCode: '',
    warehouseCode: '',
    locationCode: '',
    onlyAvailable: false,
    onlyShortStock: false,
  });

  async function fetchBalances() {
    setLoading(true);
    try {
      const data = await listStockBalances(filters);
      setBalances(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBalances();
  }, []);

  function handleFilterChange(e) {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    if (name === 'onlyAvailable' && val) {
      setFilters((prev) => ({ ...prev, onlyAvailable: true, onlyShortStock: false }));
    } else if (name === 'onlyShortStock' && val) {
      setFilters((prev) => ({ ...prev, onlyShortStock: true, onlyAvailable: false }));
    } else {
      setFilters((prev) => ({ ...prev, [name]: val }));
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    fetchBalances();
  }

  return (
    <div className="space-y-6">
      <SupabaseEnvWarning />
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock Balance</h1>
          <p className="mt-1 text-sm text-slate-500">
            Read-only visibility into combined ERP + Ledger + Reservations.
          </p>
        </div>
      </header>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              <span>Room</span>
              <input
                type="text"
                name="roomCode"
                value={filters.roomCode}
                onChange={handleFilterChange}
                className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              <span>Product</span>
              <input
                type="text"
                name="productCode"
                value={filters.productCode}
                onChange={handleFilterChange}
                className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              <span>Warehouse</span>
              <input
                type="text"
                name="warehouseCode"
                value={filters.warehouseCode}
                onChange={handleFilterChange}
                className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              <span>Location</span>
              <input
                type="text"
                name="locationCode"
                value={filters.locationCode}
                onChange={handleFilterChange}
                className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>

            <div className="flex items-center gap-4 py-2">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="onlyAvailable"
                  checked={filters.onlyAvailable}
                  onChange={handleFilterChange}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Available &gt; 0
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="onlyShortStock"
                  checked={filters.onlyShortStock}
                  onChange={handleFilterChange}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Short/Zero
              </label>
            </div>

            <div className="lg:col-span-5 flex justify-end">
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
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">WH/Loc</th>
                <th className="px-4 py-3">Lot</th>
                <th className="px-4 py-3 text-right">ERP On-Hand</th>
                <th className="px-4 py-3 text-right">Ledger Delta</th>
                <th className="px-4 py-3 text-right">Calc On-Hand</th>
                <th className="px-4 py-3 text-right">Reserved</th>
                <th className="px-4 py-3 text-right text-brand-600">Available</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {balances.map((b, i) => {
                const isShort = b.availableQty <= 0;
                const isReserved = b.reservedQty > 0;

                return (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="whitespace-nowrap px-4 py-3">{b.roomCode}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {b.productCode}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {b.warehouseCode}{b.locationCode ? ` / ${b.locationCode}` : ''}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{b.lotNo || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-slate-400">{b.erpOnHandQty}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-slate-400">{b.ledgerDeltaQty > 0 ? `+${b.ledgerDeltaQty}` : b.ledgerDeltaQty}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium">{b.calculatedOnHandQty}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-amber-600">{b.reservedQty > 0 ? b.reservedQty : '-'}</td>
                    <td className={`whitespace-nowrap px-4 py-3 text-right font-bold ${isShort ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {b.availableQty}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        {!isShort && (
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            Available
                          </span>
                        )}
                        {isReserved && (
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                            Reserved
                          </span>
                        )}
                        {isShort && b.availableQty === 0 && (
                          <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20">
                            Zero Stock
                          </span>
                        )}
                        {isShort && b.availableQty < 0 && (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-800 ring-1 ring-inset ring-red-600/20">
                            Negative / Review
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {balances.length === 0 && !loading && (
                <tr>
                  <td colSpan="10" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No stock balances found matching the filters.
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
