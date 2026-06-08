import { mockSalesOrders, salesOrderColumns, salesSummaryCards } from '../../data/mockSalesOrders.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function SalesStockReportPage() {
  return (
    <MockupPageShell
      title="Sales & Stock Report"
      purpose="Combined view of sales performance and stock levels by SKU and period."
      summaryCards={salesSummaryCards}
      columns={salesOrderColumns}
      rows={mockSalesOrders}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Sales & Stock Report — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Sales & Stock Report: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire Sales & Stock Report to real data source after mockup UAT approval.',
      ]}
    />
  );
}
