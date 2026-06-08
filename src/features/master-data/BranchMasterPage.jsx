import { masterSummaryCards } from '../../data/mockMasterData.js';
import { mockBranches, branchColumns } from '../../data/mockMasterData.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function BranchMasterPage() {
  return (
    <MockupPageShell
      title="Branch Master"
      purpose="Configure consignment branch locations and regional assignments."
      summaryCards={masterSummaryCards}
      columns={branchColumns}
      rows={mockBranches}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Branch Master — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Branch Master: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire Branch Master to real data source after mockup UAT approval.',
      ]}
    />
  );
}
