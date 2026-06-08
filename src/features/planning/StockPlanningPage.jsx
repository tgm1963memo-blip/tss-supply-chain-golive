import { PlaceholderCard } from '../../components/scm-ui/PlaceholderCard.jsx';
import PageHeader from '../../components/scm-ui/PageHeader.jsx';

export default function StockPlanningPage() {
  return (
    <section className="tgm-page">
      <PageHeader
        title="Stock & Planning"
        description="Migrated from SCM PlanningPage — forecast, planning note, and stock planning placeholders."
      />
      <PlaceholderCard
        title="Planning"
        description="Forecast, planning note, and stock planning placeholders."
      />
    </section>
  );
}
