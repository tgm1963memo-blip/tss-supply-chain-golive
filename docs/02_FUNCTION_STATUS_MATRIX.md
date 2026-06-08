# 02 — Function Status Matrix

Legend: **MOCK** = static UI with sample data | **PLAN** = designed, not built | **LIVE** = production-ready

| Module | Screen | Route | Status | Data Source |
|--------|--------|-------|--------|-------------|
| Dashboard | Dashboard | `/` | MOCK | mockSalesOrders |
| Sales | Sales Order List | `/sales/orders` | MOCK | mockSalesOrders |
| Sales | Sales Order Detail | `/sales/orders/:orderId` | MOCK | mockSalesOrders |
| Sales | Reservation Workbench | `/sales/reservation` | MOCK | mockSalesOrders |
| Sales | Shortage Alerts | `/sales/shortage` | MOCK | mockSalesOrders |
| Sales | Return / CN | `/sales/return-cn` | MOCK | mockSalesOrders |
| Planning | Sales Forecast | `/planning/forecast` | MOCK | mockSalesOrders |
| Planning | Stock Planning | `/planning/stock` | MOCK | mockInventory |
| Planning | ATP Workbench | `/planning/atp` | MOCK | mockInventory |
| Planning | Demand Plan | `/planning/demand` | MOCK | mockInventory |
| Inventory | Stock Balance | `/inventory/balance` | MOCK | mockInventory |
| Inventory | Stock Movement | `/inventory/movement` | MOCK | mockInventory |
| Inventory | Inventory Ledger | `/inventory/ledger` | MOCK | mockInventory |
| WMS | WMS Dashboard | `/wms` | MOCK | mockWms |
| WMS | Receiving | `/wms/receiving` | MOCK | mockWms |
| WMS | Putaway | `/wms/putaway` | MOCK | mockWms |
| WMS | Transfer | `/wms/transfer` | MOCK | mockWms |
| WMS | Picking | `/wms/picking` | MOCK | mockWms |
| WMS | Dispatch | `/wms/dispatch` | MOCK | mockWms |
| WMS | Stock Count | `/wms/stock-count` | MOCK | mockWms |
| WMS | Stock Adjustment | `/wms/adjustment` | MOCK | mockWms |
| WMS | Barcode Scan | `/wms/barcode` | MOCK | mockWms |
| Consignment | Dashboard | `/consignment` | MOCK | mockConsignment |
| Consignment | Branch Stock | `/consignment/branch-stock` | MOCK | mockConsignment |
| Consignment | Consignment SO | `/consignment/so` | MOCK | mockConsignment |
| Consignment | Movement | `/consignment/movement` | MOCK | mockConsignment |
| Consignment | Return / CN | `/consignment/return-cn` | MOCK | mockConsignment |
| Sample | Sample Request | `/sample-consumable/sample` | MOCK | mockMasterData |
| Sample | Consumable Request | `/sample-consumable/consumable` | MOCK | mockMasterData |
| Sample | Approval | `/sample-consumable/approval` | MOCK | mockMasterData |
| Sample | Issue Confirm | `/sample-consumable/issue` | MOCK | mockInventory |
| Sample | Usage Report | `/sample-consumable/usage` | MOCK | mockMasterData |
| Master Data | Product Master | `/master-data/products` | MOCK | mockMasterData |
| Master Data | Customer Master | `/master-data/customers` | MOCK | mockMasterData |
| Master Data | Branch Master | `/master-data/branches` | MOCK | mockMasterData |
| Master Data | Warehouse Master | `/master-data/warehouses` | MOCK | mockMasterData |
| Master Data | Location Master | `/master-data/locations` | MOCK | mockInventory |
| Master Data | UOM Conversion | `/master-data/uom` | MOCK | mockMasterData |
| Master Data | SKU Alias | `/master-data/sku-alias` | MOCK | mockMasterData |
| Reports | Sales & Stock | `/reports/sales-stock` | MOCK | mockSalesOrders |
| Reports | Shortage | `/reports/shortage` | MOCK | mockSalesOrders |
| Reports | Consignment | `/reports/consignment` | MOCK | mockConsignment |
| Reports | Sample Usage | `/reports/sample-usage` | MOCK | mockMasterData |
| Admin | Users | `/admin/users` | MOCK | mockMasterData |
| Admin | Roles & Permissions | `/admin/roles` | MOCK | mockMasterData |
| Admin | Audit Log | `/admin/audit` | MOCK | mockMasterData |
| Admin | Sync Monitor | `/admin/sync` | MOCK | mockMasterData |

## Backend Integration Status

| Integration | Status | Notes |
|-------------|--------|-------|
| Supabase | PLAN | Client package installed, not initialized |
| Express ERP | PLAN | No API layer |
| WMS Hardware | PLAN | Barcode page is UI mockup only |
| Auth / RBAC | PLAN | Admin screens visible without login |
