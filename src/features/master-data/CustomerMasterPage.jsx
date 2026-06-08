import { useEffect, useMemo, useState } from 'react';
import { getCustomers } from '../../services/master-data/customerService.js';

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

export default function CustomerMasterPage() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadCustomers(nextSearch = submittedSearch) {
    setIsLoading(true);
    setError(null);

    try {
      const rows = await getCustomers({ search: nextSearch });
      setCustomers(rows);
      setSelectedCustomer((current) => {
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
    loadCustomers('');
  }, []);

  const stats = useMemo(
    () => ({
      total: customers.length,
      active: customers.filter((customer) => customer.status === 'active').length,
      erpLinked: customers.filter((customer) => customer.erpCustomer).length,
      aliases: customers.reduce((sum, customer) => sum + customer.aliases.length, 0),
    }),
    [customers],
  );

  function handleSearchSubmit(event) {
    event.preventDefault();
    const nextSearch = search.trim();
    setSubmittedSearch(nextSearch);
    loadCustomers(nextSearch);
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Customer Master</h2>
          <p className="mt-1 text-sm text-slate-500">Customer codes, groups, sales ownership, ERP source rows, and aliases.</p>
        </div>
        <button
          type="button"
          onClick={() => loadCustomers(submittedSearch)}
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
          placeholder="Search customer code, name, group, or sales code"
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
          <p className="text-xs font-medium uppercase text-slate-500">Customers</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{stats.total}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Active</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">{stats.active}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">ERP linked</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{stats.erpLinked}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Aliases</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{stats.aliases}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error.message || 'Unable to load customers.'}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Room</th>
                  <th className="px-4 py-3">Group</th>
                  <th className="px-4 py-3">Sales</th>
                  <th className="px-4 py-3">Aliases</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Loading customers...
                    </td>
                  </tr>
                ) : null}

                {!isLoading && customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No customers found.
                    </td>
                  </tr>
                ) : null}

                {!isLoading
                  ? customers.map((customer) => (
                      <tr
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer)}
                        className={`cursor-pointer hover:bg-slate-50 ${
                          selectedCustomer?.id === customer.id ? 'bg-brand-50/60' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-mono font-semibold text-slate-950">{customer.customerCode}</div>
                          <div className="text-slate-500">{customer.customerName || '-'}</div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">{customer.roomCode || '-'}</td>
                        <td className="whitespace-nowrap px-4 py-3">{customer.customerGroup || '-'}</td>
                        <td className="whitespace-nowrap px-4 py-3">{customer.salesCode || '-'}</td>
                        <td className="whitespace-nowrap px-4 py-3">{customer.aliases.length}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge status={customer.status} />
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-md border border-slate-200 bg-white p-5">
          {selectedCustomer ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Selected customer</p>
                <h3 className="mt-1 font-mono text-lg font-semibold text-slate-950">{selectedCustomer.customerCode}</h3>
                <p className="text-sm text-slate-600">{selectedCustomer.customerName || '-'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Room</p>
                  <p className="mt-1 text-slate-900">{selectedCustomer.roomCode || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Sales</p>
                  <p className="mt-1 text-slate-900">{selectedCustomer.salesCode || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Group</p>
                  <p className="mt-1 text-slate-900">{selectedCustomer.customerGroup || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">ERP source</p>
                  <p className="mt-1 text-slate-900">{selectedCustomer.erpCustomer ? 'Linked' : 'Not linked'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Aliases</p>
                <div className="mt-2 space-y-2">
                  {selectedCustomer.aliases.length > 0 ? (
                    selectedCustomer.aliases.map((alias) => (
                      <div key={alias.id} className="rounded-md border border-slate-200 p-3 text-sm">
                        <div className="font-mono font-semibold text-slate-950">{alias.alias_code}</div>
                        <div className="text-slate-500">{alias.alias_name || '-'}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No aliases recorded.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select a customer to view details.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
