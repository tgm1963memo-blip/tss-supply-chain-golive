import { mockWmsTasks, wmsColumns, wmsSummaryCards } from '../../data/mockWms.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function StockAdjustmentPage() {
  return (
    <MockupPageShell
      title="Stock Adjustment"
      purpose="Adjust inventory for damage, expiry, or system correction with approval workflow."
      summaryCards={wmsSummaryCards}
      columns={wmsColumns}
      rows={mockWmsTasks}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Stock Adjustment — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Stock Adjustment: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire Stock Adjustment to real data source after mockup UAT approval.',
      ]}
    />
  );
}
