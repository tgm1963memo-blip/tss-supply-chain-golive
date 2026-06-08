import { mockConsignment, consignmentColumns, consignmentSummaryCards } from '../../data/mockConsignment.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function ConsignmentDashboardPage() {
  return (
    <MockupPageShell
      title="Consignment Dashboard"
      purpose="Overview of branch stock levels, sales, and pending returns across consignment network."
      summaryCards={consignmentSummaryCards}
      columns={consignmentColumns}
      rows={mockConsignment}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Consignment Dashboard — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Consignment Dashboard: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire Consignment Dashboard to real data source after mockup UAT approval.',
      ]}
    />
  );
}
