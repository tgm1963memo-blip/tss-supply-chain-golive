import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const pages = [
  // Dashboard
  { dir: 'dashboard', file: 'DashboardPage', title: 'Dashboard', purpose: 'Executive overview of supply chain KPIs, open orders, inventory health, and WMS task status.', data: 'sales', cards: 'salesSummaryCards' },

  // Sales
  { dir: 'sales', file: 'SalesOrderListPage', title: 'Sales Order List', purpose: 'Browse and filter sales orders with reservation and shortage indicators.', data: 'sales', cards: 'salesSummaryCards' },
  { dir: 'sales', file: 'SalesOrderDetailPage', title: 'Sales Order Detail', purpose: 'View order header, line items, reservation status, and delivery schedule for a single sales order.', data: 'sales', cards: 'salesSummaryCards' },
  { dir: 'sales', file: 'ReservationWorkbenchPage', title: 'Reservation Workbench', purpose: 'Allocate available stock to sales order lines and resolve reservation conflicts.', data: 'sales', cards: 'salesSummaryCards' },
  { dir: 'sales', file: 'ShortageAlertPage', title: 'Shortage Alerts', purpose: 'Monitor order lines where requested quantity exceeds available-to-promise inventory.', data: 'sales', cards: 'salesSummaryCards' },
  { dir: 'sales', file: 'ReturnCNPage', title: 'Return / Credit Note', purpose: 'Process customer returns and generate credit notes linked to original sales orders.', data: 'sales', cards: 'salesSummaryCards' },

  // Planning
  { dir: 'planning', file: 'SalesForecastPage', title: 'Sales Forecast', purpose: 'Review and adjust sales forecasts by SKU, customer, and period for demand planning.', data: 'sales', cards: 'salesSummaryCards' },
  { dir: 'planning', file: 'StockPlanningPage', title: 'Stock Planning', purpose: 'Plan replenishment based on forecast, safety stock, and lead time parameters.', data: 'inventory', cards: 'inventorySummaryCards' },
  { dir: 'planning', file: 'ATPWorkbenchPage', title: 'ATP Workbench', purpose: 'Calculate and review available-to-promise quantities across warehouses.', data: 'inventory', cards: 'inventorySummaryCards' },
  { dir: 'planning', file: 'DemandPlanPage', title: 'Demand Plan', purpose: 'Consolidate forecast, open orders, and consignment demand into a unified plan.', data: 'inventory', cards: 'inventorySummaryCards' },

  // Inventory
  { dir: 'inventory', file: 'StockBalancePage', title: 'Stock Balance', purpose: 'Real-time view of on-hand, reserved, and available quantities by SKU and location.', data: 'inventory', cards: 'inventorySummaryCards' },
  { dir: 'inventory', file: 'StockMovementPage', title: 'Stock Movement', purpose: 'Track inbound, outbound, and internal stock movements across the supply chain.', data: 'inventory', cards: 'inventorySummaryCards' },
  { dir: 'inventory', file: 'InventoryLedgerPage', title: 'Inventory Ledger', purpose: 'Audit trail of all inventory transactions with before/after balances.', data: 'inventory', cards: 'inventorySummaryCards' },

  // WMS
  { dir: 'wms', file: 'WMSDashboardPage', title: 'WMS Dashboard', purpose: 'Warehouse operations overview — receiving, putaway, picking, and dispatch workload.', data: 'wms', cards: 'wmsSummaryCards' },
  { dir: 'wms', file: 'ReceivingPage', title: 'Receiving', purpose: 'Goods receipt against purchase orders with QC and lot capture.', data: 'wms', cards: 'wmsSummaryCards' },
  { dir: 'wms', file: 'PutawayPage', title: 'Putaway', purpose: 'Assign received goods to storage locations following putaway rules.', data: 'wms', cards: 'wmsSummaryCards' },
  { dir: 'wms', file: 'TransferPage', title: 'Transfer', purpose: 'Move stock between locations or warehouses with transfer order tracking.', data: 'wms', cards: 'wmsSummaryCards' },
  { dir: 'wms', file: 'PickingPage', title: 'Picking', purpose: 'Execute pick lists for sales orders with wave and batch picking support.', data: 'wms', cards: 'wmsSummaryCards' },
  { dir: 'wms', file: 'DispatchPage', title: 'Dispatch', purpose: 'Confirm loading, generate delivery documents, and release goods from warehouse.', data: 'wms', cards: 'wmsSummaryCards' },
  { dir: 'wms', file: 'StockCountPage', title: 'Stock Count', purpose: 'Cycle count and full physical inventory count with variance reconciliation.', data: 'wms', cards: 'wmsSummaryCards' },
  { dir: 'wms', file: 'StockAdjustmentPage', title: 'Stock Adjustment', purpose: 'Adjust inventory for damage, expiry, or system correction with approval workflow.', data: 'wms', cards: 'wmsSummaryCards' },
  { dir: 'wms', file: 'BarcodeScanPage', title: 'Barcode Scan', purpose: 'Mobile-friendly scan interface for receiving, picking, and stock count operations.', data: 'wms', cards: 'wmsSummaryCards' },

  // Consignment
  { dir: 'consignment', file: 'ConsignmentDashboardPage', title: 'Consignment Dashboard', purpose: 'Overview of branch stock levels, sales, and pending returns across consignment network.', data: 'consignment', cards: 'consignmentSummaryCards' },
  { dir: 'consignment', file: 'BranchStockPage', title: 'Branch Stock', purpose: 'View and manage consignment inventory held at branch locations.', data: 'consignment', cards: 'consignmentSummaryCards' },
  { dir: 'consignment', file: 'ConsignmentSOPage', title: 'Consignment Sales Order', purpose: 'Create and track consignment sales orders for branch replenishment.', data: 'consignment', cards: 'consignmentSummaryCards' },
  { dir: 'consignment', file: 'ConsignmentMovementPage', title: 'Consignment Movement', purpose: 'Record stock movements between DC and consignment branches.', data: 'consignment', cards: 'consignmentSummaryCards' },
  { dir: 'consignment', file: 'ConsignmentReturnCNPage', title: 'Consignment Return / CN', purpose: 'Process branch returns and credit notes for unsold consignment stock.', data: 'consignment', cards: 'consignmentSummaryCards' },

  // Sample / Consumable
  { dir: 'sample-consumable', file: 'SampleRequestPage', title: 'Sample Request', purpose: 'Request product samples for customer demos, trials, or marketing activities.', data: 'master', cards: 'masterSummaryCards', rows: 'mockProducts', columns: 'productColumns' },
  { dir: 'sample-consumable', file: 'ConsumableRequestPage', title: 'Consumable Request', purpose: 'Request internal consumables for operations, QC, or packaging use.', data: 'master', cards: 'masterSummaryCards', rows: 'mockProducts', columns: 'productColumns' },
  { dir: 'sample-consumable', file: 'ApprovalPage', title: 'Approval', purpose: 'Review and approve pending sample and consumable requests.', data: 'master', cards: 'masterSummaryCards', rows: 'mockProducts', columns: 'productColumns' },
  { dir: 'sample-consumable', file: 'IssueConfirmPage', title: 'Issue Confirm', purpose: 'Confirm physical issue of approved samples/consumables from warehouse.', data: 'inventory', cards: 'inventorySummaryCards' },
  { dir: 'sample-consumable', file: 'UsageReportPage', title: 'Usage Report', purpose: 'Report on sample and consumable usage by department, customer, and period.', data: 'master', cards: 'masterSummaryCards', rows: 'mockProducts', columns: 'productColumns' },

  // Master Data
  { dir: 'master-data', file: 'ProductMasterPage', title: 'Product Master', purpose: 'Maintain SKU master data including attributes, UOM, and barcode mappings.', data: 'master', cards: 'masterSummaryCards', rows: 'mockProducts', columns: 'productColumns' },
  { dir: 'master-data', file: 'CustomerMasterPage', title: 'Customer Master', purpose: 'Manage customer profiles, channels, credit terms, and delivery preferences.', data: 'master', cards: 'masterSummaryCards', rows: 'mockCustomers', columns: 'customerColumns' },
  { dir: 'master-data', file: 'BranchMasterPage', title: 'Branch Master', purpose: 'Configure consignment branch locations and regional assignments.', data: 'master', cards: 'masterSummaryCards', rows: 'mockBranches', columns: 'branchColumns' },
  { dir: 'master-data', file: 'WarehouseMasterPage', title: 'Warehouse Master', purpose: 'Define warehouses, storage types, and capacity parameters.', data: 'master', cards: 'masterSummaryCards', rows: 'mockWarehouses', columns: 'warehouseColumns' },
  { dir: 'master-data', file: 'LocationMasterPage', title: 'Location Master', purpose: 'Manage bin/rack locations within warehouses for WMS operations.', data: 'inventory', cards: 'inventorySummaryCards' },
  { dir: 'master-data', file: 'UOMConversionPage', title: 'UOM Conversion', purpose: 'Define unit-of-measure conversion factors between base and alternate UOMs.', data: 'master', cards: 'masterSummaryCards', rows: 'mockProducts', columns: 'productColumns' },
  { dir: 'master-data', file: 'SKUAliasPage', title: 'SKU Alias', purpose: 'Map alternate SKU codes, customer-specific codes, and legacy identifiers.', data: 'master', cards: 'masterSummaryCards', rows: 'mockProducts', columns: 'productColumns' },

  // Reports
  { dir: 'reports', file: 'SalesStockReportPage', title: 'Sales & Stock Report', purpose: 'Combined view of sales performance and stock levels by SKU and period.', data: 'sales', cards: 'salesSummaryCards' },
  { dir: 'reports', file: 'ShortageReportPage', title: 'Shortage Report', purpose: 'Historical and current shortage analysis for planning and procurement.', data: 'sales', cards: 'salesSummaryCards' },
  { dir: 'reports', file: 'ConsignmentReportPage', title: 'Consignment Report', purpose: 'Branch-level consignment sales, stock aging, and return analysis.', data: 'consignment', cards: 'consignmentSummaryCards' },
  { dir: 'reports', file: 'SampleUsageReportPage', title: 'Sample Usage Report', purpose: 'Track sample issuance, conversion rates, and cost allocation.', data: 'master', cards: 'masterSummaryCards', rows: 'mockProducts', columns: 'productColumns' },

  // Admin
  { dir: 'admin', file: 'UserPage', title: 'User Management', purpose: 'Manage system users, department assignments, and account status.', data: 'master', cards: 'masterSummaryCards', rows: 'mockCustomers', columns: 'customerColumns' },
  { dir: 'admin', file: 'RolePermissionPage', title: 'Roles & Permissions', purpose: 'Configure role-based access control for modules and actions.', data: 'master', cards: 'masterSummaryCards', rows: 'mockCustomers', columns: 'customerColumns' },
  { dir: 'admin', file: 'AuditLogPage', title: 'Audit Log', purpose: 'Review system audit trail for data changes and user actions.', data: 'master', cards: 'masterSummaryCards', rows: 'mockCustomers', columns: 'customerColumns' },
  { dir: 'admin', file: 'SyncMonitorPage', title: 'Sync Monitor', purpose: 'Monitor integration sync status between Supabase, Express ERP, and WMS.', data: 'master', cards: 'masterSummaryCards', rows: 'mockCustomers', columns: 'customerColumns' },
];

const dataImports = {
  sales: {
    import: "import { mockSalesOrders, salesOrderColumns, salesSummaryCards } from '../../data/mockSalesOrders.js';",
    rows: 'mockSalesOrders',
    columns: 'salesOrderColumns',
    cards: 'salesSummaryCards',
  },
  inventory: {
    import: "import { mockInventory, inventoryColumns, inventorySummaryCards } from '../../data/mockInventory.js';",
    rows: 'mockInventory',
    columns: 'inventoryColumns',
    cards: 'inventorySummaryCards',
  },
  wms: {
    import: "import { mockWmsTasks, wmsColumns, wmsSummaryCards } from '../../data/mockWms.js';",
    rows: 'mockWmsTasks',
    columns: 'wmsColumns',
    cards: 'wmsSummaryCards',
  },
  consignment: {
    import: "import { mockConsignment, consignmentColumns, consignmentSummaryCards } from '../../data/mockConsignment.js';",
    rows: 'mockConsignment',
    columns: 'consignmentColumns',
    cards: 'consignmentSummaryCards',
  },
  master: {
    import: "import { mockProducts, productColumns, masterSummaryCards } from '../../data/mockMasterData.js';",
    rows: 'mockProducts',
    columns: 'productColumns',
    cards: 'masterSummaryCards',
  },
};

// Add branch/warehouse columns to mockMasterData if missing
const masterDataPath = path.join(root, 'src/data/mockMasterData.js');
let masterContent = fs.readFileSync(masterDataPath, 'utf8');
if (!masterContent.includes('branchColumns')) {
  masterContent = masterContent.replace(
    'export default {',
    `export const branchColumns = [
  { key: 'branchCode', label: 'Branch Code' },
  { key: 'branchName', label: 'Branch Name' },
  { key: 'region', label: 'Region' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
];

export const warehouseColumns = [
  { key: 'warehouseCode', label: 'Warehouse Code' },
  { key: 'warehouseName', label: 'Warehouse Name' },
  { key: 'type', label: 'Type' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'status', label: 'Status' },
];

export default {`
  );
  fs.writeFileSync(masterDataPath, masterContent);
}

for (const page of pages) {
  const cfg = dataImports[page.data];
  const rows = page.rows ?? cfg.rows;
  const columns = page.columns ?? cfg.columns;
  const cards = page.cards ?? cfg.cards;

  let extraImport = '';
  if (page.rows && page.data === 'master') {
    extraImport = `\nimport { ${page.rows}, ${page.columns} } from '../../data/mockMasterData.js';`;
    if (page.rows !== 'mockProducts') {
      // replace default import
    }
  }
  if (page.rows === 'mockCustomers') {
    extraImport = "\nimport { mockCustomers, customerColumns } from '../../data/mockMasterData.js';";
  }
  if (page.rows === 'mockBranches') {
    extraImport = "\nimport { mockBranches, branchColumns } from '../../data/mockMasterData.js';";
  }
  if (page.rows === 'mockWarehouses') {
    extraImport = "\nimport { mockWarehouses, warehouseColumns } from '../../data/mockMasterData.js';";
  }

  const importLine = page.rows === 'mockCustomers' || page.rows === 'mockBranches' || page.rows === 'mockWarehouses'
    ? `import { ${cards} } from '../../data/mockMasterData.js';${extraImport}`
    : page.rows && page.data === 'master' && page.rows !== 'mockProducts'
      ? cfg.import.replace('mockProducts, productColumns', `${rows}, ${columns}`).replace('masterSummaryCards', cards)
      : cfg.import;

  const content = `${importLine}
import MockupPageShell from '../../components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '../../components/mockup/pageDefaults.js';

export default function ${page.file}() {
  return (
    <MockupPageShell
      title="${page.title}"
      purpose="${page.purpose}"
      summaryCards={${cards}}
      columns={${columns}}
      rows={${rows}}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: ${page.title} — validate field labels and action buttons with stakeholders.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        '${page.title}: business rules to be finalized with operations team.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Wire ${page.title} to real data source after mockup UAT approval.',
      ]}
    />
  );
}
`;

  const dirPath = path.join(root, 'src/features', page.dir);
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, `${page.file}.jsx`), content);
}

console.log(`Generated ${pages.length} page files.`);
