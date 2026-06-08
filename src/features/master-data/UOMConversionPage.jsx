import { useEffect, useMemo, useState } from 'react';
import {
  SUPPORTED_UOMS,
  deactivateUomConversion,
  getProductOptions,
  getUomConversions,
  upsertUomConversion,
} from '../../services/master-data/uomService.js';

const initialForm = {
  productId: '',
  fromUom: 'pack',
  toUom: 'sachet',
  conversionRate: '5',
};

function formatRate(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(Number(value || 0));
}

export default function UOMConversionPage() {
  const [conversions, setConversions] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  async function loadData(nextSearch = search) {
    setIsLoading(true);
    setError(null);

    try {
      const [conversionRows, productRows] = await Promise.all([
        getUomConversions({ search: nextSearch }),
        getProductOptions({ search: nextSearch }),
      ]);
      setConversions(conversionRows);
      setProducts(productRows);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData('');
  }, []);

  const activeConversions = useMemo(
    () => conversions.filter((conversion) => conversion.status === 'active').length,
    [conversions],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await upsertUomConversion(form);
      setForm((current) => ({ ...initialForm, productId: current.productId }));
      await loadData(search);
    } catch (err) {
      setError(err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate(conversionId) {
    setError(null);

    try {
      await deactivateUomConversion(conversionId);
      await loadData(search);
    } catch (err) {
      setError(err);
    }
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    loadData(search.trim());
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">UOM Conversion</h2>
          <p className="mt-1 text-sm text-slate-500">Maintain product-specific conversion rates.</p>
        </div>
        <button
          type="button"
          onClick={() => loadData(search)}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Conversions</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{conversions.length}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Active</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">{activeConversions}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Supported UOM</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{SUPPORTED_UOMS.join(', ')}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error.message || 'Unable to process UOM conversion.'}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-md border border-slate-200 bg-white p-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">Conversion Rule</h3>
            <p className="mt-1 text-xs text-slate-500">Example: 1 pack = 5 sachets.</p>
          </div>

          <label className="block">
            <span className="text-xs font-medium uppercase text-slate-500">Product</span>
            <select
              value={form.productId}
              onChange={(event) => setForm((current) => ({ ...current, productId: event.target.value }))}
              className="mt-1 min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
              required
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.product_code} - {product.product_name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium uppercase text-slate-500">From</span>
              <select
                value={form.fromUom}
                onChange={(event) => setForm((current) => ({ ...current, fromUom: event.target.value }))}
                className="mt-1 min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
              >
                {SUPPORTED_UOMS.map((uom) => (
                  <option key={uom} value={uom}>
                    {uom}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium uppercase text-slate-500">To</span>
              <select
                value={form.toUom}
                onChange={(event) => setForm((current) => ({ ...current, toUom: event.target.value }))}
                className="mt-1 min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
              >
                {SUPPORTED_UOMS.map((uom) => (
                  <option key={uom} value={uom}>
                    {uom}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-medium uppercase text-slate-500">Rate</span>
            <input
              type="number"
              min="0.000001"
              step="0.000001"
              value={form.conversionRate}
              onChange={(event) => setForm((current) => ({ ...current, conversionRate: event.target.value }))}
              className="mt-1 min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
              required
            />
          </label>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? 'Saving...' : 'Save Conversion'}
          </button>
        </form>

        <div className="space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product or UOM"
              className="min-h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="submit"
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Search
            </button>
          </form>

          <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Conversion</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        Loading conversions...
                      </td>
                    </tr>
                  ) : null}

                  {!isLoading && conversions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        No UOM conversions found.
                      </td>
                    </tr>
                  ) : null}

                  {!isLoading
                    ? conversions.map((conversion) => (
                        <tr key={conversion.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="font-mono font-semibold text-slate-950">{conversion.productCode}</div>
                            <div className="text-slate-500">{conversion.productName || '-'}</div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                            1 {conversion.fromUom} = {formatRate(conversion.conversionRate)} {conversion.toUom}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">{conversion.status}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <button
                              type="button"
                              onClick={() => handleDeactivate(conversion.id)}
                              disabled={conversion.status !== 'active'}
                              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                            >
                              Deactivate
                            </button>
                          </td>
                        </tr>
                      ))
                    : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
