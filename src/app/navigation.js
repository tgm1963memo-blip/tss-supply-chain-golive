import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  CalendarRange,
  Package,
  Warehouse,
  Store,
  FlaskConical,
  Database,
  BarChart3,
  Settings,
} from 'lucide-react';

export const navigationGroups = [
  {
    label: 'Overview',
    icon: LayoutDashboard,
    items: [{ label: 'Dashboard', path: '/' }],
  },
  {
    label: 'Sales',
    icon: ShoppingCart,
    items: [
      { label: 'Sales Orders', path: '/sales/orders' },
      { label: 'Order Detail', path: '/sales/orders/SO-2026-001' },
      { label: 'Reservation Workbench', path: '/sales/reservation' },
      { label: 'Shortage Alerts', path: '/sales/shortage' },
      { label: 'Return / CN', path: '/sales/return-cn' },
    ],
  },
  {
    label: 'Planning',
    icon: CalendarRange,
    items: [
      { label: 'Sales Forecast', path: '/planning/forecast' },
      { label: 'Stock Planning', path: '/planning/stock' },
      { label: 'ATP Workbench', path: '/planning/atp' },
      { label: 'Demand Plan', path: '/planning/demand' },
    ],
  },
  {
    label: 'Inventory',
    icon: Package,
    items: [
      { label: 'Stock Balance', path: '/inventory/balance' },
      { label: 'Stock Movement', path: '/inventory/movement' },
      { label: 'Inventory Ledger', path: '/inventory/ledger' },
    ],
  },
  {
    label: 'WMS',
    icon: Warehouse,
    items: [
      { label: 'WMS Dashboard', path: '/wms' },
      { label: 'Receiving', path: '/wms/receiving' },
      { label: 'Putaway', path: '/wms/putaway' },
      { label: 'Transfer', path: '/wms/transfer' },
      { label: 'Picking', path: '/wms/picking' },
      { label: 'Dispatch', path: '/wms/dispatch' },
      { label: 'Stock Count', path: '/wms/stock-count' },
      { label: 'Stock Adjustment', path: '/wms/adjustment' },
      { label: 'Barcode Scan', path: '/wms/barcode' },
    ],
  },
  {
    label: 'Consignment',
    icon: Store,
    items: [
      { label: 'Consignment Dashboard', path: '/consignment' },
      { label: 'Branch Stock', path: '/consignment/branch-stock' },
      { label: 'Consignment SO', path: '/consignment/so' },
      { label: 'Consignment Movement', path: '/consignment/movement' },
      { label: 'Consignment Return / CN', path: '/consignment/return-cn' },
    ],
  },
  {
    label: 'Sample / Consumable',
    icon: FlaskConical,
    items: [
      { label: 'Sample Request', path: '/sample-consumable/sample' },
      { label: 'Consumable Request', path: '/sample-consumable/consumable' },
      { label: 'Approval', path: '/sample-consumable/approval' },
      { label: 'Issue Confirm', path: '/sample-consumable/issue' },
      { label: 'Usage Report', path: '/sample-consumable/usage' },
    ],
  },
  {
    label: 'Master Data',
    icon: Database,
    items: [
      { label: 'Product Master', path: '/master-data/products' },
      { label: 'Customer Master', path: '/master-data/customers' },
      { label: 'Branch Master', path: '/master-data/branches' },
      { label: 'Warehouse Master', path: '/master-data/warehouses' },
      { label: 'Location Master', path: '/master-data/locations' },
      { label: 'UOM Conversion', path: '/master-data/uom' },
      { label: 'SKU Alias', path: '/master-data/sku-alias' },
    ],
  },
  {
    label: 'Reports',
    icon: BarChart3,
    items: [
      { label: 'Sales & Stock Report', path: '/reports/sales-stock' },
      { label: 'Shortage Report', path: '/reports/shortage' },
      { label: 'Consignment Report', path: '/reports/consignment' },
      { label: 'Sample Usage Report', path: '/reports/sample-usage' },
    ],
  },
  {
    label: 'Admin',
    icon: Settings,
    items: [
      { label: 'Users', path: '/admin/users' },
      { label: 'Roles & Permissions', path: '/admin/roles' },
      { label: 'Audit Log', path: '/admin/audit' },
      { label: 'Sync Monitor', path: '/admin/sync' },
    ],
  },
];

export const mobileNavItems = navigationGroups
  .filter((group) => group.label !== 'Overview')
  .slice(0, 5)
  .map((group) => ({
    label: group.label.split(' ')[0],
    path: group.items[0].path,
    icon: group.icon,
  }));

export default navigationGroups;
