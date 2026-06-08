import Badge from './Badge.jsx';

const STATUS_TYPE_MAP = {
  active: 'success',
  completed: 'success',
  ready: 'success',
  live: 'success',
  partially_released: 'info',
  running: 'info',
  in_progress: 'info',
  draft: 'draft',
  preview: 'neutral',
  pending: 'warning',
  watch: 'warning',
  expired: 'warning',
  completed_with_errors: 'warning',
  cancelled: 'danger',
  failed: 'danger',
  released: 'neutral',
};

function normalizeStatus(status) {
  return String(status || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

export default function StatusBadge({ status, label }) {
  const normalized = normalizeStatus(status);
  const type = STATUS_TYPE_MAP[normalized] || 'neutral';
  const display = label ?? status ?? '-';

  return <Badge type={type}>{display}</Badge>;
}
