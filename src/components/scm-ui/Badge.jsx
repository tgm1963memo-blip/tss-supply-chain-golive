const typeClasses = {
  success: 'bg-[var(--color-success-bg)] text-[var(--color-success)] ring-[var(--color-success-border)]',
  warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] ring-[var(--color-warning-border)]',
  danger: 'bg-[var(--color-danger-bg)] text-[var(--color-danger)] ring-[var(--color-danger-border)]',
  info: 'bg-[var(--color-info-bg)] text-[var(--color-info)] ring-[var(--color-info-border)]',
  draft: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  neutral: 'bg-[var(--color-bg)] text-[var(--color-text-muted)] ring-[var(--color-border)]',
};

export default function Badge({ type = 'neutral', children, className = '' }) {
  const classes = typeClasses[type] || typeClasses.neutral;

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ${classes} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
