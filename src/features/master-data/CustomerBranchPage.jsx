import { mockProducts, productColumns, masterSummaryCards } from '../../data/mockMasterData.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function CustomerBranchPage() {
  return (
    <MockupPageShell
      title="Customer Branch"
      purpose="Maintain customer branch assignments and delivery points."
      summaryCards={masterSummaryCards}
      columns={productColumns}
      rows={mockProducts}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Customer Branch — menu regroup placeholder; source migration pending.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Customer Branch: awaiting business rule sign-off before live integration.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Migrate approved function from source project per docs/07_FUNCTION_REUSE_AND_MENU_REGROUP_MATRIX.md.',
      ]}
    />
  );
}
