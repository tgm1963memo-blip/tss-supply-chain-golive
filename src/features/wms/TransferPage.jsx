import { useEffect, useState } from 'react';
import { DocumentFilterBar } from '../../components/wms/operations/DocumentFilterBar.jsx';
import { DocumentToolbar } from '../../components/wms/operations/DocumentToolbar.jsx';
import { DataTable } from '../../components/wms/ui/DataTable.jsx';
import { PageHeader } from '../../components/wms/ui/PageHeader.jsx';
import { StatusBadge } from '../../components/wms/ui/StatusBadge.jsx';
import { getTransferDocuments } from '../../services/wms/transferService.js';

const columns = [
  { key: 'transfer_no', header: 'Transfer No' },
  { key: 'from_warehouse_id', header: 'From Warehouse' },
  { key: 'to_warehouse_id', header: 'To Warehouse' },
  { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
  { key: 'transfer_type', header: 'Type' },
  { key: 'created_at', header: 'Created At' },
];

export default function TransferPage() {
  const [state, setState] = useState({ data: [], loading: true, error: null });

  function loadDocuments() {
    setState((current) => ({ ...current, loading: true, error: null }));
    getTransferDocuments().then(({ data, error }) => {
      setState({ data: data ?? [], loading: false, error });
    });
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  return (
    <section className="page-shell">
      <PageHeader title="Internal Transfer" description="Warehouse transfer document list (read-only — no posting)." />
      <p className="sprint-status">Read-only: no transfer posting or stock movement write-back.</p>
      <DocumentToolbar title="Transfer Documents" onRefresh={loadDocuments} />
      <DocumentFilterBar onChange={() => {}} />
      <DataTable columns={columns} data={state.data} loading={state.loading} error={state.error} emptyMessage="No transfer documents found." />
    </section>
  );
}
