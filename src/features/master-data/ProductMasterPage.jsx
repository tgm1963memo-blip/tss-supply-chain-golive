import { mockProducts, productColumns, masterSummaryCards } from '../../data/mockMasterData.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function ProductMasterPage() {
  return (
    <MockupPageShell
      title="Product Master"
      purpose="Maintain SKU master data including attributes, UOM, and barcode mappings."
      summaryCards={masterSummaryCards}
      columns={productColumns}
      rows={mockProducts}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Product Master — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Product Master: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire Product Master to real data source after mockup UAT approval.',
      ]}
    />
  );
}
