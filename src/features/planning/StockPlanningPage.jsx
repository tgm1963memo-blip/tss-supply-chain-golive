import { mockInventory, inventoryColumns, inventorySummaryCards } from '../../data/mockInventory.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function StockPlanningPage() {
  return (
    <MockupPageShell
      title="Stock Planning"
      purpose="Plan replenishment based on forecast, safety stock, and lead time parameters."
      summaryCards={inventorySummaryCards}
      columns={inventoryColumns}
      rows={mockInventory}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Stock Planning — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Stock Planning: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire Stock Planning to real data source after mockup UAT approval.',
      ]}
    />
  );
}
