import { mockProducts, productColumns, masterSummaryCards } from '../../data/mockMasterData.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function SampleRequestPage() {
  return (
    <MockupPageShell
      title="Sample Request"
      purpose="Request product samples for customer demos, trials, or marketing activities."
      summaryCards={masterSummaryCards}
      columns={productColumns}
      rows={mockProducts}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Sample Request — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Sample Request: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire Sample Request to real data source after mockup UAT approval.',
      ]}
    />
  );
}
