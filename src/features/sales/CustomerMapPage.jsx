import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import { mockCustomers, customerColumns, masterSummaryCards } from '../../data/mockMasterData.js';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function CustomerMapPage() {
  return (
    <MockupPageShell
      title="Customer Map"
      purpose="Visual map of customer locations, branches, and delivery zones. No implementation exists in SCM or WMS source projects."
      summaryCards={masterSummaryCards}
      columns={customerColumns}
      rows={mockCustomers}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'MOCK ONLY — no source function found in tss-supply-chain-management or TGD WMS.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        'Customer Map: greenfield function — define requirements before migration.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Design map data model and geocoding source before replacing mockup.',
      ]}
    />
  );
}
