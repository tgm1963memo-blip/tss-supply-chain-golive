import { mockProducts, productColumns, masterSummaryCards } from '../../data/mockMasterData.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function SKUAliasPage() {
  return (
    <MockupPageShell
      title="SKU Alias"
      purpose="Map alternate SKU codes, customer-specific codes, and legacy identifiers."
      summaryCards={masterSummaryCards}
      columns={productColumns}
      rows={mockProducts}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: SKU Alias — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'SKU Alias: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire SKU Alias to real data source after mockup UAT approval.',
      ]}
    />
  );
}
