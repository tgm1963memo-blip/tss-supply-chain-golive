import { useState } from 'react';
import { KpiCard } from '../../../components/scm-ui/Card.jsx';
import TablePanel from '../../../components/scm-ui/TablePanel.jsx';
import { ExpressWeightPageLayout, StatusPill } from './components/ExpressWeightLayout.jsx';
import { listWeightSyncLogs } from '../../../services/expressWeight/expressWeightService.js';

export default function ExpressWeightSyncLogPage() {
  const [logs] = useState(() => listWeightSyncLogs());

  const successCount = logs.filter((l) => l.result === 'SUCCESS').length;
  const failedCount = logs.filter((l) => l.result === 'FAILED').length;
  const skippedCount = logs.filter((l) => l.result === 'SKIPPED').length;

  return (
    <ExpressWeightPageLayout
      title="Express Weight Sync Log"
      description="Historical sync log structure — read-only design preview. No live sync service connected."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Log Entries" value={logs.length} />
        <KpiCard label="Success (mock)" value={successCount} />
        <KpiCard label="Failed / Skipped" value={failedCount + skippedCount} />
      </div>

      <TablePanel title="Sync Log (Read-only)">
        <table className="tgm-table">
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Queue ID</th>
              <th>Action</th>
              <th>Result</th>
              <th>Message</th>
              <th>Synced At</th>
              <th>Service Name</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((row) => (
              <tr key={row.id}>
                <td className="font-mono text-xs">{row.id}</td>
                <td className="font-mono text-xs">{row.queueId}</td>
                <td>{row.action}</td>
                <td>
                  <StatusPill
                    status={
                      row.result === 'SUCCESS'
                        ? 'Synced'
                        : row.result === 'FAILED'
                          ? 'Failed'
                          : 'Queued'
                    }
                  />
                </td>
                <td className="max-w-[240px] text-sm">{row.message}</td>
                <td className="whitespace-nowrap text-xs">
                  {row.syncedAt ? new Date(row.syncedAt).toLocaleString('th-TH') : '—'}
                </td>
                <td className="text-xs text-[var(--color-text-muted)]">{row.serviceName}</td>
              </tr>
            ))}
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-[var(--color-text-muted)]">No sync log entries</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TablePanel>
    </ExpressWeightPageLayout>
  );
}
