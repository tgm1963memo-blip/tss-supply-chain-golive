import { mockProducts, productColumns, masterSummaryCards } from '../../data/mockMasterData.js';
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function UOMConversionPage() {
  return (
    <MockupPageShell
      title="UOM Conversion"
      purpose="Define unit-of-measure conversion factors between base and alternate UOMs."
      summaryCards={masterSummaryCards}
      columns={productColumns}
      rows={mockProducts}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: UOM Conversion — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'UOM Conversion: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire UOM Conversion to real data source after mockup UAT approval.',
      ]}
    />
  );
}
