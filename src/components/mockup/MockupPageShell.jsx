import PageHeader from '../ui/PageHeader';
import SummaryCard from '../ui/SummaryCard';
import DataTable from '../ui/DataTable';
import WorkflowStepper from '../ui/WorkflowStepper';

export default function MockupPageShell({
  title,
  purpose,
  summaryCards = [],
  columns = [],
  rows = [],
  workflowSteps = [],
  workflowNotes = [],
  businessRules = [],
  nextSteps = [],
}) {
  return (
    <div className="mockup-page">
      <PageHeader title={title} purpose={purpose} />

      {workflowSteps.length > 0 && <WorkflowStepper steps={workflowSteps} />}

      {summaryCards.length > 0 && (
        <div className="summary-cards">
          {summaryCards.map((card) => (
            <SummaryCard key={card.label} {...card} />
          ))}
        </div>
      )}

      <DataTable columns={columns} rows={rows} />

      <section className="notes-section">
        <NotesPanel title="User Workflow Notes" items={workflowNotes} />
        <NotesPanel title="Business Rule Notes" items={businessRules} />
        <NotesPanel title="Next Implementation Notes" items={nextSteps} />
      </section>
    </div>
  );
}

function NotesPanel({ title, items = [] }) {
  return (
    <div className="notes-panel">
      <h2 className="notes-panel__title">{title}</h2>
      {items.length > 0 ? (
        <ul className="notes-panel__list">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ) : (
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>No notes yet.</p>
      )}
    </div>
  );
}
