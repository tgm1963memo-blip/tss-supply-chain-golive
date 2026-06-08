const operationsModules = {
  'product-mapping': {
    title: 'Product Mapping',
    badge: 'Draft / Read-only',
    description: 'SKU alias, sale SKU to stock SKU, UOM conversion, and bundle draft readiness.',
    banner: 'Draft/read-only only. No stock explosion, stock deduction, ledger posting, or sync write is implemented.',
    filters: ['SKU alias', 'Sale SKU', 'Stock SKU', 'Mapping status'],
    metrics: [
      ['SKU aliases', '0'],
      ['Sale to stock maps', '0'],
      ['UOM conversions', '0'],
      ['Bundle drafts', '0'],
    ],
    columns: ['SKU alias', 'Sale SKU', 'Stock SKU', 'UOM conversion', 'Bundle draft', 'Status'],
    statusIndex: 5,
    rows: [
      ['Awaiting import', '-', '-', '-', '-', 'Draft'],
    ],
    emptyText: 'No product mapping data is connected yet. Prepare SKU alias and UOM mapping import files first.',
    tabs: [
      { id: 'alias', label: 'Alias' },
      { id: 'uom', label: 'UOM' },
      { id: 'bundle', label: 'Bundle' },
      { id: 'rules', label: 'Rules' }
    ]
  },
  'modern-trade-stock': {
    title: 'Modern Trade / CONSI',
    badge: 'Import-ready',
    description: 'Branch stock by customer, branch, and SKU with temporary DN and adjustment context.',
    banner: 'Read-only/import-ready structure only. No settlement, stock update, ledger posting, or Express write-back is implemented.',
    filters: ['Customer', 'Branch', 'SKU', 'Balance status'],
    metrics: [
      ['Customers', '0'],
      ['Branches', '0'],
      ['Temp DN rows', '0'],
      ['CN adjustments', '0'],
    ],
    columns: ['Customer', 'Branch', 'SKU', 'Temp DN', 'Sell-out', 'Return', 'CN adjust', 'Branch balance', 'Status'],
    statusIndex: 8,
    rows: [
      ['Awaiting import', '-', '-', '0', '0', '0', '0', '0', 'Draft'],
    ],
    emptyText: 'No Modern Trade / CONSI branch stock import is connected yet.',
    tabs: [
      { id: 'branch-stock', label: 'Branch Stock' },
      { id: 'temp-dn', label: 'Temp DN' },
      { id: 'sell-out', label: 'Sell-out' },
      { id: 'return', label: 'Return' },
      { id: 'cn-adjust', label: 'CN Adjust' }
    ]
  },
  'issue-request': {
    title: 'Issue Request / ของชิม',
    badge: 'Draft',
    description: 'Draft requests for sampling, consumables, event stock, and customer samples.',
    banner: 'Draft request only. No stock deduction, goods issue, picking confirmation, or ledger posting is implemented.',
    filters: ['Request type', 'Requester', 'Status', 'Approval status'],
    metrics: [
      ['Draft requests', '0'],
      ['Lines', '0'],
      ['Pending approval', '0'],
      ['Blocked', '0'],
    ],
    columns: ['Request no', 'Type', 'Requester', 'Line count', 'Status', 'Approval status', 'Owner'],
    statusIndex: 5,
    rows: [
      ['Draft placeholder', 'Sampling', '-', '0', 'Draft', 'Not submitted', '-'],
    ],
    emptyText: 'No issue request drafts exist yet. Use this page as the UAT-ready structure only.',
    tabs: [
      { id: 'request', label: 'Request' },
      { id: 'lines', label: 'Lines' },
      { id: 'approval', label: 'Approval' },
      { id: 'audit', label: 'Audit' }
    ]
  },
  'cn-return': {
    title: 'CN / Return',
    badge: 'Draft',
    description: 'Draft CN/return requests with type, reason, approval state, and Express queue status.',
    banner: 'Draft CN/return request only. No return receiving, stock update, inventory ledger posting, or Express write-back is implemented.',
    filters: ['Request type', 'Reason', 'Stock impact', 'Approval status'],
    metrics: [
      ['Draft CN/returns', '0'],
      ['Stock-impact flagged', '0'],
      ['Pending approval', '0'],
      ['Express queued', '0'],
    ],
    columns: ['Request no', 'Type', 'Reason', 'Stock impact flag', 'Approval status', 'Express queue status', 'Status'],
    statusIndex: 6,
    rows: [
      ['Draft placeholder', 'Return', '-', 'No', 'Not submitted', 'Not queued', 'Draft'],
    ],
    emptyText: 'No CN / Return draft data exists yet.',
    tabs: [
      { id: 'cn-request', label: 'CN Request' },
      { id: 'return-info', label: 'Return Info' },
      { id: 'approval', label: 'Approval' },
      { id: 'express-queue', label: 'Express Queue' }
    ]
  },
  'express-queue': {
    title: 'Express Queue',
    badge: 'Read-only gate',
    description: 'Document readiness gate for invoice SO, temp DN, CN request, and issue references.',
    banner: 'Read-only queue preview. No DBF write-back, Express posting, invoice posting, or file export is implemented.',
    filters: ['Document type', 'Reference', 'Queue status', 'Owner'],
    metrics: [
      ['Draft', '0'],
      ['Ready', '0'],
      ['Blocked', '0'],
      ['Sent/Error', '0'],
    ],
    columns: ['Queue ref', 'Document type', 'Source reference', 'Readiness', 'Status', 'Block reason', 'Owner'],
    statusIndex: 4,
    rows: [
      ['Queue placeholder', 'Invoice SO', '-', 'Needs validation', 'Draft', '-', '-'],
    ],
    emptyText: 'No Express queue entries exist yet. This page is a document gate preview only.',
    tabs: [
      { id: 'ready', label: 'Ready' },
      { id: 'blocked', label: 'Blocked' },
      { id: 'sent', label: 'Sent' },
      { id: 'error', label: 'Error' }
    ]
  },
  'approval-audit': {
    title: 'Approval / Audit',
    badge: 'Read-only',
    description: 'Approval inbox/read model for issue, CN, Express gate, and mapping draft workflows.',
    banner: 'Read-only approval/audit preview. Approval actions are not implemented in Phase 8V.',
    filters: ['Module', 'Actor', 'Approval status', 'Severity'],
    metrics: [
      ['Inbox items', '0'],
      ['Audit events', '0'],
      ['Pending approval', '0'],
      ['Policy blocks', '0'],
    ],
    columns: ['Inbox item', 'Module', 'Reference', 'Actor', 'Approval status', 'Audit status', 'Updated'],
    statusIndex: 4,
    rows: [
      ['Inbox placeholder', 'Issue Request', '-', '-', 'Not submitted', 'No audit event', '-'],
    ],
    emptyText: 'No approval inbox data is connected yet. Existing audit data can be wired in a future phase.',
    tabs: [
      { id: 'inbox', label: 'Inbox' },
      { id: 'history', label: 'History' },
      { id: 'permission-notes', label: 'Permission Notes' }
    ]
  },
  'stock-adjust': {
    title: 'Stock Adjustment',
    badge: 'Safe Mode / Read-only',
    description: 'Draft stock adjustments for damage, expiry, or system correction with approval workflow.',
    banner: 'Read-only preview. No stock posting, ledger update, inventory mutation, or Express write-back is implemented.',
    filters: ['Warehouse', 'Reason code', 'Approval status', 'Document status'],
    metrics: [
      ['Draft adjustments', '0'],
      ['Pending approval', '0'],
      ['Posted (blocked)', '0'],
      ['Variance lines', '0'],
    ],
    columns: ['Adjust no', 'Warehouse', 'Reason', 'Line count', 'Variance qty', 'Approval status', 'Status'],
    statusIndex: 6,
    rows: [
      ['Draft placeholder', '-', 'Damage', '0', '0', 'Not submitted', 'Draft'],
    ],
    emptyText: 'No stock adjustment drafts exist yet. Use this page as the UAT-ready structure only.',
    tabs: [
      { id: 'request', label: 'Request' },
      { id: 'lines', label: 'Lines' },
      { id: 'approval', label: 'Approval' },
      { id: 'audit', label: 'Audit' },
    ],
  },
  'warehouse-dashboard': {
    title: 'Warehouse Dashboard',
    badge: 'Read-only Preview',
    description: 'Inbound, putaway, picking, dispatch workload and document readiness overview.',
    banner: 'Read-only dashboard preview. No document posting, stock movement, or Express write-back is implemented.',
    filters: ['Warehouse', 'Document type', 'Status', 'Date range'],
    metrics: [
      ['Receiving open', '0'],
      ['Putaway pending', '0'],
      ['Picking active', '0'],
      ['Dispatch ready', '0'],
    ],
    columns: ['Document no', 'Type', 'Warehouse', 'Status', 'Owner', 'Updated'],
    statusIndex: 3,
    rows: [
      ['Preview placeholder', 'Receiving', '-', 'Draft', '-', '-'],
    ],
    emptyText: 'No warehouse dashboard data is connected yet. WMS document lists provide live read-only views.',
    tabs: [
      { id: 'inbound', label: 'Inbound' },
      { id: 'internal', label: 'Internal' },
      { id: 'outbound', label: 'Outbound' },
      { id: 'exceptions', label: 'Exceptions' },
    ],
  },
  putaway: {
    title: 'Putaway Preview',
    badge: 'Safe Mode / Read-only',
    description: 'Draft putaway documents linked to receiving references.',
    banner: 'Read-only preview. No putaway posting, location assignment write-back, or ledger update is implemented.',
    filters: ['Warehouse', 'Receiving ref', 'Status', 'Type'],
    metrics: [
      ['Open putaway', '0'],
      ['Lines pending', '0'],
      ['Assigned locations', '0'],
      ['Blocked', '0'],
    ],
    columns: ['Putaway no', 'Receiving ref', 'Warehouse', 'Line count', 'Status', 'Created'],
    statusIndex: 4,
    rows: [
      ['Draft placeholder', '-', '-', '0', 'Draft', '-'],
    ],
    emptyText: 'No putaway preview rows exist yet. WMS PutawayPage list is used for live document read.',
    tabs: [
      { id: 'documents', label: 'Documents' },
      { id: 'lines', label: 'Lines' },
      { id: 'locations', label: 'Locations' },
    ],
  },
  transfer: {
    title: 'Transfer Preview',
    badge: 'Safe Mode / Read-only',
    description: 'Internal warehouse transfer draft and movement control preview.',
    banner: 'Read-only preview. No transfer posting, stock movement, or balance update is implemented.',
    filters: ['From warehouse', 'To warehouse', 'Status', 'Type'],
    metrics: [
      ['Open transfers', '0'],
      ['Lines', '0'],
      ['In transit', '0'],
      ['Blocked', '0'],
    ],
    columns: ['Transfer no', 'From', 'To', 'Type', 'Status', 'Created'],
    statusIndex: 4,
    rows: [
      ['Draft placeholder', '-', '-', 'Internal', 'Draft', '-'],
    ],
    emptyText: 'No transfer preview rows exist yet. WMS TransferPage list is used for live document read.',
    tabs: [
      { id: 'documents', label: 'Documents' },
      { id: 'lines', label: 'Lines' },
      { id: 'audit', label: 'Audit' },
    ],
  },
  'confirm-pick': {
    title: 'Confirm Pick Safe Mode',
    badge: 'Safe Mode / Read-only',
    description: 'Pick confirmation preview for SO pick-pack candidates and WMS picking drafts.',
    banner: 'Safe mode preview only. Pick confirmation, stock deduction, and dispatch posting are disabled.',
    filters: ['SO document', 'Customer', 'Warehouse', 'Pick status'],
    metrics: [
      ['Candidates', '0'],
      ['Sessions open', '0'],
      ['Ready to confirm', '0'],
      ['Blocked', '0'],
    ],
    columns: ['Document no', 'Customer', 'Product', 'Reserved qty', 'Pick status', 'Block reason', 'Status'],
    statusIndex: 6,
    rows: [
      ['Preview placeholder', '-', '-', '0', 'Draft', '-', 'Safe mode'],
    ],
    emptyText: 'No pick confirmation data connected yet. Use Picking & Packing tabs for live candidate read.',
    tabs: [
      { id: 'candidates', label: 'Candidates' },
      { id: 'sessions', label: 'Sessions' },
      { id: 'confirm', label: 'Confirm' },
      { id: 'audit', label: 'Audit' },
    ],
  },
  dispatch: {
    title: 'Dispatch Preview',
    badge: 'Safe Mode / Read-only',
    description: 'Dispatch document list and loading confirmation preview.',
    banner: 'Read-only preview. No dispatch posting, goods issue, or stock movement OUT is implemented.',
    filters: ['Customer', 'Warehouse', 'Status', 'Dispatch date'],
    metrics: [
      ['Open dispatch', '0'],
      ['Ready to load', '0'],
      ['Posted (blocked)', '0'],
      ['Exceptions', '0'],
    ],
    columns: ['Dispatch no', 'Customer', 'Warehouse', 'Picking ref', 'Status', 'Dispatch date'],
    statusIndex: 4,
    rows: [
      ['Draft placeholder', '-', '-', '-', 'Draft', '-'],
    ],
    emptyText: 'No dispatch preview rows exist yet. WMS Dispatch list is used for live document read.',
    tabs: [
      { id: 'documents', label: 'Documents' },
      { id: 'loading', label: 'Loading' },
      { id: 'audit', label: 'Audit' },
    ],
  },
  'goods-issue': {
    title: 'Goods Issue Preview',
    badge: 'Safe Mode / Read-only',
    description: 'Outbound goods issue and post-outbound flow preview.',
    banner: 'Read-only preview. No post outbound, stock movement OUT, or Express write-back is implemented.',
    filters: ['Document no', 'Customer', 'Status', 'Ship date'],
    metrics: [
      ['Draft', '0'],
      ['Reserved', '0'],
      ['Picked', '0'],
      ['Posted (blocked)', '0'],
    ],
    columns: ['Document no', 'Customer', 'Status', 'Ship date', 'Line count', 'Owner'],
    statusIndex: 2,
    rows: [
      ['Preview placeholder', '-', 'Draft', '-', '0', '-'],
    ],
    emptyText: 'No goods issue preview rows exist yet. Outbound list tab provides live document read.',
    tabs: [
      { id: 'documents', label: 'Documents' },
      { id: 'lines', label: 'Lines' },
      { id: 'reservations', label: 'Reservations' },
      { id: 'audit', label: 'Audit' },
    ],
  },
  'cycle-count': {
    title: 'Cycle Count',
    badge: 'Safe Mode / Read-only',
    description: 'Cycle count and full physical inventory count with variance reconciliation preview.',
    banner: 'Read-only preview. No count posting, variance reconciliation, adjustment creation, or Express write-back is implemented.',
    filters: ['Warehouse', 'Count type', 'Count date', 'Status'],
    metrics: [
      ['Open counts', '0'],
      ['Lines counted', '0'],
      ['Variance lines', '0'],
      ['Pending approval', '0'],
    ],
    columns: ['Count no', 'Warehouse', 'Count type', 'Count date', 'Variance lines', 'Approval status', 'Status'],
    statusIndex: 6,
    rows: [
      ['Draft placeholder', '-', 'Cycle', '-', '0', 'Not submitted', 'Draft'],
    ],
    emptyText: 'No cycle count drafts exist yet. WMS StockCountPage list is used for live document read.',
    tabs: [
      { id: 'documents', label: 'Documents' },
      { id: 'lines', label: 'Lines' },
      { id: 'variance', label: 'Variance' },
      { id: 'audit', label: 'Audit' },
    ],
  },
  'data-health': {
    title: 'Data Health',
    badge: 'Read-only',
    description: 'Validation and UAT readiness status across Reservation, Picking Draft, and operations preview.',
    banner: 'Validation preview only. Run Supabase validation SQL for authoritative results.',
    filters: ['Domain', 'Severity', 'Status', 'Owner'],
    metrics: [
      ['Health checks', '0'],
      ['Pass', '0'],
      ['Info', '0'],
      ['Fail', '0'],
    ],
    columns: ['Check', 'Domain', 'Status', 'Detail', 'Owner', 'Run'],
    statusIndex: 2,
    rows: [
      ['Run validation SQL', 'UAT', 'Info', 'Use Phase 8V validation for authoritative status', 'Operator', '-'],
    ],
    emptyText: 'Run validation SQL to populate UAT evidence.',
    tabs: [
      { id: 'health-checks', label: 'Health Checks' },
      { id: 'logs', label: 'Logs' }
    ]
  },
};

export function getOperationsExtensionModule(moduleKey) {
  if (operationsModules[moduleKey]) {
    return operationsModules[moduleKey];
  }

  // Generic fallback for preview routes
  const titleStr = moduleKey
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: titleStr,
    badge: 'Read-only Preview',
    description: 'Coming Soon.',
    banner: 'This module is a read-only preview. No transactions or mutations are implemented yet.',
    filters: ['Status'],
    metrics: [['Records', '0']],
    columns: ['Status'],
    statusIndex: 0,
    rows: [['Coming Soon']],
    emptyText: 'This module is under development.',
    tabs: []
  };
}

export function listOperationsExtensionModules() {
  return Object.entries(operationsModules).map(([key, value]) => ({
    key,
    title: value.title,
    badge: value.badge,
    description: value.description,
  }));
}
