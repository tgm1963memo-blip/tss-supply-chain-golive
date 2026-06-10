import Alert from './Alert.jsx';
import Badge from './Badge.jsx';

export function SafeModeActionPanel({
  title,
  description,
  blockedAction = 'Stock posting',
  checklist = [],
}) {
  return (
    <section className="space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-main)]">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>
          ) : null}
        </div>
        <Badge type="warning">BLOCKED_BY_GOVERNANCE</Badge>
      </div>

      <Alert variant="warning">
        {blockedAction} is disabled in golive safe mode. Submit a Supabase request workflow only — no Express write-back.
      </Alert>

      {checklist.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-text-muted)]">
          {checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        disabled
        className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] opacity-70"
        title="Disabled in safe mode"
      >
        {blockedAction} — disabled
      </button>
    </section>
  );
}
