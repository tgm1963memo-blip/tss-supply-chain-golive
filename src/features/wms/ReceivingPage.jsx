import { useEffect, useState } from 'react';
import { DocumentFilterBar } from '../../components/wms/operations/DocumentFilterBar.jsx';
import { DocumentToolbar } from '../../components/wms/operations/DocumentToolbar.jsx';
import { DataTable } from '../../components/wms/ui/DataTable.jsx';
import { PageHeader } from '../../components/wms/ui/PageHeader.jsx';
import { StatusBadge } from '../../components/wms/ui/StatusBadge.jsx';
import { getReceivingDocuments } from '../../services/wms/receivingService.js';

const columns = [
  { key: 'receiving_no', header: 'Receiving No' },
  { key: 'customer_id', header: 'Customer' },
  { key: 'warehouse_id', header: 'Warehouse' },
  { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
  { key: 'receiving_type', header: 'Type' },
  { key: 'expected_receive_date', header: 'Date' },
  { key: 'created_at', header: 'Created At' },
];

export default function ReceivingPage() {
  const [state, setState] = useState({ data: [], loading: true, error: null });

  function loadDocuments() {
    setState((current) => ({ ...current, loading: true, error: null }));
    getReceivingDocuments().then(({ data, error }) => {
      setState({ data: data ?? [], loading: false, error });
    });
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  return (
    <section className="page-shell">
      <PageHeader title="Receiving" description="Inbound receiving document list (read-only — no confirm/post)." />
      <p className="sprint-status">Read-only: no receiving confirm, post, or stock movement write-back.</p>
      <DocumentToolbar title="Receiving Documents" onRefresh={loadDocuments} />
      <DocumentFilterBar onChange={() => {}} />
      <DataTable columns={columns} data={state.data} loading={state.loading} error={state.error} emptyMessage="No receiving documents found." />
    </section>
  );
}
