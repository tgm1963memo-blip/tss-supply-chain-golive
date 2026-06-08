import { mockWmsTasks, wmsColumns, wmsSummaryCards } from '../../../data/mockWms.js';
import MockupPageShell from '../../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../../components/mockup/pageDefaults.js';

export default function WeightErrorRetryPage() {
  return (
    <MockupPageShell
      title="Weight Error / Retry"
      purpose="Failed weight sync errors and retry actions. SAFE MODE — design only."
      summaryCards={wmsSummaryCards}
      columns={wmsColumns}
      rows={mockWmsTasks}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Weight Error / Retry — menu regroup placeholder; source migration pending.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Weight Error / Retry: awaiting business rule sign-off before live integration.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Migrate approved function from source project per docs/07_FUNCTION_REUSE_AND_MENU_REGROUP_MATRIX.md.',
      ]}
    />
  );
}
