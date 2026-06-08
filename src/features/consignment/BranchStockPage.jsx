import { mockConsignment, consignmentColumns, consignmentSummaryCards } from '../../data/mockConsignment.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function BranchStockPage() {
  return (
    <MockupPageShell
      title="Branch Stock"
      purpose="View and manage consignment inventory held at branch locations."
      summaryCards={consignmentSummaryCards}
      columns={consignmentColumns}
      rows={mockConsignment}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Branch Stock — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Branch Stock: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire Branch Stock to real data source after mockup UAT approval.',
      ]}
    />
  );
}
