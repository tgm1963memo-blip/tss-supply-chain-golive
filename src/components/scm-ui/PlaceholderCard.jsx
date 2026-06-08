import { Card } from './Card.jsx';
import Badge from './Badge.jsx';

export function PlaceholderCard({ title, description }) {
  return (
    <Card>
      <Badge type="neutral">Coming soon</Badge>
      <h2 className="mt-3 text-2xl font-bold text-[var(--color-text-main)]">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>
    </Card>
  );
}

export default PlaceholderCard;
