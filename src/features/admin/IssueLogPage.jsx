import React from 'react';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';
import Badge from '../../components/scm-ui/Badge.jsx';
import Alert from '../../components/scm-ui/Alert.jsx';
import TablePanel from '../../components/scm-ui/TablePanel.jsx';

export default function IssueLogPage() {
  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title="UAT Issue Log"
        description="Centralized view of reported UAT issues and their resolution status."
        actions={
          <>
            <Badge type="neutral">READ ONLY</Badge>
          </>
        }
      />
      <Alert variant="info">
        For formal issue tracking, please update docs/18_THAI_UAT_ISSUE_LOG.md.
      </Alert>
      <TablePanel>
        <table className="tgm-table">
          <thead>
            <tr>
              <th>Issue ID</th>
              <th>Module</th>
              <th>Severity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>
                No active issues loaded from registry.
              </td>
            </tr>
          </tbody>
        </table>
      </TablePanel>
    </section>
  );
}
