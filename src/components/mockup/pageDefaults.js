export const defaultWorkflowNotes = [
  'User navigates from sidebar or mobile nav to this screen.',
  'All actions are display-only in mockup phase — no persistence.',
  'Use this screen to validate layout, labels, and workflow sequence with business users.',
];

export const defaultBusinessRules = [
  'Mockup data does not enforce real business validations.',
  'Stock reservation and deduction rules will be defined in Phase 2.',
  'Integration with Express ERP is out of scope for mockup shell.',
];

export const defaultNextSteps = [
  'Connect read-only Supabase views after UAT sign-off on mockups.',
  'Implement service layer with real API contracts.',
  'Add role-based access control per screen.',
];

export const defaultWorkflowSteps = [
  { id: 'draft', label: 'Draft', status: 'done' },
  { id: 'review', label: 'Review', status: 'active' },
  { id: 'approve', label: 'Approve', status: 'pending' },
  { id: 'execute', label: 'Execute', status: 'pending' },
];
