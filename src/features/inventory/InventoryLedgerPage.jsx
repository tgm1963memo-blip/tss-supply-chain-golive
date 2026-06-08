import { mockInventory, inventoryColumns, inventorySummaryCards } from '../../data/mockInventory.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function InventoryLedgerPage() {
  return (
    <MockupPageShell
      title="Inventory Ledger"
      purpose="Audit trail of all inventory transactions with before/after balances."
      summaryCards={inventorySummaryCards}
      columns={inventoryColumns}
      rows={mockInventory}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Inventory Ledger — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Inventory Ledger: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire Inventory Ledger to real data source after mockup UAT approval.',
      ]}
    />
  );
}
