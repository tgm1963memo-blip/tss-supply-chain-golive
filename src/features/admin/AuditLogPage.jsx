import { masterSummaryCards } from '../../data/mockMasterData.js';
import { mockCustomers, customerColumns } from '../../data/mockMasterData.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function AuditLogPage() {
  return (
    <MockupPageShell
      title="Audit Log"
      purpose="Review system audit trail for data changes and user actions."
      summaryCards={masterSummaryCards}
      columns={customerColumns}
      rows={mockCustomers}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Audit Log — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Audit Log: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire Audit Log to real data source after mockup UAT approval.',
      ]}
    />
  );
}
