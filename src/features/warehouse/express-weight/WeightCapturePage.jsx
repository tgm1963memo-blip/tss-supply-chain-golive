import { mockWmsTasks, wmsColumns, wmsSummaryCards } from '../../../data/mockWms.js';
import MockupPageShell from '../../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../../components/mockup/pageDefaults.js';

export default function WeightCapturePage() {
  return (
    <MockupPageShell
      title="Weight Capture"
      purpose="Capture consignment weight readings for Express write-back queue. SAFE MODE — design only, no DBF write."
      summaryCards={wmsSummaryCards}
      columns={wmsColumns}
      rows={mockWmsTasks}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Weight Capture — menu regroup placeholder; source migration pending.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Weight Capture: awaiting business rule sign-off before live integration.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Migrate approved function from source project per docs/07_FUNCTION_REUSE_AND_MENU_REGROUP_MATRIX.md.',
      ]}
    />
  );
}
