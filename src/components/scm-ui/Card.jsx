export function Card({ children, className = '', padding = true }) {
  return (
    <div className={`tgm-card ${padding ? 'p-5 sm:p-6' : ''} ${className}`.trim()}>{children}</div>
  );
}

export function KpiCard({ label, value, detail }) {
  return (
    <div className="tgm-card-padded transition hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[var(--color-text-main)]">{value}</p>
      {detail ? <p className="mt-1 text-xs text-[var(--color-text-muted)]">{detail}</p> : null}
    </div>
  );
}
