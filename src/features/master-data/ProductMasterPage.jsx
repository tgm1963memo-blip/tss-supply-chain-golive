import { useEffect, useMemo, useState } from 'react';
import ProductForm from '../../components/master-data/ProductForm.jsx';
import ProductTable from '../../components/master-data/ProductTable.jsx';
import SupabaseEnvWarning from '../../components/system/SupabaseEnvWarning.jsx';
import { getProducts } from '../../services/master-data/productService.js';

export default function ProductMasterPage() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadProducts(nextSearch = submittedSearch) {
    setIsLoading(true);
    setError(null);

    try {
      const rows = await getProducts({ search: nextSearch });
      setProducts(rows);
      setSelectedProduct((current) => {
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
    loadProducts('');
  }, []);

  const productStats = useMemo(
    () => ({
      total: products.length,
      needWeight: products.filter((product) => product.needWeight).length,
      erpLinked: products.filter((product) => product.erpProduct).length,
    }),
    [products],
  );

  function handleSearchSubmit(event) {
    event.preventDefault();
    const nextSearch = search.trim();
    setSubmittedSearch(nextSearch);
    loadProducts(nextSearch);
  }

  return (
    <section className="space-y-5">
      <SupabaseEnvWarning />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Product Master</h2>
          <p className="mt-1 text-sm text-slate-500">SKU master data linked to Express ERP source rows.</p>
        </div>
        <button
          type="button"
          onClick={() => loadProducts(submittedSearch)}
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
          placeholder="Search product code or name"
          className="min-h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-800"
        >
          Search
        </button>
      </form>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Products</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{productStats.total}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">ERP linked</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{productStats.erpLinked}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Need weight</p>
          <p className="mt-2 text-2xl font-semibold text-amber-700">{productStats.needWeight}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error.message || 'Unable to load products.'}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          {isLoading ? (
            <div className="rounded-md border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Loading products...
            </div>
          ) : (
            <ProductTable
              products={products}
              selectedProductId={selectedProduct?.id}
              onSelectProduct={setSelectedProduct}
            />
          )}
        </div>
        <ProductForm product={selectedProduct} />
      </div>
    </section>
  );
}
