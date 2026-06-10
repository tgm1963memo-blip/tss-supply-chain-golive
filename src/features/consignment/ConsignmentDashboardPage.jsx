import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import { defaultMonthRange } from '../../constants/consignmentLegacy.js';
import { getConsignmentDashboardData } from '../../services/consignment/consignmentService.js';

function fmt(v) {
  return Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function ConsignmentDashboardPage() {
  const defaults = defaultMonthRange();
  const [startYm, setStartYm] = useState(defaults.start);
  const [endYm, setEndYm] = useState(defaults.end);
  const [customerCode, setCustomerCode] = useState('');
  const [productCode, setProductCode] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  function load() {
    setLoading(true);
    getConsignmentDashboardData({ startYm, endYm, customerCode, productCode, branchCode })
      .then(setData)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [startYm, endYm, customerCode, productCode, branchCode]);

  function toggleCustomer(code) {
    setExpanded((current) => ({ ...current, [code]: !current[code] }));
  }

  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="ฝากขาย CONSI"
        description="Legacy pgConsignment — consignment sales summary by customer, branch, and SKU."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
            <Badge type="warning">SAFE MODE</Badge>
            <button type="button" className="btn btn-secondary" onClick={load}>Reload</button>
          </>
        }
      />

      <Alert variant="warning">
        CONSI dashboard is read-only from Express sync. SO posting, stock moves, CN, and settlement remain BLOCKED_BY_GOVERNANCE.
      </Alert>

      {data?.source === 'seed' ? (
        <Alert variant="info">Using seed CONSI data — configure Supabase for sc_web_consi_sales_summary_view.</Alert>
      ) : null}

      <form
        className="grid gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] md:grid-cols-3 lg:grid-cols-5"
        onSubmit={(e) => { e.preventDefault(); load(); }}
      >
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">From month</span>
          <input type="month" className="tgm-input w-full" value={startYm} onChange={(e) => setStartYm(e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">To month</span>
          <input type="month" className="tgm-input w-full" value={endYm} onChange={(e) => setEndYm(e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Customer</span>
          <select className="tgm-input w-full" value={customerCode} onChange={(e) => setCustomerCode(e.target.value)}>
            <option value="">All customers</option>
            {(data?.options?.customers || []).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-muted)]">Product</span>
          <select className="tgm-input w-full" value={productCode} onChange={(e) => setProductCode(e.target.value)}>
            <option value="">All products</option>
            {(data?.options?.products || []).map(([code, name]) => (
              <option key={code} value={code}>{code} — {name}</option>
            ))}
          </select>
        </label>
        {(data?.options?.branches?.length || 0) > 1 ? (
          <label className="space-y-1 text-sm">
            <span className="text-[var(--color-text-muted)]">Branch</span>
            <select className="tgm-input w-full" value={branchCode} onChange={(e) => setBranchCode(e.target.value)}>
              <option value="">All branches</option>
              {data.options.branches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </label>
        ) : null}
      </form>

      {loading ? <Alert variant="info">Loading CONSI data...</Alert> : null}

      {data?.summary ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="CONSI Qty (kg)" value={fmt(data.summary.totalQty)} />
          <KpiCard label="Total Value" value={data.summary.totalAmount ? `฿${fmt(data.summary.totalAmount)}` : '—'} />
          <KpiCard label="Products" value={data.summary.productCount} />
          <KpiCard label="Customers" value={data.summary.customerCount} />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(data?.links || []).map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] transition hover:border-brand-400"
          >
            <div className="text-2xl">{link.icon}</div>
            <div className="mt-2 font-medium">{link.label}</div>
          </Link>
        ))}
      </div>

      <TablePanel title={`CONSI Sales Detail (${data?.summary?.rowCount || 0} rows)`}>
        <div className="overflow-x-auto">
          <table className="tgm-table whitespace-nowrap min-w-max">
            <thead>
              <tr>
                <th>Customer / Product</th>
                <th className="text-right">Qty (kg)</th>
                <th className="text-right">Amount (฿)</th>
              </tr>
            </thead>
            <tbody>
              {(data?.grouped || []).map((group) => (
                <Fragment key={group.customerCode}>
                  <tr
                    className="cursor-pointer bg-[var(--color-surface-muted)]"
                    onClick={() => toggleCustomer(group.customerCode)}
                  >
                    <td>
                      <strong>{group.customerName}</strong>
                      {group.branchCode ? <Badge type="neutral">{group.branchCode}</Badge> : null}
                    </td>
                    <td className="text-right font-semibold">{fmt(group.qty)}</td>
                    <td className="text-right">{group.amount ? fmt(group.amount) : '—'}</td>
                  </tr>
                  {expanded[group.customerCode]
                    ? group.products.map((p) => (
                      <tr key={`${group.customerCode}-${p.productCode}`}>
                        <td className="pl-8 font-mono text-sm">{p.productCode} — {p.productName}</td>
                        <td className="text-right text-sm">{fmt(p.qty)}</td>
                        <td className="text-right text-sm">{p.amount ? fmt(p.amount) : '—'}</td>
                      </tr>
                    ))
                    : null}
                </Fragment>
              ))}
              {!loading && !(data?.grouped?.length) ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-[var(--color-text-muted)]">
                    No CONSI data in this period — adjust filters or sync Express SO data.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </TablePanel>
    </section>
  );
}
