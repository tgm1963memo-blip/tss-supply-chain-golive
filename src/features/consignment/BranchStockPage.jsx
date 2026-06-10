import { useEffect, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import { getBranchStockPageData } from '../../services/consignment/branchStockService.js';

function fmt(v) {
  return Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function statusBadge(status) {
  if (status === 'low') return <Badge type="danger">Low Stock</Badge>;
  if (status === 'empty') return <Badge type="neutral">Empty</Badge>;
  return <Badge type="success">Normal</Badge>;
}

export default function BranchStockPage() {
  const [branchCode, setBranchCode] = useState('');
  const [search, setSearch] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  function load(nextBranch = branchCode, nextSearch = search) {
    setLoading(true);
    getBranchStockPageData({ branchCode: nextBranch || undefined, search: nextSearch || undefined })
      .then(setData)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load('', '');
  }, []);

  function handleFilterSubmit(event) {
    event.preventDefault();
    load(branchCode, search);
  }

  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="Consignment Branch Stock"
        description="Branch inventory from sc_web_consi_branch_stock_view / Express SO lines."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
          </>
        }
      />

      <Alert variant="warning">
        Branch stock is read-only. Adjustments, transfers, and Express write-back remain BLOCKED_BY_GOVERNANCE.
      </Alert>

      {data?.source === 'seed' ? (
        <Alert variant="info">Using seed branch stock — sync CONSI SO data for live sc_web_consi_branch_stock_view.</Alert>
      ) : null}
      {data?.source === 'empty' ? (
        <Alert variant="info">No branch stock in Supabase — showing empty table safely.</Alert>
      ) : null}

      {data?.summary ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="Active Branches" value={data.summary.branchCount} />
          <KpiCard label="SKU Lines" value={data.summary.skuLines} />
          <KpiCard label="Low Stock Lines" value={data.summary.lowStockLines} />
          <KpiCard label="Est. Value" value={`฿${fmt(data.summary.estimatedValue)}`} />
        </div>
      ) : null}

      <TablePanel title="Branch Inventory">
        <form onSubmit={handleFilterSubmit} className="mb-4 flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-4">
          <select
            className="tgm-input text-sm"
            value={branchCode}
            onChange={(e) => setBranchCode(e.target.value)}
          >
            <option value="">All Branches</option>
            {(data?.branches || []).map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <input
            type="search"
            className="tgm-input w-64 text-sm"
            placeholder="Search SKU / branch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">Filter</button>
        </form>

        {loading ? <Alert variant="info">Loading branch stock...</Alert> : null}

        <div className="overflow-x-auto">
          <table className="tgm-table whitespace-nowrap min-w-max">
            <thead>
              <tr>
                <th>Branch</th>
                <th>SKU</th>
                <th>Product Name</th>
                <th className="text-right">Balance Qty</th>
                <th className="text-right">Min Qty</th>
                <th className="text-right">Max Qty</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.rows || []).map((row) => (
                <tr key={`${row.branchCode}-${row.productCode}`}>
                  <td>{row.branchName || row.branchCode}</td>
                  <td className="font-mono text-brand-600">{row.productCode}</td>
                  <td>{row.productName}</td>
                  <td className="text-right font-semibold">{fmt(row.balanceQty)}</td>
                  <td className="text-right text-[var(--color-text-muted)]">{fmt(row.minQty)}</td>
                  <td className="text-right text-[var(--color-text-muted)]">{fmt(row.maxQty)}</td>
                  <td>{statusBadge(row.status)}</td>
                </tr>
              ))}
              {!loading && !(data?.rows?.length) ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--color-text-muted)]">No branch stock rows.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </TablePanel>
    </section>
  );
}
