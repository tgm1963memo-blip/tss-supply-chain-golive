import { masterSummaryCards } from '../../data/mockMasterData.js';
import { mockCustomers, customerColumns } from '../../data/mockMasterData.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function SyncMonitorPage() {
  return (
    <MockupPageShell
      title="Sync Monitor"
      purpose="Monitor integration sync status between Supabase, Express ERP, and WMS."
      summaryCards={masterSummaryCards}
      columns={customerColumns}
      rows={mockCustomers}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Sync Monitor — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Sync Monitor: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire Sync Monitor to real data source after mockup UAT approval.',
      ]}
    />
  );
}
