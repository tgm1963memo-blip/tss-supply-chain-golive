function StatusBadge({ status }) {
  const isActive = status === 'active';

  return (
    <span
      className={[
        'inline-flex rounded-md px-2 py-1 text-xs font-medium ring-1',
        isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-slate-50 text-slate-600 ring-slate-100',
      ].join(' ')}
    >
      {status || '-'}
    </span>
  );
}

export default function ProductTable({ products, selectedProductId, onSelectProduct }) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Product code</th>
              <th className="px-4 py-3">Product name</th>
              <th className="px-4 py-3">Group</th>
              <th className="px-4 py-3">UOM</th>
              <th className="px-4 py-3">Weight</th>
              <th className="px-4 py-3">Aliases</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No products found.
                </td>
              </tr>
            ) : null}

            {products.map((product) => {
              const isSelected = selectedProductId === product.id;

              return (
                <tr
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className={[
                    'cursor-pointer hover:bg-slate-50',
                    isSelected ? 'bg-brand-50/70 outline outline-1 -outline-offset-1 outline-brand-100' : '',
                  ].join(' ')}
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-slate-950">
                    {product.productCode}
                  </td>
                  <td className="min-w-64 px-4 py-3 font-medium text-slate-900">{product.productName}</td>
                  <td className="whitespace-nowrap px-4 py-3">{product.productGroup || '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3">{product.baseUom || product.erpProduct?.uom || '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3">{product.needWeight ? 'Need weight' : '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3">{product.aliases.length}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge status={product.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
