import { mockConsignment, consignmentColumns, consignmentSummaryCards } from '../../data/mockConsignment.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function ConsignmentReturnCNPage() {
  return (
    <MockupPageShell
      title="Consignment Return / CN"
      purpose="Process branch returns and credit notes for unsold consignment stock."
      summaryCards={consignmentSummaryCards}
      columns={consignmentColumns}
      rows={mockConsignment}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Consignment Return / CN — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Consignment Return / CN: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire Consignment Return / CN to real data source after mockup UAT approval.',
      ]}
    />
  );
}
