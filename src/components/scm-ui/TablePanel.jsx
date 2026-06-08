export default function TablePanel({ title, subtitle, meta, children, className = '' }) {
  return (
    <div className={`tgm-table-wrap ${className}`.trim()}>
      {title ? (
        <div className="tgm-table-panel-header">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-main)]">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{subtitle}</p> : null}
          </div>
          {meta ? <span className="text-xs text-[var(--color-text-muted)]">{meta}</span> : null}
        </div>
      ) : null}
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
