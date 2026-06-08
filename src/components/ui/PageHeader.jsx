import StatusBadge from './StatusBadge';

export default function PageHeader({ title, purpose, badgeLabel = 'MOCKUP', badgeVariant = 'mockup', actions }) {
  return (
    <header className="page-header">
      <div className="page-header__row">
        <div>
          <h1 className="page-header__title">{title}</h1>
          <p className="page-header__purpose">{purpose}</p>
        </div>
        <div className="page-header__actions">
          {actions}
          <StatusBadge label={badgeLabel} variant={badgeVariant} />
        </div>
      </div>
    </header>
  );
}
