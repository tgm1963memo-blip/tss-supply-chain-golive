import { mockWmsTasks, wmsColumns, wmsSummaryCards } from '../../../data/mockWms.js';
import MockupPageShell from '../../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../../components/mockup/pageDefaults.js';

export default function ExpressWeightSyncLogPage() {
  return (
    <MockupPageShell
      title="Express Weight Sync Log"
      purpose="Historical log of Express weight sync attempts. SAFE MODE — read-only mock."
      summaryCards={wmsSummaryCards}
      columns={wmsColumns}
      rows={mockWmsTasks}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Express Weight Sync Log — menu regroup placeholder; source migration pending.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Express Weight Sync Log: awaiting business rule sign-off before live integration.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Migrate approved function from source project per docs/07_FUNCTION_REUSE_AND_MENU_REGROUP_MATRIX.md.',
      ]}
    />
  );
}
