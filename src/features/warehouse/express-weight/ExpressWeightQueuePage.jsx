import { mockWmsTasks, wmsColumns, wmsSummaryCards } from '../../../data/mockWms.js';
import MockupPageShell from '../../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../../components/mockup/pageDefaults.js';

export default function ExpressWeightQueuePage() {
  return (
    <MockupPageShell
      title="Express Weight Queue"
      purpose="Pending Express weight write-back queue. SAFE MODE — no live DBF posting."
      summaryCards={wmsSummaryCards}
      columns={wmsColumns}
      rows={mockWmsTasks}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Express Weight Queue — menu regroup placeholder; source migration pending.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Express Weight Queue: awaiting business rule sign-off before live integration.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Migrate approved function from source project per docs/07_FUNCTION_REUSE_AND_MENU_REGROUP_MATRIX.md.',
      ]}
    />
  );
}
