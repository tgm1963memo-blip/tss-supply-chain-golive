import { useState } from 'react';
import { KpiCard } from '../../../components/scm-ui/Card.jsx';
import PageSubnav from '../../../components/scm-ui/PageSubnav.jsx';
import TablePanel from '../../../components/scm-ui/TablePanel.jsx';
import {
  ExpressWeightPageLayout,
  StatusPill,
} from './components/ExpressWeightLayout.jsx';
import {
  getExpressWeightSummary,
  listWeightQueue,
} from '../../../services/expressWeight/expressWeightService.js';

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'Pending', label: 'Pending' },
  { id: 'Approved', label: 'Approved' },
  { id: 'Queued', label: 'Queued' },
  { id: 'Synced', label: 'Synced' },
  { id: 'Failed', label: 'Failed' },
];

function formatWeight(v) {
  return Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function ExpressWeightQueuePage() {
  const [activeTab, setActiveTab] = useState('all');
  const [queue] = useState(() => listWeightQueue());
  const summary = getExpressWeightSummary();

  const filtered =
    activeTab === 'all' ? queue : queue.filter((q) => q.status === activeTab);

  return (
    <ExpressWeightPageLayout
      title="Express Weight Queue"
      description="Weight write-back queue structure migrated from SCM express-queue preview pattern. No sync execution."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Pending" value={summary.queuePending} />
        <KpiCard label="Synced" value={summary.queueSynced} />
        <KpiCard label="Failed" value={summary.queueFailed} />
        <KpiCard label="Sync Execution" value="Disabled" detail="Safe mode — design only" />
      </div>

      <PageSubnav items={STATUS_TABS} activeId={activeTab} onSelect={setActiveTab} />

      <TablePanel title="Express Weight Queue Items (design-only local data)">
        <table className="tgm-table">
          <thead>
            <tr>
              <th>Queue ID</th>
              <th>Source Doc</th>
              <th>Target Table</th>
              <th>Target Field</th>
              <th className="text-right">Old Weight</th>
              <th className="text-right">New Weight</th>
              <th>Status</th>
              <th className="text-right">Retry</th>
              <th>Last Error</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id}>
                <td className="font-mono text-xs">{row.id}</td>
                <td>{row.sourceDoc}</td>
                <td className="font-mono text-xs">{row.targetExpressTable}</td>
                <td>{row.targetField}</td>
                <td className="text-right">{formatWeight(row.oldWeight)}</td>
                <td className="text-right font-medium">{formatWeight(row.newWeight)}</td>
                <td><StatusPill status={row.status} /></td>
                <td className="text-right">{row.retryCount || 0}</td>
                <td className="max-w-[200px] truncate text-xs text-rose-600">{row.lastError || '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-6 text-center text-[var(--color-text-muted)]">No queue items</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TablePanel>

      <p className="text-xs text-[var(--color-text-muted)]">
        Queue refresh is local only. No Express DBF connection. See docs/08_EXPRESS_WEIGHT_WRITEBACK_DESIGN.md.
      </p>
    </ExpressWeightPageLayout>
  );
}
