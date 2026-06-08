function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 min-h-6 text-sm font-medium text-slate-900">{value || '-'}</dd>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="border-t border-slate-200 pt-4">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function ProductForm({ product }) {
  if (!product) {
    return (
      <aside className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-500">
        Select a product to view details.
      </aside>
    );
  }

  return (
    <aside className="space-y-5 rounded-md border border-slate-200 bg-white p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-mono text-lg font-semibold text-slate-950">{product.productCode}</h2>
          {product.needWeight ? (
            <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
              Need weight
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-medium text-slate-700">{product.productName}</p>
      </div>

      <dl className="grid grid-cols-2 gap-4">
        <Field label="Room" value={product.roomCode} />
        <Field label="Status" value={product.status} />
        <Field label="Group" value={product.productGroup} />
        <Field label="Base UOM" value={product.baseUom || product.erpProduct?.uom} />
        <Field label="Min stock" value={product.minStock} />
        <Field label="Shelf life" value={product.shelfLifeDays ? `${product.shelfLifeDays} days` : null} />
      </dl>

      <Section title="ERP Source">
        {product.erpProduct ? (
          <dl className="grid gap-3">
            <Field label="ERP code" value={product.erpProduct.product_code} />
            <Field label="ERP name" value={product.erpProduct.product_name} />
            <Field label="ERP description" value={product.erpProduct.product_description} />
            <Field label="Source updated" value={product.erpProduct.source_updated_at} />
          </dl>
        ) : (
          <p className="text-sm text-slate-500">No ERP source linked.</p>
        )}
      </Section>

      <Section title="Aliases">
        {product.aliases.length > 0 ? (
          <div className="grid gap-2">
            {product.aliases.map((alias) => (
              <div key={alias.id} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
                <div className="font-mono font-semibold text-slate-950">{alias.alias_code}</div>
                <div className="text-slate-500">{alias.alias_name || alias.status || '-'}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No aliases.</p>
        )}
      </Section>

      <Section title="UOM Conversion">
        {product.uomConversions.length > 0 ? (
          <div className="grid gap-2">
            {product.uomConversions.map((conversion) => (
              <div
                key={conversion.id}
                className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                <span className="font-medium text-slate-900">
                  {conversion.from_uom} to {conversion.to_uom}
                </span>
                <span className="font-mono text-slate-600">{conversion.conversion_rate}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No UOM conversions.</p>
        )}
      </Section>
    </aside>
  );
}
