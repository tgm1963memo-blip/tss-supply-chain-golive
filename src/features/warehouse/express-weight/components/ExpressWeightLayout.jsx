import Alert from '../../../../components/scm-ui/Alert.jsx';
import Badge from '../../../../components/scm-ui/Badge.jsx';
import PageHeader from '../../../../components/scm-ui/PageHeader.jsx';
import { isExpressWeightSafeMode } from '../../../../services/expressWeight/expressWeightService.js';

export function ExpressWeightSafeBanner() {
  return (
    <Alert variant="warning">
      <strong>DESIGN ONLY / SAFE MODE</strong> — No Express DBF write-back, no queue execution, no stock posting,
      no dispatch posting. All actions are simulated locally for governance review only.
      {isExpressWeightSafeMode() ? ' (EXPRESS_WEIGHT_SAFE_MODE = true)' : null}
    </Alert>
  );
}

export function ExpressWeightPageLayout({ title, description, children, actions }) {
  return (
    <section className="tgm-page space-y-5">
      <PageHeader
        title={title}
        description={description}
        actions={
          actions || (
            <>
              <Badge type="warning">DESIGN ONLY</Badge>
              <Badge type="neutral">SAFE MODE</Badge>
            </>
          )
        }
      />
      <ExpressWeightSafeBanner />
      {children}
    </section>
  );
}

export function SafeModeButton({ children, onClick, variant = 'default', disabled = false, title }) {
  const base = 'btn min-h-10 rounded-md px-4 text-sm font-medium border transition';
  const variants = {
    default: 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-main)] hover:bg-[var(--color-bg)]',
    primary: 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700',
    danger: 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100',
    success: 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  };

  return (
    <button
      type="button"
      className={`${base} ${variants[variant] || variants.default} disabled:opacity-50 disabled:cursor-not-allowed`}
      onClick={onClick}
      disabled={disabled}
      title={title || 'Safe mode — no Express write-back'}
    >
      {children}
    </button>
  );
}

export function StatusPill({ status }) {
  const map = {
    draft: 'bg-gray-100 text-gray-700',
    pending_review: 'bg-amber-100 text-amber-800',
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-rose-100 text-rose-800',
    queued: 'bg-blue-100 text-blue-800',
    Pending: 'bg-amber-100 text-amber-800',
    Approved: 'bg-emerald-100 text-emerald-800',
    Queued: 'bg-blue-100 text-blue-800',
    Synced: 'bg-emerald-100 text-emerald-800',
    Failed: 'bg-rose-100 text-rose-800',
    Cancelled: 'bg-gray-100 text-gray-600',
    Reviewed: 'bg-indigo-100 text-indigo-800',
    within: 'bg-emerald-100 text-emerald-800',
    exceeded: 'bg-rose-100 text-rose-800',
  };
  const cls = map[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}
