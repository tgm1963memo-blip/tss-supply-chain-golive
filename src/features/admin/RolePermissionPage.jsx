import { masterSummaryCards } from '../../data/mockMasterData.js';
import { mockCustomers, customerColumns } from '../../data/mockMasterData.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function RolePermissionPage() {
  return (
    <MockupPageShell
      title="Roles & Permissions"
      purpose="Configure role-based access control for modules and actions."
      summaryCards={masterSummaryCards}
      columns={customerColumns}
      rows={mockCustomers}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Roles & Permissions — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Roles & Permissions: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire Roles & Permissions to real data source after mockup UAT approval.',
      ]}
    />
  );
}
