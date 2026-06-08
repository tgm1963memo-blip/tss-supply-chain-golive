import { mockInventory, inventoryColumns, inventorySummaryCards } from '../../data/mockInventory.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function LocationMasterPage() {
  return (
    <MockupPageShell
      title="Location Master"
      purpose="Manage bin/rack locations within warehouses for WMS operations."
      summaryCards={inventorySummaryCards}
      columns={inventoryColumns}
      rows={mockInventory}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Location Master — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Location Master: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire Location Master to real data source after mockup UAT approval.',
      ]}
    />
  );
}
