import React from 'react';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import Alert from '../../components/scm-ui/Alert.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';
import { getHumanUatStatus } from '../../services/system/uatStatusService.js';

export default function UATSignoffPage() {
  const uatStatus = getHumanUatStatus();

  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="UAT Sign-off Dashboard"
        description="Overview of current UAT progress, sign-offs, and readiness."
        actions={
          <>
            <Badge type="success">{uatStatus.statusLabel}</Badge>
            <Badge type="neutral">READ ONLY</Badge>
          </>
        }
      />
      <Alert variant="info">
        This page summarizes the progress based on documented markdown files in docs/.
      </Alert>
      <TablePanel>
        <div style={{ padding: '20px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
          Refer to docs/19_THAI_UAT_SIGNOFF_FORM.md for the official sign-off document.
        </div>
      </TablePanel>
    </section>
  );
}
