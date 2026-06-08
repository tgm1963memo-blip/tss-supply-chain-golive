import { useCallback, useState } from 'react';
import { KpiCard } from '../../../components/scm-ui/Card.jsx';
import TablePanel from '../../../components/scm-ui/TablePanel.jsx';
import {
  ExpressWeightPageLayout,
  SafeModeButton,
  StatusPill,
} from './components/ExpressWeightLayout.jsx';
import {
  approveWeightReviewSafeMode,
  enqueueWeightWritebackSafeMode,
  listWeightReviews,
  rejectWeightReviewSafeMode,
} from '../../../services/expressWeight/expressWeightService.js';

function formatQty(v) {
  return Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function WeightReviewPage() {
  const [reviews, setReviews] = useState(() => listWeightReviews());
  const [toast, setToast] = useState(null);

  const refresh = useCallback(() => setReviews(listWeightReviews()), []);

  const showToast = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  const pending = reviews.filter((r) => r.status === 'pending');

  return (
    <ExpressWeightPageLayout
      title="Weight Review"
      description="Compare system qty vs captured weight. Approve/Reject/Queue actions are safe-mode only."
    >
      {toast ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{toast}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Pending Reviews" value={pending.length} />
        <KpiCard label="Within Tolerance" value={pending.filter((r) => r.toleranceStatus === 'within').length} />
        <KpiCard label="Exceeded Tolerance" value={pending.filter((r) => r.toleranceStatus === 'exceeded').length} />
      </div>

      <TablePanel title="Pending Weight Records">
        <table className="tgm-table">
          <thead>
            <tr>
              <th>Review ID</th>
              <th>SO No.</th>
              <th>Product</th>
              <th className="text-right">System Qty</th>
              <th className="text-right">Captured Wt</th>
              <th className="text-right">Expected Wt</th>
              <th className="text-right">Variance</th>
              <th>Tolerance</th>
              <th>Status</th>
              <th>Actions (Safe Mode)</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((row) => (
              <tr key={row.id}>
                <td className="font-mono text-xs">{row.id}</td>
                <td>{row.soNo}</td>
                <td className="font-mono">{row.product}</td>
                <td className="text-right">{formatQty(row.systemQty)}</td>
                <td className="text-right font-medium">{formatQty(row.capturedWeight)}</td>
                <td className="text-right">{formatQty(row.expectedWeight)}</td>
                <td className={`text-right font-semibold ${row.variance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatQty(row.variance)}
                </td>
                <td>
                  <StatusPill status={row.toleranceStatus} />
                  <span className="ml-1 text-xs text-[var(--color-text-muted)]">{formatQty(row.tolerancePct)}%</span>
                </td>
                <td><StatusPill status={row.status} /></td>
                <td>
                  {row.status === 'pending' ? (
                    <div className="flex flex-wrap gap-2">
                      <SafeModeButton
                        variant="success"
                        onClick={() => {
                          showToast(approveWeightReviewSafeMode(row.id).message);
                          refresh();
                        }}
                      >
                        Approve
                      </SafeModeButton>
                      <SafeModeButton
                        variant="danger"
                        onClick={() => {
                          showToast(rejectWeightReviewSafeMode(row.id).message);
                          refresh();
                        }}
                      >
                        Reject
                      </SafeModeButton>
                      <SafeModeButton
                        variant="primary"
                        onClick={() => {
                          showToast(enqueueWeightWritebackSafeMode(row.id).message);
                          refresh();
                        }}
                      >
                        Send to Queue
                      </SafeModeButton>
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--color-text-muted)]">—</span>
                  )}
                </td>
              </tr>
            ))}
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-6 text-center text-[var(--color-text-muted)]">No review records</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TablePanel>
    </ExpressWeightPageLayout>
  );
}
