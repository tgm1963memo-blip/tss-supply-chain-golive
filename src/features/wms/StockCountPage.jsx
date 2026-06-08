import { useEffect, useState } from 'react';
import { DocumentFilterBar } from '../../components/wms/operations/DocumentFilterBar.jsx';
import { DocumentToolbar } from '../../components/wms/operations/DocumentToolbar.jsx';
import { DataTable } from '../../components/wms/ui/DataTable.jsx';
import { PageHeader } from '../../components/wms/ui/PageHeader.jsx';
import { StatusBadge } from '../../components/wms/ui/StatusBadge.jsx';
import { getStockCountDocuments } from '../../services/wms/stockCountService.js';

const columns = [
  { key: 'stock_count_no', header: 'Stock Count No' },
  { key: 'warehouse_id', header: 'Warehouse' },
  { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
  { key: 'count_type', header: 'Count Type' },
  { key: 'count_date', header: 'Count Date' },
  { key: 'created_at', header: 'Created At' },
];

export default function StockCountPage() {
  const [state, setState] = useState({ data: [], loading: true, error: null });

  function loadDocuments() {
    setState((current) => ({ ...current, loading: true, error: null }));
    getStockCountDocuments().then(({ data, error }) => {
      setState({ data: data ?? [], loading: false, error });
    });
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  return (
    <section className="page-shell">
      <PageHeader title="Stock Count" description="Stock count document list (read-only — no posting or variance reconciliation)." />
      <p className="sprint-status">Read-only: no cycle count posting or adjustment write-back.</p>
      <DocumentToolbar title="Stock Count Documents" onRefresh={loadDocuments} />
      <DocumentFilterBar onChange={() => {}} />
      <DataTable columns={columns} data={state.data} loading={state.loading} error={state.error} emptyMessage="No stock count documents found." />
    </section>
  );
}
