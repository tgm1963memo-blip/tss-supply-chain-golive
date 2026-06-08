/**
 * Live read-only UAT status — Phase 3C automated pass + Phase 3D–3E human sign-off tracking.
 */
export const UAT_SCOPE_PAGES = 16;

export const UAT_STATUS = {
  lastUpdated: '2026-06-08T14:00:00.000Z',
  tester: 'Cursor Agent (Phase 3C)',
  environmentStatus: 'configured',
  supabaseHealthStatus: 'ok',
  totalPages: 16,
  passed: 16,
  failed: 0,
  blocked: 0,
  safeModeActive: true,
  expressWriteBackDisabled: true,
  documentation: {
    execution: 'docs/11_LIVE_READONLY_UAT_EXECUTION.md',
    issueLog: 'docs/12_LIVE_READONLY_UAT_ISSUE_LOG.md',
    plan: 'docs/10_LIVE_READONLY_VALIDATION_PLAN.md',
    humanSignoff: 'docs/13_HUMAN_UAT_SIGNOFF.md',
    decisionRegister: 'docs/14_GOLIVE_DECISION_REGISTER.md',
  },
};

export const HUMAN_UAT_STATUS = {
  status: 'in_progress',
  statusLabel: 'In Progress',
  signedOff: false,
  decision: 'pending',
  reservationGovernance: 'pending',
  reservationGovernanceRecommended: 'B',
  openIssues: ['UAT-004'],
  lastUpdated: '2026-06-08T14:00:00.000Z',
  signoffDocument: 'docs/13_HUMAN_UAT_SIGNOFF.md',
  decisionRegister: 'docs/14_GOLIVE_DECISION_REGISTER.md',
  openNonBlockingIssues: [
    {
      id: 'UAT-004',
      page: 'Reservation Workbench',
      summary: 'Create reservation enabled; release disabled — governance decision required (DEC-001)',
    },
  ],
  acceptedLimitations: [
    {
      id: 'UAT-003',
      pages: 'WMS Dashboard, CONSI Dashboard',
      summary: 'Preview-only static data — live Supabase feeds deferred to Phase 4+ (DEC-003)',
    },
  ],
  closedIssues: ['UAT-001', 'UAT-002'],
  safeModeActive: true,
  expressWriteBackDisabled: true,
};

export const UAT_PAGE_RESULTS = [
  { page: 'Management Dashboard', route: '/executive/management', result: 'PASS' },
  { page: 'Sales Overview', route: '/executive/sales-overview', result: 'PASS' },
  { page: 'Sales Order', route: '/sales/orders', result: 'PASS' },
  { page: 'Sales Forecast', route: '/sales/forecast', result: 'PASS' },
  { page: 'Stock Balance', route: '/warehouse/inventory/balance', result: 'PASS' },
  { page: 'Available Stock', route: '/warehouse/inventory/available', result: 'PASS' },
  { page: 'Stock Movement', route: '/warehouse/inventory/movement', result: 'PASS' },
  { page: 'ATP Workbench', route: '/planning/atp', result: 'PASS' },
  { page: 'Reservation Workbench', route: '/planning/reservation', result: 'PASS' },
  { page: 'Shortage Review', route: '/planning/shortage-review', result: 'PASS' },
  { page: 'WMS Dashboard', route: '/warehouse/wms', result: 'PASS' },
  { page: 'Picking & Packing', route: '/warehouse/wms/picking-packing', result: 'PASS' },
  { page: 'Dispatch / Goods Issue', route: '/warehouse/wms/dispatch-goods-issue', result: 'PASS' },
  { page: 'CONSI Dashboard', route: '/consignment', result: 'PASS' },
  { page: 'Customer Master', route: '/master-data/customers', result: 'PASS' },
  { page: 'Product Master', route: '/master-data/products', result: 'PASS' },
];

export function getUatStatusSummary() {
  return { ...UAT_STATUS };
}

export function getUatPageResults() {
  return [...UAT_PAGE_RESULTS];
}

export function getHumanUatStatus() {
  return { ...HUMAN_UAT_STATUS };
}
