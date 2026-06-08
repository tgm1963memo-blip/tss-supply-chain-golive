import { mockSalesOrders, salesOrderColumns, salesSummaryCards } from '../../data/mockSalesOrders.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function ShortageAlertPage() {
  return (
    <MockupPageShell
      title="Shortage Alerts"
      purpose="Monitor order lines where requested quantity exceeds available-to-promise inventory."
      summaryCards={salesSummaryCards}
      columns={salesOrderColumns}
      rows={mockSalesOrders}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Shortage Alerts — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Shortage Alerts: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire Shortage Alerts to real data source after mockup UAT approval.',
      ]}
    />
  );
}
