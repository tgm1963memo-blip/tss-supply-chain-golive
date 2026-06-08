import { mockInventory, inventoryColumns, inventorySummaryCards } from '../../data/mockInventory.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function ATPWorkbenchPage() {
  return (
    <MockupPageShell
      title="ATP Workbench"
      purpose="Calculate and review available-to-promise quantities across warehouses."
      summaryCards={inventorySummaryCards}
      columns={inventoryColumns}
      rows={mockInventory}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: ATP Workbench — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'ATP Workbench: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire ATP Workbench to real data source after mockup UAT approval.',
      ]}
    />
  );
}
