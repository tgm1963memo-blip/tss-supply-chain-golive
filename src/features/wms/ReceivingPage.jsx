import { mockWmsTasks, wmsColumns, wmsSummaryCards } from '../../data/mockWms.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function ReceivingPage() {
  return (
    <MockupPageShell
      title="Receiving"
      purpose="Goods receipt against purchase orders with QC and lot capture."
      summaryCards={wmsSummaryCards}
      columns={wmsColumns}
      rows={mockWmsTasks}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Receiving — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Receiving: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire Receiving to real data source after mockup UAT approval.',
      ]}
    />
  );
}
