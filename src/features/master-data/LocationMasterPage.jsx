import { useEffect, useState } from 'react';
import { DocumentToolbar } from '../../components/wms/operations/DocumentToolbar.jsx';
import { DataTable } from '../../components/wms/ui/DataTable.jsx';
import { PageHeader } from '../../components/wms/ui/PageHeader.jsx';
import { StatusBadge } from '../../components/wms/ui/StatusBadge.jsx';
import { getLocations } from '../../services/wms/masterDataService.js';

const columns = [
  { key: 'location_code', header: 'Code' },
  { key: 'location_name', header: 'Name' },
  { key: 'location_type', header: 'Type' },
  { key: 'barcode', header: 'Barcode' },
  { key: 'is_active', header: 'Status', render: (row) => <StatusBadge value={row.is_active} /> },
];

export default function LocationMasterPage() {
  const [state, setState] = useState({ data: [], loading: true, error: null });

  function loadLocations() {
    setState((current) => ({ ...current, loading: true, error: null }));
    getLocations().then(({ data, error }) => {
      setState({ data: data ?? [], loading: false, error });
    });
  }

  useEffect(() => {
    loadLocations();
  }, []);

  return (
    <section className="page-shell">
      <PageHeader title="Location Master" description="Read-only location master list from WMS tgd_locations." />
      <p className="sprint-status">Read-only: no location create, update, or deactivate write-back.</p>
      <DocumentToolbar title="Locations" onRefresh={loadLocations} />
      <DataTable
        columns={columns}
        data={state.data}
        loading={state.loading}
        error={state.error}
        emptyMessage="No locations found."
      />
    </section>
  );
}
