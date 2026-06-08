import { mockInventory, inventoryColumns, inventorySummaryCards } from '../../data/mockInventory.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function StockBalancePage() {
  return (
    <MockupPageShell
      title="Stock Balance"
      purpose="Real-time view of on-hand, reserved, and available quantities by SKU and location."
      summaryCards={inventorySummaryCards}
      columns={inventoryColumns}
      rows={mockInventory}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Stock Balance — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Stock Balance: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire Stock Balance to real data source after mockup UAT approval.',
      ]}
    />
  );
}
