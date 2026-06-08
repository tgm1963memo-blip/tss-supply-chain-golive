import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

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

const newPages = [
  // Executive Dashboard
  { dir: 'executive', file: 'ManagementDashboardPage', title: 'Management Dashboard', purpose: 'Executive control tower for KPIs across sales, inventory, fulfillment, and consignment.', data: 'sales' },
  { dir: 'executive', file: 'SalesOverviewPage', title: 'Sales Overview', purpose: 'Executive sales performance snapshot — orders, revenue, and fulfillment rate.', data: 'sales' },
  { dir: 'executive', file: 'StockOverviewPage', title: 'Stock Overview', purpose: 'Executive inventory health — on-hand value, turnover, and zero-stock alerts.', data: 'inventory' },
  { dir: 'executive', file: 'ShortageOverviewPage', title: 'Shortage Overview', purpose: 'Executive view of active shortages impacting customer delivery commitments.', data: 'sales' },
  { dir: 'executive', file: 'OrderFulfillmentPage', title: 'Order Fulfillment', purpose: 'Track order-to-dispatch pipeline status and SLA compliance.', data: 'sales' },
  { dir: 'executive', file: 'CONSIOverviewPage', title: 'CONSI Overview', purpose: 'Executive consignment network summary — branch stock, sell-out, and returns.', data: 'consignment' },

  // Sales (new)
  { dir: 'sales', file: 'SalesOverviewPage', title: 'Sales Overview', purpose: 'Operational sales dashboard for daily order monitoring and team workload.', data: 'sales' },
  { dir: 'sales', file: 'CustomerRegistrationPage', title: 'Customer Registration', purpose: 'Register new customers with approval workflow before master data activation.', data: 'master' },
  { dir: 'sales', file: 'CustomerMapPage', title: 'Customer Map', purpose: 'Visual map of customer locations, branches, and delivery zones.', data: 'master' },
  { dir: 'sales', file: 'SampleConsumablePage', title: 'Sample & Consumable', purpose: 'Unified hub for sample requests, consumable issues, approvals, and usage tracking.', data: 'master' },

  // Planning (new)
  { dir: 'planning', file: 'ShortageReviewPage', title: 'Shortage Review', purpose: 'Review and action shortage items from reservation and ATP calculations.', data: 'sales' },
  { dir: 'planning', file: 'ReservationSummaryPage', title: 'Reservation Summary', purpose: 'Summary of active reservations by warehouse, SKU, and sales order.', data: 'sales' },
  { dir: 'planning', file: 'ProductionPurchaseSuggestionPage', title: 'Production / Purchase Suggestion', purpose: 'Suggested production runs and purchase orders based on demand and stock gaps.', data: 'inventory' },

  // Warehouse inventory (new)
  { dir: 'warehouse/inventory', file: 'AvailableStockPage', title: 'Available Stock', purpose: 'View available-to-promise stock after reservations and holds.', data: 'inventory' },
  { dir: 'warehouse/inventory', file: 'LotExpiryControlPage', title: 'Lot / Expiry Control', purpose: 'Monitor lot numbers, expiry dates, and FEFO/FIFO compliance.', data: 'inventory' },

  // WMS consolidated (new)
  { dir: 'warehouse/wms', file: 'PickingPackingPage', title: 'Picking & Packing', purpose: 'Consolidated picking, packing, checking, and SO pick-pack confirmation (safe mode). Replaces separate Picking, Packing, Checking, SO Pick-Pack, Confirm Pick menus.', data: 'wms' },
  { dir: 'warehouse/wms', file: 'DispatchGoodsIssuePage', title: 'Dispatch / Goods Issue', purpose: 'Consolidated dispatch and goods issue posting. Replaces separate Dispatch and Goods Issue menus.', data: 'wms' },
  { dir: 'warehouse/wms', file: 'ScanCenterPage', title: 'Scan Center', purpose: 'Barcode scan hub for receiving, picking, and stock count. Replaces Barcode Scan menu.', data: 'wms' },
  { dir: 'warehouse/wms', file: 'HandheldOperationsPage', title: 'Handheld Operations', purpose: 'Mobile handheld workflows for receiving and putaway. Replaces separate Handheld Receiving and Handheld Putaway menus.', data: 'wms' },

  // Express weight (new — design only / safe mode)
  { dir: 'warehouse/express-weight', file: 'WeightCapturePage', title: 'Weight Capture', purpose: 'Capture consignment weight readings for Express write-back queue. SAFE MODE — design only, no DBF write.', data: 'wms' },
  { dir: 'warehouse/express-weight', file: 'WeightReviewPage', title: 'Weight Review', purpose: 'Review captured weights before queue submission. SAFE MODE — design only.', data: 'wms' },
  { dir: 'warehouse/express-weight', file: 'ExpressWeightQueuePage', title: 'Express Weight Queue', purpose: 'Pending Express weight write-back queue. SAFE MODE — no live DBF posting.', data: 'wms' },
  { dir: 'warehouse/express-weight', file: 'ExpressWeightSyncLogPage', title: 'Express Weight Sync Log', purpose: 'Historical log of Express weight sync attempts. SAFE MODE — read-only mock.', data: 'wms' },
  { dir: 'warehouse/express-weight', file: 'WeightErrorRetryPage', title: 'Weight Error / Retry', purpose: 'Failed weight sync errors and retry actions. SAFE MODE — design only.', data: 'wms' },

  // Consignment (new)
  { dir: 'consignment', file: 'SellOutRecordPage', title: 'Sell-out Record', purpose: 'Record branch sell-out quantities for consignment settlement.', data: 'consignment' },
  { dir: 'consignment', file: 'ReturnFromBranchPage', title: 'Return from Branch', purpose: 'Process stock returns from consignment branches to DC.', data: 'consignment' },

  // Master data (new)
  { dir: 'master-data', file: 'SKUSettingsPage', title: 'SKU Settings', purpose: 'Configure SKU attributes, storage type, and handling rules.', data: 'master' },
  { dir: 'master-data', file: 'CustomerBranchPage', title: 'Customer Branch', purpose: 'Maintain customer branch assignments and delivery points.', data: 'master' },
  { dir: 'master-data', file: 'RoomCompanyPage', title: 'Room / Company', purpose: 'Configure cold room and company entity mappings for warehouse operations.', data: 'master' },
];

function generatePage(page) {
  const cfg = dataImports[page.data];
  const depth = page.dir.split('/').length;
  const rel = '../'.repeat(depth + 1);
  return `${cfg.import.replace(/\.\.\/\.\.\//g, rel)}
import MockupPageShell from '${rel}components/mockup/MockupPageShell.jsx';
import {
  defaultWorkflowNotes,
  defaultBusinessRules,
  defaultNextSteps,
  defaultWorkflowSteps,
} from '${rel}components/mockup/pageDefaults.js';

export default function ${page.file}() {
  return (
    <MockupPageShell
      title="${page.title}"
      purpose="${page.purpose}"
      summaryCards={${cfg.cards}}
      columns={${cfg.columns}}
      rows={${cfg.rows}}
      workflowSteps={defaultWorkflowSteps}
      workflowNotes={[
        ...defaultWorkflowNotes,
        'Screen-specific: ${page.title} — menu regroup placeholder; source migration pending.',
      ]}
      businessRules={[
        ...defaultBusinessRules,
        '${page.title}: awaiting business rule sign-off before live integration.',
      ]}
      nextSteps={[
        ...defaultNextSteps,
        'Migrate approved function from source project per docs/07_FUNCTION_REUSE_AND_MENU_REGROUP_MATRIX.md.',
      ]}
    />
  );
}
`;
}

let count = 0;
for (const page of newPages) {
  const dirPath = path.join(root, 'src/features', page.dir);
  fs.mkdirSync(dirPath, { recursive: true });
  const filePath = path.join(dirPath, `${page.file}.jsx`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, generatePage(page));
    count += 1;
  }
}

console.log(`Created ${count} new placeholder pages (${newPages.length} defined).`);
