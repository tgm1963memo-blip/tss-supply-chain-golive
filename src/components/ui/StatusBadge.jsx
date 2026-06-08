const VARIANTS = {
  mockup: 'status-badge--mockup',
  success: 'status-badge--success',
  warning: 'status-badge--warning',
  danger: 'status-badge--danger',
  info: 'status-badge--info',
};

export default function StatusBadge({ label, variant = 'mockup' }) {
  return (
    <span className={`status-badge ${VARIANTS[variant] ?? VARIANTS.mockup}`}>
      {label}
    </span>
  );
}
