import {
  LayoutDashboard,
  ShoppingCart,
  CalendarRange,
  Warehouse,
  Store,
  Database,
  Settings,
} from 'lucide-react';

/**
 * Final clean menu structure — Phase: menu + matrix preparation only.
 * Groups may use `items` (flat) or `subGroups` (nested).
 */
export const navigationGroups = [
  {
    label: 'Executive Dashboard',
    icon: LayoutDashboard,
    items: [
      { label: 'Management Dashboard', path: '/executive/management' },
      { label: 'Sales Overview', path: '/executive/sales-overview' },
      { label: 'Stock Overview', path: '/executive/stock-overview' },
      { label: 'Shortage Overview', path: '/executive/shortage-overview' },
      { label: 'Order Fulfillment', path: '/executive/order-fulfillment' },
      { label: 'CONSI Overview', path: '/executive/consi-overview' },
    ],
  },
  {
    label: 'Sales',
    icon: ShoppingCart,
    items: [
      { label: 'Sales Order', path: '/sales/orders' },
      { label: 'Sales Order Detail', path: '/sales/orders/SO-2026-001' },
      { label: 'Sales Forecast', path: '/sales/forecast' },
      { label: 'Sales Overview', path: '/sales/overview' },
      { label: 'Return / CN', path: '/sales/return-cn' },
      { label: 'Customer Registration', path: '/sales/customer-registration' },
      { label: 'Customer Map', path: '/sales/customer-map' },
      { label: 'Sample & Consumable', path: '/sales/sample-consumable' },
      { label: 'Promotion / เคาะราคาห้าง', path: '/sales/promotions' },
    ],
  },
  {
    label: 'Planning & Allocation',
    icon: CalendarRange,
    items: [
      { label: 'Demand Planning', path: '/planning/demand' },
      { label: 'Stock & Planning', path: '/planning/stock' },
      { label: 'ATP Workbench', path: '/planning/atp' },
      { label: 'Reservation Workbench', path: '/planning/reservation' },
      { label: 'Shortage Review', path: '/planning/shortage-review' },
      { label: 'Reservation Summary', path: '/planning/reservation-summary' },
      { label: 'Production / Purchase Suggestion', path: '/planning/production-purchase' },
    ],
  },
  {
    label: 'Warehouse',
    icon: Warehouse,
    subGroups: [
      {
        label: 'Inventory Control',
        items: [
          { label: 'Stock Balance', path: '/warehouse/inventory/balance' },
          { label: 'Available Stock', path: '/warehouse/inventory/available' },
          { label: 'Stock Movement', path: '/warehouse/inventory/movement' },
          { label: 'Inventory Ledger', path: '/warehouse/inventory/ledger' },
          { label: 'Stock Adjustment', path: '/warehouse/inventory/adjustment' },
          { label: 'Cycle Count', path: '/warehouse/inventory/cycle-count' },
          { label: 'Lot / Expiry Control', path: '/warehouse/inventory/lot-expiry' },
        ],
      },
      {
        label: 'WMS Operations',
        items: [
          { label: 'WMS Dashboard', path: '/warehouse/wms' },
          { label: 'Receiving', path: '/warehouse/wms/receiving' },
          { label: 'Putaway', path: '/warehouse/wms/putaway' },
          { label: 'Transfer', path: '/warehouse/wms/transfer' },
          { label: 'Picking & Packing', path: '/warehouse/wms/picking-packing' },
          { label: 'Dispatch / Goods Issue', path: '/warehouse/wms/dispatch-goods-issue' },
          { label: 'Scan Center', path: '/warehouse/wms/scan-center' },
          { label: 'Handheld Operations', path: '/warehouse/wms/handheld' },
        ],
      },
      {
        label: 'Express Weight Write-back',
        items: [
          { label: 'Weight Capture', path: '/warehouse/express-weight/capture' },
          { label: 'Weight Review', path: '/warehouse/express-weight/review' },
          { label: 'Express Weight Queue', path: '/warehouse/express-weight/queue' },
          { label: 'Express Weight Sync Log', path: '/warehouse/express-weight/sync-log' },
          { label: 'Weight Error / Retry', path: '/warehouse/express-weight/error-retry' },
        ],
      },
    ],
  },
  {
    label: 'Consignment / Modern Trade',
    icon: Store,
    items: [
      { label: 'CONSI Dashboard', path: '/consignment' },
      { label: 'Consignment SO', path: '/consignment/so' },
      { label: 'Branch Stock', path: '/consignment/branch-stock' },
      { label: 'Consignment Movement', path: '/consignment/movement' },
      { label: 'Sell-out Record', path: '/consignment/sell-out' },
      { label: 'Return from Branch', path: '/consignment/return-from-branch' },
      { label: 'CONSI Return / CN', path: '/consignment/return-cn' },
    ],
  },
  {
    label: 'Admin / Control',
    icon: Settings,
    items: [
      { label: 'System Control', path: '/admin/system-control' },
      { label: 'Express Sync Status', path: '/admin/sync-status' },
      { label: 'Data Sync Monitor', path: '/admin/data-sync-monitor' },
      { label: 'Read Model Refresh', path: '/admin/read-model-refresh' },
      { label: 'UAT Signoff', path: '/admin/uat-signoff' },
      { label: 'Issue Log', path: '/admin/issue-log' },
      { label: 'Governance Decision Register', path: '/admin/governance' },
    ],
  },
  {
    label: 'Master Data',
    icon: Database,
    items: [
      { label: 'Product Master', path: '/master-data/products' },
      { label: 'SKU Settings', path: '/master-data/sku-settings' },
      { label: 'SKU Alias', path: '/master-data/sku-alias' },
      { label: 'UOM Conversion', path: '/master-data/uom' },
      { label: 'Customer Master', path: '/master-data/customers' },
      { label: 'Customer Branch', path: '/master-data/customer-branch' },
      { label: 'Warehouse Master', path: '/master-data/warehouses' },
      { label: 'Location Master', path: '/master-data/locations' },
      { label: 'Room / Company', path: '/master-data/room-company' },
    ],
  },
];

/** Flatten all menu items for lookup helpers */
export function flattenNavItems(groups = navigationGroups) {
  const items = [];
  for (const group of groups) {
    if (group.items) {
      items.push(...group.items);
    }
    if (group.subGroups) {
      for (const sub of group.subGroups) {
        items.push(...sub.items);
      }
    }
  }
  return items;
}

export const mobileNavItems = [
  { label: 'Executive', path: '/executive/management', icon: LayoutDashboard },
  { label: 'Sales', path: '/sales/orders', icon: ShoppingCart },
  { label: 'Planning', path: '/planning/demand', icon: CalendarRange },
  { label: 'Warehouse', path: '/warehouse/wms', icon: Warehouse },
  { label: 'CONSI', path: '/consignment', icon: Store },
];

export default navigationGroups;
