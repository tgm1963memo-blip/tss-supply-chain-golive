import { mockSalesOrders, salesOrderColumns, salesSummaryCards } from '../../data/mockSalesOrders.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function ShortageReportPage() {
  return (
    <MockupPageShell
      title="Shortage Report"
      purpose="Historical and current shortage analysis for planning and procurement."
      summaryCards={salesSummaryCards}
      columns={salesOrderColumns}
      rows={mockSalesOrders}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Shortage Report — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Shortage Report: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire Shortage Report to real data source after mockup UAT approval.',
      ]}
    />
  );
}
