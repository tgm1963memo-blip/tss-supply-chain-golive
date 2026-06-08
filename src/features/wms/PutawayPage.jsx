import { useEffect, useState } from 'react';
import { DocumentFilterBar } from '../../components/wms/operations/DocumentFilterBar.jsx';
import { DocumentToolbar } from '../../components/wms/operations/DocumentToolbar.jsx';
import { DataTable } from '../../components/wms/ui/DataTable.jsx';
import { PageHeader } from '../../components/wms/ui/PageHeader.jsx';
import { StatusBadge } from '../../components/wms/ui/StatusBadge.jsx';
import { getPutawayDocuments } from '../../services/wms/putawayService.js';

const columns = [
  { key: 'putaway_no', header: 'Putaway No' },
  { key: 'source_id', header: 'Receiving Ref' },
  { key: 'warehouse_id', header: 'Warehouse' },
  { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
  { key: 'source_type', header: 'Type' },
  { key: 'created_at', header: 'Created At' },
];

export default function PutawayPage() {
  const [state, setState] = useState({ data: [], loading: true, error: null });

  function loadDocuments() {
    setState((current) => ({ ...current, loading: true, error: null }));
    getPutawayDocuments().then(({ data, error }) => {
      setState({ data: data ?? [], loading: false, error });
    });
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  return (
    <section className="page-shell">
      <PageHeader title="Putaway" description="Inbound putaway document list (read-only — no posting)." />
      <p className="sprint-status">Read-only: no putaway posting or location assignment write-back.</p>
      <DocumentToolbar title="Putaway Documents" onRefresh={loadDocuments} />
      <DocumentFilterBar onChange={() => {}} />
      <DataTable columns={columns} data={state.data} loading={state.loading} error={state.error} emptyMessage="No putaway documents found." />
    </section>
  );
}
