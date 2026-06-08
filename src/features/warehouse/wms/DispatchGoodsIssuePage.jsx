import { useEffect, useState } from 'react';
import PageSubnav from '../../../components/scm-ui/PageSubnav.jsx';
import OperationsPreviewPage from '../../../components/scm-ui/OperationsPreviewPage.jsx';
import { DocumentFilterBar } from '../../../components/wms/operations/DocumentFilterBar.jsx';
import { DocumentToolbar } from '../../../components/wms/operations/DocumentToolbar.jsx';
import { DataTable } from '../../../components/wms/ui/DataTable.jsx';
import { PageHeader } from '../../../components/wms/ui/PageHeader.jsx';
import { StatusBadge } from '../../../components/wms/ui/StatusBadge.jsx';
import { getDispatchDocuments } from '../../../services/wms/dispatchService.js';
import { getOutboundDocumentDetail, listOutboundDocuments } from '../../../services/wms/outboundPickingService.js';

const TABS = [
  { id: 'dispatch', label: 'Dispatch' },
  { id: 'outbound', label: 'Outbound / Goods Issue' },
  { id: 'goods-issue-preview', label: 'Goods Issue Preview' },
];

const dispatchColumns = [
  { key: 'dispatch_no', header: 'Dispatch No' },
  { key: 'customer_id', header: 'Customer' },
  { key: 'warehouse_id', header: 'Warehouse' },
  { key: 'picking_document_id', header: 'Picking Ref' },
  { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
  { key: 'dispatch_date', header: 'Dispatch Date' },
];

export default function DispatchGoodsIssuePage() {
  const [activeTab, setActiveTab] = useState('dispatch');
  const [dispatchState, setDispatchState] = useState({ data: [], loading: true, error: null });
  const [outboundDocs, setOutboundDocs] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState(null);
  const [loadingOutbound, setLoadingOutbound] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [outboundError, setOutboundError] = useState('');

  function loadDispatch() {
    setDispatchState((current) => ({ ...current, loading: true, error: null }));
    getDispatchDocuments().then(({ data, error }) => {
      setDispatchState({ data: data ?? [], loading: false, error });
    });
  }

  async function loadOutbound() {
    setOutboundError('');
    setLoadingOutbound(true);
    try {
      const rows = await listOutboundDocuments();
      setOutboundDocs(rows ?? []);
      if (!selectedId && rows?.[0]?.id) setSelectedId(rows[0].id);
    } catch (err) {
      setOutboundError(err.message || String(err));
    } finally {
      setLoadingOutbound(false);
    }
  }

  useEffect(() => {
    if (activeTab === 'dispatch') loadDispatch();
    if (activeTab === 'outbound') loadOutbound();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'outbound' || !selectedId) {
      setDetail(null);
      return;
    }

    setLoadingDetail(true);
    getOutboundDocumentDetail(selectedId)
      .then((nextDetail) => setDetail(nextDetail))
      .catch((err) => setOutboundError(err.message || String(err)))
      .finally(() => setLoadingDetail(false));
  }, [activeTab, selectedId]);

  return (
    <section>
      <PageHeader
        title="Dispatch / Goods Issue"
        description="Consolidated dispatch documents, outbound list, and goods issue preview."
      />
      <p className="sprint-status">Safe mode: read-only. No dispatch posting or post outbound.</p>
      <PageSubnav items={TABS} activeId={activeTab} onSelect={setActiveTab} />

      {activeTab === 'dispatch' ? (
        <>
          <DocumentToolbar title="Dispatch Documents" onRefresh={loadDispatch} />
          <DocumentFilterBar onChange={() => {}} />
          <DataTable columns={dispatchColumns} data={dispatchState.data} loading={dispatchState.loading} error={dispatchState.error} emptyMessage="No dispatch documents found." />
        </>
      ) : null}

      {activeTab === 'outbound' ? (
        <div className="dashboard-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          <section className="section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Outbound Documents</h3>
              <button type="button" className="btn" onClick={loadOutbound}>Refresh</button>
            </div>
            {outboundError ? <p style={{ color: 'var(--tgd-danger)' }}>{outboundError}</p> : null}
            {loadingOutbound ? <p>Loading...</p> : null}
            {!loadingOutbound && outboundDocs.length === 0 ? <p>No outbound documents found.</p> : null}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {outboundDocs.map((doc) => (
                <li key={doc.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--tgd-border)' }}>
                  <button type="button" onClick={() => setSelectedId(doc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                    <strong>{doc.document_no}</strong> — {doc.status} — {doc.customer_id || '-'}
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section className="section-card">
            <h3 style={{ marginTop: 0 }}>Document Detail</h3>
            {loadingDetail ? <p>Loading detail...</p> : null}
            {!loadingDetail && !detail ? <p>Select a document to view detail.</p> : null}
            {!loadingDetail && detail ? (
              <div>
                <p><strong>{detail.document?.document_no}</strong> — <StatusBadge value={detail.document?.status} /></p>
                <p>Customer: {detail.document?.customer_id || '-'}</p>
                <p>Lines: {detail.lines.length} | Reservations: {detail.reservations.length}</p>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {activeTab === 'goods-issue-preview' ? (
        <OperationsPreviewPage previewKey="goods-issue" backPath="/warehouse/wms/dispatch-goods-issue" />
      ) : null}
    </section>
  );
}
