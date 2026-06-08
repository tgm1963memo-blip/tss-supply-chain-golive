import { useEffect, useMemo, useState } from 'react';
import { getWarehouses } from '../../services/master-data/warehouseService.js';

function StatusBadge({ status }) {
  const isActive = status === 'active';

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
        isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {status || '-'}
    </span>
  );
}

export default function WarehouseMasterPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadWarehouses(nextSearch = submittedSearch) {
    setIsLoading(true);
    setError(null);

    try {
      const rows = await getWarehouses({ search: nextSearch });
      setWarehouses(rows);
      setSelectedWarehouse((current) => {
        if (!current) return rows[0] || null;
        return rows.find((row) => row.id === current.id) || rows[0] || null;
      });
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadWarehouses('');
  }, []);

  const stats = useMemo(
    () => ({
      total: warehouses.length,
      active: warehouses.filter((warehouse) => warehouse.status === 'active').length,
      rooms: new Set(warehouses.map((warehouse) => warehouse.roomCode).filter(Boolean)).size,
      locations: warehouses.reduce((sum, warehouse) => sum + warehouse.locations.length, 0),
    }),
    [warehouses],
  );

  function handleSearchSubmit(event) {
    event.preventDefault();
    const nextSearch = search.trim();
    setSubmittedSearch(nextSearch);
    loadWarehouses(nextSearch);
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Warehouse Master</h2>
          <p className="mt-1 text-sm text-slate-500">Rooms, warehouse codes, warehouse types, and storage locations.</p>
        </div>
        <button
          type="button"
          onClick={() => loadWarehouses(submittedSearch)}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search room, warehouse code, name, or type"
          className="min-h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-800"
        >
          Search
        </button>
      </form>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Warehouses</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{stats.total}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Active</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">{stats.active}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Rooms</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{stats.rooms}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Locations</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{stats.locations}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error.message || 'Unable to load warehouses.'}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Warehouse</th>
                  <th className="px-4 py-3">Room</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Locations</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Loading warehouses...
                    </td>
                  </tr>
                ) : null}

                {!isLoading && warehouses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No warehouses found.
                    </td>
                  </tr>
                ) : null}

                {!isLoading
                  ? warehouses.map((warehouse) => (
                      <tr
                        key={warehouse.id}
                        onClick={() => setSelectedWarehouse(warehouse)}
                        className={`cursor-pointer hover:bg-slate-50 ${
                          selectedWarehouse?.id === warehouse.id ? 'bg-brand-50/60' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-mono font-semibold text-slate-950">{warehouse.warehouseCode}</div>
                          <div className="text-slate-500">{warehouse.warehouseName || '-'}</div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">{warehouse.roomCode || '-'}</td>
                        <td className="whitespace-nowrap px-4 py-3">{warehouse.warehouseType || '-'}</td>
                        <td className="whitespace-nowrap px-4 py-3">{warehouse.locations.length}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge status={warehouse.status} />
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-md border border-slate-200 bg-white p-5">
          {selectedWarehouse ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Selected warehouse</p>
                <h3 className="mt-1 font-mono text-lg font-semibold text-slate-950">{selectedWarehouse.warehouseCode}</h3>
                <p className="text-sm text-slate-600">{selectedWarehouse.warehouseName || '-'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Room</p>
                  <p className="mt-1 text-slate-900">{selectedWarehouse.roomCode || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Type</p>
                  <p className="mt-1 text-slate-900">{selectedWarehouse.warehouseType || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Status</p>
                  <p className="mt-1 text-slate-900">{selectedWarehouse.status || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Locations</p>
                  <p className="mt-1 text-slate-900">{selectedWarehouse.locations.length}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Locations</p>
                <div className="mt-2 max-h-96 space-y-2 overflow-y-auto pr-1">
                  {selectedWarehouse.locations.length > 0 ? (
                    selectedWarehouse.locations.map((location) => (
                      <div key={location.id} className="rounded-md border border-slate-200 p-3 text-sm">
                        <div className="font-mono font-semibold text-slate-950">{location.location_code}</div>
                        <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-slate-500">
                          <span>Zone: {location.zone_code || '-'}</span>
                          <span>Type: {location.location_type || '-'}</span>
                          <span>Status: {location.status || '-'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No locations recorded.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select a warehouse to view details.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
