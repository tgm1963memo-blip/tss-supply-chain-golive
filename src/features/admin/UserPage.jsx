import { masterSummaryCards } from '../../data/mockMasterData.js';
import { mockCustomers, customerColumns } from '../../data/mockMasterData.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function UserPage() {
  return (
    <MockupPageShell
      title="User Management"
      purpose="Manage system users, department assignments, and account status."
      summaryCards={masterSummaryCards}
      columns={customerColumns}
      rows={mockCustomers}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: User Management — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'User Management: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire User Management to real data source after mockup UAT approval.',
      ]}
    />
  );
}
