import { mockWmsTasks, wmsColumns, wmsSummaryCards } from '../../data/mockWms.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function BarcodeScanPage() {
  return (
    <MockupPageShell
      title="Barcode Scan"
      purpose="Mobile-friendly scan interface for receiving, picking, and stock count operations."
      summaryCards={wmsSummaryCards}
      columns={wmsColumns}
      rows={mockWmsTasks}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: Barcode Scan — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Barcode Scan: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire Barcode Scan to real data source after mockup UAT approval.',
      ]}
    />
  );
}
