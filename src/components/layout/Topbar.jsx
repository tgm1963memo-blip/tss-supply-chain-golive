import { Menu } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';

export default function Topbar({ onMenuClick, title = 'TSS Supply Chain Go-Live' }) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="topbar__menu-btn"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>
      <div className="topbar__title">{title}</div>
      <div className="topbar__badge">
        <StatusBadge label="MOCKUP ONLY" variant="mockup" />
      </div>
    </header>
  );
}
