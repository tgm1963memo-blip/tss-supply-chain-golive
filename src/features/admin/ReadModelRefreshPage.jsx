import React from 'react';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import Alert from '../../components/scm-ui/Alert.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';

export default function ReadModelRefreshPage() {
  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="Read Model Refresh"
        description="Trigger materialized view refreshes and cache invalidations."
        actions={
          <>
            <Badge type="warning">GOVERNANCE REQUIRED</Badge>
            <Badge type="neutral">SAFE MODE</Badge>
          </>
        }
      />
      <Alert variant="warning">
        Manual refresh actions are restricted during Safe Mode to prevent performance spikes on the primary database.
      </Alert>
      <TablePanel>
        <div style={{ padding: '20px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
          Action blocked by governance. Refresh schedules are managed by CRON.
        </div>
      </TablePanel>
    </section>
  );
}
