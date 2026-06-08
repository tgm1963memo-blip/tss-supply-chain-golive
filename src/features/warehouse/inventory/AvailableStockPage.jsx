import { useEffect, useState } from 'react';
import SupabaseEnvWarning from '../../../components/system/SupabaseEnvWarning.jsx';
import { DocumentFilterBar } from '../../../components/wms/operations/DocumentFilterBar.jsx';
import { DocumentToolbar } from '../../../components/wms/operations/DocumentToolbar.jsx';
import { DataTable } from '../../../components/wms/ui/DataTable.jsx';
import { PageHeader } from '../../../components/wms/ui/PageHeader.jsx';
import { StatusBadge } from '../../../components/wms/ui/StatusBadge.jsx';
import { getWithdrawalAllocations } from '../../../services/wms/withdrawalAllocationService.js';

const columns = [
  { key: 'allocation_no', header: 'Allocation No' },
  { key: 'withdrawal_request_id', header: 'Withdrawal Request' },
  { key: 'customer_id', header: 'Customer' },
  { key: 'warehouse_id', header: 'Warehouse' },
  { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
  { key: 'allocation_method', header: 'Method' },
  { key: 'created_at', header: 'Created At' },
];

export default function AvailableStockPage() {
  const [state, setState] = useState({ data: [], loading: true, error: null });

  function loadAllocations() {
    setState((current) => ({ ...current, loading: true, error: null }));
    getWithdrawalAllocations().then(({ data, error }) => {
      setState({ data: data ?? [], loading: false, error });
    });
  }

  useEffect(() => {
    loadAllocations();
  }, []);

  return (
    <section className="page-shell">
      <SupabaseEnvWarning />
      <PageHeader title="Available Stock" description="Withdrawal allocation list — reserved vs available stock visibility (read-only)." />
      <p className="sprint-status">READ ONLY — no allocation posting or stock write-back.</p>
      <DocumentToolbar title="Allocation Documents" onRefresh={loadAllocations} />
      <DocumentFilterBar onChange={() => {}} />
      <DataTable columns={columns} data={state.data} loading={state.loading} error={state.error} emptyMessage="No allocations found." />
    </section>
  );
}
