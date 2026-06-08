const variantClasses = {
  info: 'border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[#1e3a8a]',
  success: 'border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[#027a48]',
  warning: 'border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[#92400e]',
  danger: 'border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[#b42318]',
};

export default function Alert({ variant = 'info', children, className = '' }) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${variantClasses[variant] || variantClasses.info} ${className}`.trim()}
      role="status"
    >
      {children}
    </div>
  );
}
