import { mockSalesOrders, salesOrderColumns, salesSummaryCards } from '../../data/mockSalesOrders.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function ShortageOverviewPage() {
  return (
    <MockupPageShell
      title="Shortage Overview"
      purpose="Executive view of active shortages impacting customer delivery commitments."
      summaryCards={salesSummaryCards}
      columns={salesOrderColumns}
      rows={mockSalesOrders}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Shortage Overview — menu regroup placeholder; source migration pending.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Shortage Overview: awaiting business rule sign-off before live integration.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Migrate approved function from source project per docs/07_FUNCTION_REUSE_AND_MENU_REGROUP_MATRIX.md.',
      ]}
    />
  );
}
