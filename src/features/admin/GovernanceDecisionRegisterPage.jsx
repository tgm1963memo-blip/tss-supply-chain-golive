import React from 'react';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import Alert from '../../components/scm-ui/Alert.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';

export default function GovernanceDecisionRegisterPage() {
  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="Governance Decision Register"
        description="Registry of approved governance decisions regarding write-backs and safe mode exceptions."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
          </>
        }
      />
      <Alert variant="warning">
        Decisions logged here affect system constraints. Write access requires elevated admin privileges.
      </Alert>
      <TablePanel>
        <div style={{ padding: '20px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
          Please refer to docs/14_GOLIVE_DECISION_REGISTER.md for the master log of phase 3 decisions.
        </div>
      </TablePanel>
    </section>
  );
}
