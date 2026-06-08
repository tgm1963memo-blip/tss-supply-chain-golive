import { useEffect, useState } from 'react';
import { HandheldScanHub } from '../../../components/wms/handheld/HandheldScanHub.jsx';
import { DataTable } from '../../../components/wms/ui/DataTable.jsx';
import { PageHeader } from '../../../components/wms/ui/PageHeader.jsx';
import { StatusBadge } from '../../../components/wms/ui/StatusBadge.jsx';
import { getHandheldReceivingSessions } from '../../../services/wms/handheldReceivingService.js';
import { getHandheldPutawaySessions } from '../../../services/wms/handheldPutawayService.js';
import PageSubnav from '../../../components/scm-ui/PageSubnav.jsx';

const MODES = [
  { id: 'receiving', label: 'Handheld Receiving' },
  { id: 'putaway', label: 'Handheld Putaway' },
  { id: 'scan', label: 'Scan Hub' },
];

const sessionColumns = [
  { key: 'session_no', header: 'Session No' },
  { key: 'warehouse_id', header: 'Warehouse' },
  { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
  { key: 'device_id', header: 'Device' },
  { key: 'operator_id', header: 'Operator' },
  { key: 'created_at', header: 'Created At' },
];

export default function HandheldOperationsPage() {
  const [mode, setMode] = useState('receiving');
  const [state, setState] = useState({ data: [], loading: true, error: null });

  function loadSessions() {
    if (mode === 'scan') return;

    setState((current) => ({ ...current, loading: true, error: null }));
    const loader = mode === 'receiving' ? getHandheldReceivingSessions : getHandheldPutawaySessions;
    loader().then(({ data, error }) => {
      setState({ data: data ?? [], loading: false, error });
    });
  }

  useEffect(() => {
    loadSessions();
  }, [mode]);

  if (mode === 'scan') {
    return (
      <section>
        <PageSubnav items={MODES} activeId={mode} onSelect={setMode} />
        <HandheldScanHub title="Handheld Operations" description="Mobile scan workflow for receiving and putaway." />
      </section>
    );
  }

  return (
    <section className="page-shell">
      <PageSubnav items={MODES} activeId={mode} onSelect={setMode} />
      <PageHeader
        title="Handheld Operations"
        description={`${mode === 'receiving' ? 'Receiving' : 'Putaway'} session list (read-only — no scan write-back).`}
      />
      <p className="sprint-status">Safe mode: session list read-only. Scan actions disabled.</p>
      <DataTable
        columns={sessionColumns}
        data={state.data}
        loading={state.loading}
        error={state.error}
        emptyMessage={`No handheld ${mode} sessions found.`}
      />
      <div style={{ marginTop: 24 }}>
        <HandheldScanHub title="Quick Scan" description="Embedded scan hub for handheld workflow preview." />
      </div>
    </section>
  );
}
