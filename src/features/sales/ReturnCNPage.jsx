import { mockSalesOrders, salesOrderColumns, salesSummaryCards } from '../../data/mockSalesOrders.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function ReturnCNPage() {
  return (
    <MockupPageShell
      title="Return / Credit Note"
      purpose="Process customer returns and generate credit notes linked to original sales orders."
      summaryCards={salesSummaryCards}
      columns={salesOrderColumns}
      rows={mockSalesOrders}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Return / Credit Note — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Return / Credit Note: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire Return / Credit Note to real data source after mockup UAT approval.',
      ]}
    />
  );
}
