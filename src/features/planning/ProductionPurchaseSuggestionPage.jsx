import { useEffect, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import { getProductionPurchaseSuggestions } from '../../services/planning/productionPurchaseSuggestionService.js';

function fmt(v) {
  return Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function ProductionPurchaseSuggestionPage() {
  const [rows, setRows] = useState([]);
  const [source, setSource] = useState('seed');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProductionPurchaseSuggestions()
      .then(({ rows: data, source: src }) => {
        setRows(data);
        setSource(src);
      })
      .finally(() => setLoading(false));
  }, []);

  const prodCount = rows.filter((r) => r.suggestedProductionQty > 0).length;
  const poCount = rows.filter((r) => r.suggestedPurchaseQty > 0).length;

  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="Production / Purchase Suggestion"
        description="Suggestion-only planning from forecast, stock, and shortage. No PO or production order creation."
        actions={
          <>
            <Badge type="warning">Suggestion Only</Badge>
            <Badge type="neutral">Read-only</Badge>
          </>
        }
      />

      <Alert variant="warning">
        Suggestion only — do not create PO or production orders from this screen. No Express write-back, no stock posting.
        Based on forecast (local/Sales Forecast), inventory balance, and demand shortage where available.
      </Alert>

      {source === 'seed' ? (
        <Alert variant="info">Using seed/forecast sample data — configure Supabase for live stock and shortage views.</Alert>
      ) : null}

      {loading ? <Alert variant="info">Loading suggestions...</Alert> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="SKU Lines" value={rows.length} />
        <KpiCard label="Suggest Production" value={prodCount} />
        <KpiCard label="Suggest Purchase" value={poCount} />
      </div>

      <TablePanel title="Production / Purchase Suggestions">
        <table className="tgm-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th className="text-right">Forecast</th>
              <th className="text-right">Stock</th>
              <th className="text-right">Reserved</th>
              <th className="text-right">Shortage</th>
              <th className="text-right">Lead Time</th>
              <th className="text-right">Suggest Prod</th>
              <th className="text-right">Suggest PO</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.sku}>
                <td className="font-mono">{row.sku}</td>
                <td className="max-w-[160px] truncate">{row.productName}</td>
                <td className="text-right">{fmt(row.forecastQty)}</td>
                <td className="text-right">{fmt(row.currentStock)}</td>
                <td className="text-right text-blue-600">{fmt(row.reserved)}</td>
                <td className="text-right text-rose-600 font-medium">{fmt(row.shortage)}</td>
                <td className="text-right">{row.leadTime}d</td>
                <td className="text-right text-emerald-700 font-medium">{fmt(row.suggestedProductionQty) || '—'}</td>
                <td className="text-right text-indigo-700 font-medium">{fmt(row.suggestedPurchaseQty) || '—'}</td>
                <td className="text-sm text-[var(--color-text-muted)]">{row.reason}</td>
              </tr>
            ))}
            {rows.length === 0 && !loading ? (
              <tr>
                <td colSpan={10} className="py-6 text-center text-[var(--color-text-muted)]">No suggestions</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TablePanel>
    </section>
  );
}
