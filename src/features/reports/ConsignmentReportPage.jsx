import { mockConsignment, consignmentColumns, consignmentSummaryCards } from '../../data/mockConsignment.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function ConsignmentReportPage() {
  return (
    <MockupPageShell
      title="Consignment Report"
      purpose="Branch-level consignment sales, stock aging, and return analysis."
      summaryCards={consignmentSummaryCards}
      columns={consignmentColumns}
      rows={mockConsignment}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Consignment Report — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Consignment Report: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire Consignment Report to real data source after mockup UAT approval.',
      ]}
    />
  );
}
