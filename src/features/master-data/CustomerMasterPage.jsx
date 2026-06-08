import { masterSummaryCards } from '../../data/mockMasterData.js';
import { mockCustomers, customerColumns } from '../../data/mockMasterData.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function CustomerMasterPage() {
  return (
    <MockupPageShell
      title="Customer Master"
      purpose="Manage customer profiles, channels, credit terms, and delivery preferences."
      summaryCards={masterSummaryCards}
      columns={customerColumns}
      rows={mockCustomers}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Customer Master — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Customer Master: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire Customer Master to real data source after mockup UAT approval.',
      ]}
    />
  );
}
