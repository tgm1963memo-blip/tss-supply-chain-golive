export default function WorkflowStepper({ steps = [] }) {
  if (!steps.length) return null;

  return (
    <nav className="workflow-stepper" aria-label="Workflow steps">
      {steps.map((step, index) => (
        <div
          key={step.id ?? index}
          className={`workflow-stepper__step workflow-stepper__step--${step.status ?? 'pending'}`}
        >
          <span className="workflow-stepper__indicator">{index + 1}</span>
          <span className="workflow-stepper__label">{step.label}</span>
        </div>
      ))}
    </nav>
  );
}
