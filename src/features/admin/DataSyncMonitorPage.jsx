import React from 'react';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import Alert from '../../components/scm-ui/Alert.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';

export default function DataSyncMonitorPage() {
  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="Data Sync Monitor"
        description="Monitor general data replication jobs and background workers."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
          </>
        }
      />
      <Alert variant="info">
        Displaying background job queues and sync status. No manual trigger actions enabled.
      </Alert>
      <TablePanel>
        <div style={{ padding: '20px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
          No active sync jobs found or background monitor is offline.
        </div>
      </TablePanel>
    </section>
  );
}
