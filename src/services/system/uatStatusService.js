/**
 * Live read-only UAT status — static snapshot from Phase 3C initial validation pass.
 * Updated when docs/11 execution record is finalized.
 */
export const UAT_SCOPE_PAGES = 16;

export const UAT_STATUS = {
  lastUpdated: '2026-06-08T07:54:16.912Z',
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
  },
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
