import { mockConsignment, consignmentColumns, consignmentSummaryCards } from '../../data/mockConsignment.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function CONSIOverviewPage() {
  return (
    <MockupPageShell
      title="CONSI Overview"
      purpose="Executive consignment network summary — branch stock, sell-out, and returns."
      summaryCards={consignmentSummaryCards}
      columns={consignmentColumns}
      rows={mockConsignment}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: CONSI Overview — menu regroup placeholder; source migration pending.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'CONSI Overview: awaiting business rule sign-off before live integration.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Migrate approved function from source project per docs/07_FUNCTION_REUSE_AND_MENU_REGROUP_MATRIX.md.',
      ]}
    />
  );
}
