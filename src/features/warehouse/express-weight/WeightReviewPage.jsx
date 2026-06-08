import { mockWmsTasks, wmsColumns, wmsSummaryCards } from '../../../data/mockWms.js';
import MockupPageShell from '../../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../../components/mockup/pageDefaults.js';

export default function WeightReviewPage() {
  return (
    <MockupPageShell
      title="Weight Review"
      purpose="Review captured weights before queue submission. SAFE MODE — design only."
      summaryCards={wmsSummaryCards}
      columns={wmsColumns}
      rows={mockWmsTasks}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Weight Review — menu regroup placeholder; source migration pending.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Weight Review: awaiting business rule sign-off before live integration.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Migrate approved function from source project per docs/07_FUNCTION_REUSE_AND_MENU_REGROUP_MATRIX.md.',
      ]}
    />
  );
}
