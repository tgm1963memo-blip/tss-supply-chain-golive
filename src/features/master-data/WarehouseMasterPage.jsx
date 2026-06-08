import { masterSummaryCards } from '../../data/mockMasterData.js';
import { mockWarehouses, warehouseColumns } from '../../data/mockMasterData.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function WarehouseMasterPage() {
  return (
    <MockupPageShell
      title="Warehouse Master"
      purpose="Define warehouses, storage types, and capacity parameters."
      summaryCards={masterSummaryCards}
      columns={warehouseColumns}
      rows={mockWarehouses}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Warehouse Master — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Warehouse Master: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire Warehouse Master to real data source after mockup UAT approval.',
      ]}
    />
  );
}
