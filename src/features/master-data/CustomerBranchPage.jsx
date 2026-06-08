import { useEffect, useState } from 'react';
import Alert from '../../components/scm-ui/Alert.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import { KpiCard } from '../../components/scm-ui/Card.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import {
  getCustomerBranchSummary,
  listCustomerBranches,
} from '../../services/master-data/customerBranchService.js';

export default function CustomerBranchPage() {
  const [branches, setBranches] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCustomerBranches()
      .then((data) => {
        setBranches(data);
        setSummary(getCustomerBranchSummary(data));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="Customer Branch"
        description="Customer branch master preview — read-only structure for delivery points and channels."
        actions={
          <>
            <Badge type="neutral">Read-only</Badge>
            <Badge type="warning">Master Preview</Badge>
          </>
        }
      />

      <Alert variant="info">
        Master preview only. No branch create/update. Customer names merge from Supabase when configured.
      </Alert>

      {loading ? <Alert variant="info">Loading branch data...</Alert> : null}

      {summary ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Branches" value={summary.total} />
          <KpiCard label="Active" value={summary.active} />
          <KpiCard label="Customers" value={summary.customers} />
          <KpiCard label="Channels" value={summary.channels} />
        </div>
      ) : null}

      <TablePanel title="Customer Branches">
        <table className="tgm-table">
          <thead>
            <tr>
              <th>Customer Code</th>
              <th>Customer Name</th>
              <th>Branch Code</th>
              <th>Branch Name</th>
              <th>Channel</th>
              <th>Province</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((row) => (
              <tr key={row.branchCode}>
                <td className="font-mono">{row.customerCode}</td>
                <td>{row.customerName}</td>
                <td className="font-mono text-xs">{row.branchCode}</td>
                <td>{row.branchName}</td>
                <td>{row.channel}</td>
                <td>{row.province}</td>
                <td>{row.status}</td>
              </tr>
            ))}
            {branches.length === 0 && !loading ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-[var(--color-text-muted)]">No branches</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TablePanel>
    </section>
  );
}
