import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';
import { mockInventory, inventoryColumns, inventorySummaryCards } from '../../data/mockInventory.js';

export default function ProductionPurchaseSuggestionPage() {
  return (
    <MockupPageShell
      title="Production / Purchase Suggestion"
      purpose="Suggested production runs and purchase orders based on demand and stock gaps."
      summaryCards={inventorySummaryCards}
      columns={inventoryColumns}
      rows={mockInventory}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Legacy source pgPlanStock/pgProdPlan in tgm-supplychain/index.html (~250+ lines each with AI, PO write-back, production orders) — deferred; partial read-only port TBD.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Production / Purchase Suggestion: awaiting partial read-only port from legacy Stock Planning view.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Port read-only v_stock_planning grid from legacy pgPlanStock when Supabase view is available in golive.',
      ]}
    />
  );
}
