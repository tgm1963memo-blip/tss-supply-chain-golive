import { useEffect, useState } from 'react';
import PageSubnav from '../../../components/scm-ui/PageSubnav.jsx';
import OperationsPreviewPage from '../../../components/scm-ui/OperationsPreviewPage.jsx';
import { DocumentFilterBar } from '../../../components/wms/operations/DocumentFilterBar.jsx';
import { DocumentToolbar } from '../../../components/wms/operations/DocumentToolbar.jsx';
import { DataTable } from '../../../components/wms/ui/DataTable.jsx';
import { PageHeader } from '../../../components/wms/ui/PageHeader.jsx';
import { StatusBadge } from '../../../components/wms/ui/StatusBadge.jsx';
import Badge from '../../../components/scm-ui/Badge.jsx';
import { getPickingDocuments } from '../../../services/wms/pickingService.js';
import { listPickListCandidates } from '../../../services/picking/pickListCandidateService.js';

const TABS = [
  { id: 'wms-picking', label: 'WMS Picking' },
  { id: 'so-pick-pack', label: 'SO Pick-Pack' },
  { id: 'confirm-pick', label: 'Confirm Pick Safe Mode' },
];

const wmsColumns = [
  { key: 'picking_no', header: 'Picking No' },
  { key: 'withdrawal_request_id', header: 'Withdrawal Request' },
  { key: 'warehouse_id', header: 'Warehouse' },
  { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
  { key: 'picking_method', header: 'Method' },
  { key: 'created_at', header: 'Created At' },
];

const candidateColumns = [
  { key: 'sourceDocumentNo', header: 'SO Document' },
  { key: 'customerCode', header: 'Customer' },
  { key: 'productCode', header: 'Product' },
  { key: 'requestedQty', header: 'Requested' },
  { key: 'reservedQty', header: 'Reserved' },
  { key: 'pickReadiness', header: 'Ready', render: (row) => <Badge type={row.pickReadiness ? 'success' : 'warning'}>{row.pickReadiness ? 'Ready' : 'Blocked'}</Badge> },
  { key: 'pickBlockReason', header: 'Block Reason' },
];

export default function PickingPackingPage() {
  const [activeTab, setActiveTab] = useState('wms-picking');
  const [wmsState, setWmsState] = useState({ data: [], loading: true, error: null });
  const [candidateState, setCandidateState] = useState({ data: [], loading: true, error: null });

  function loadWmsPicking() {
    setWmsState((current) => ({ ...current, loading: true, error: null }));
    getPickingDocuments().then(({ data, error }) => {
      setWmsState({ data: data ?? [], loading: false, error });
    });
  }

  function loadCandidates() {
    setCandidateState((current) => ({ ...current, loading: true, error: null }));
    listPickListCandidates({ roomCode: 'TSS' })
      .then((rows) => setCandidateState({ data: rows ?? [], loading: false, error: null }))
      .catch((err) => setCandidateState({ data: [], loading: false, error: err }));
  }

  useEffect(() => {
    if (activeTab === 'wms-picking') loadWmsPicking();
    if (activeTab === 'so-pick-pack') loadCandidates();
  }, [activeTab]);

  return (
    <section>
      <PageHeader
        title="Picking & Packing"
        description="Consolidated WMS picking, SO pick-pack candidates, and confirm-pick safe mode."
      />
      <p className="sprint-status">Safe mode: read-only lists. No pick confirmation or stock deduction.</p>
      <PageSubnav items={TABS} activeId={activeTab} onSelect={setActiveTab} />

      {activeTab === 'wms-picking' ? (
        <>
          <DocumentToolbar title="WMS Picking Documents" onRefresh={loadWmsPicking} />
          <DocumentFilterBar onChange={() => {}} />
          <DataTable columns={wmsColumns} data={wmsState.data} loading={wmsState.loading} error={wmsState.error} emptyMessage="No picking documents found." />
        </>
      ) : null}

      {activeTab === 'so-pick-pack' ? (
        <>
          <DocumentToolbar title="SO Pick-Pack Candidates" onRefresh={loadCandidates} />
          <DocumentFilterBar onChange={() => {}} />
          <DataTable
            columns={candidateColumns}
            data={candidateState.data}
            loading={candidateState.loading}
            error={candidateState.error?.message || candidateState.error}
            emptyMessage="No pick list candidates found."
          />
        </>
      ) : null}

      {activeTab === 'confirm-pick' ? (
        <OperationsPreviewPage previewKey="confirm-pick" backPath="/warehouse/wms/picking-packing" />
      ) : null}
    </section>
  );
}
