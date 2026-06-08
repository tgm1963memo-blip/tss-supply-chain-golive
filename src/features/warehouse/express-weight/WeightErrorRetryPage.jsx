import { useCallback, useState } from 'react';
import { KpiCard } from '../../../components/scm-ui/Card.jsx';
import TablePanel from '../../../components/scm-ui/TablePanel.jsx';
import {
  ExpressWeightPageLayout,
  SafeModeButton,
  StatusPill,
} from './components/ExpressWeightLayout.jsx';
import {
  cancelWeightQueueSafeMode,
  listWeightErrors,
  markWeightErrorReviewedSafeMode,
  retryWeightWritebackSafeMode,
} from '../../../services/expressWeight/expressWeightService.js';

export default function WeightErrorRetryPage() {
  const [errors, setErrors] = useState(() => listWeightErrors());
  const [toast, setToast] = useState(null);

  const refresh = useCallback(() => setErrors(listWeightErrors()), []);

  const showToast = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  const failed = errors.filter((e) => e.status === 'Failed');

  return (
    <ExpressWeightPageLayout
      title="Weight Error / Retry"
      description="Failed queue items and retry workflow — safe-mode only. No Express connection attempted."
    >
      {toast ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{toast}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Failed Items" value={failed.length} />
        <KpiCard label="With Retries" value={errors.filter((e) => (e.retryCount || 0) > 0).length} />
        <KpiCard label="Express Retry" value="Disabled" detail="Safe mode" />
      </div>

      <TablePanel title="Failed Queue Items">
        <table className="tgm-table">
          <thead>
            <tr>
              <th>Queue ID</th>
              <th>Source Doc</th>
              <th>Target</th>
              <th className="text-right">New Weight</th>
              <th>Status</th>
              <th className="text-right">Retry Count</th>
              <th>Last Error</th>
              <th>Actions (Safe Mode)</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((row) => (
              <tr key={row.id}>
                <td className="font-mono text-xs">{row.id}</td>
                <td>{row.sourceDoc}</td>
                <td className="font-mono text-xs">{row.targetExpressTable}.{row.targetField}</td>
                <td className="text-right font-medium">{row.newWeight}</td>
                <td><StatusPill status={row.status} /></td>
                <td className="text-right">{row.retryCount || 0}</td>
                <td className="max-w-[220px] text-sm text-rose-600">{row.lastError || '—'}</td>
                <td>
                  {row.status === 'Failed' || row.status === 'Queued' ? (
                    <div className="flex flex-wrap gap-2">
                      <SafeModeButton
                        variant="primary"
                        onClick={() => {
                          showToast(retryWeightWritebackSafeMode(row.id).message);
                          refresh();
                        }}
                      >
                        Retry
                      </SafeModeButton>
                      <SafeModeButton
                        variant="default"
                        onClick={() => {
                          showToast(markWeightErrorReviewedSafeMode(row.id).message);
                          refresh();
                        }}
                      >
                        Mark Reviewed
                      </SafeModeButton>
                      <SafeModeButton
                        variant="danger"
                        onClick={() => {
                          showToast(cancelWeightQueueSafeMode(row.id).message);
                          refresh();
                        }}
                      >
                        Cancel Queue
                      </SafeModeButton>
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--color-text-muted)]">—</span>
                  )}
                </td>
              </tr>
            ))}
            {errors.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-[var(--color-text-muted)]">No failed queue items</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TablePanel>
    </ExpressWeightPageLayout>
  );
}
