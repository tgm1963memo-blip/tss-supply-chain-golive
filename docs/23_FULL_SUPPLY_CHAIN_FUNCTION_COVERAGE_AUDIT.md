# Full Supply Chain Function Coverage Audit

## Coverage Matrix

| Module | Legacy Function/Menu | Current Route/Page Exists | Current Sidebar/Menu Exists | Service/Read Model Exists | Status | Action Required |
|---|---|---|---|---|---|---|
| Executive Dashboard | Management Dashboard | Yes | Yes | Yes | COMPLETE | None |
| Executive Dashboard | Sales Overview | Yes | Yes | Yes | COMPLETE | None |
| Executive Dashboard | Stock Overview | Yes | Yes | Yes | COMPLETE | None |
| Executive Dashboard | Shortage Overview | Yes | Yes | Yes | COMPLETE | None |
| Executive Dashboard | Order Fulfillment | Yes | Yes | Yes | COMPLETE | None |
| Executive Dashboard | CONSI Overview | Yes | Yes | Yes | COMPLETE | None |
| Sales | Sales Order | Yes | Yes | No (missing service) | PARTIAL | Create salesOrderService shell |
| Sales | Sales Order Detail | Yes | Yes | No (missing service) | PARTIAL | Create salesOrderLineService shell |
| Sales | Sales Forecast | Yes | Yes | No (missing service) | PARTIAL | Create salesForecastService shell |
| Sales | Sales Overview | Yes | Yes | Yes | COMPLETE | None |
| Sales | Return / CN | Yes | Yes | No (missing service) | PARTIAL | Create returnCnService shell |
| Sales | Customer Registration | Yes | Yes | Yes | COMPLETE | None |
| Sales | Customer Map | Yes | Yes | Yes | COMPLETE | None |
| Sales | Sample & Consumable | Yes | Yes | No (missing service) | PARTIAL | Create sampleConsumableService shell |
| Planning & Allocation | Demand Planning | Yes | Yes | Yes | COMPLETE | None |
| Planning & Allocation | Stock & Planning | Yes | Yes | Yes | COMPLETE | None |
| Planning & Allocation | ATP Workbench | Yes | Yes | Yes | COMPLETE | None |
| Planning & Allocation | Reservation Workbench | Yes | Yes | Yes | BLOCKED_BY_GOVERNANCE | None |
| Planning & Allocation | Shortage Review | Yes | Yes | No (missing service) | PARTIAL | Create shortageService shell |
| Planning & Allocation | Reservation Summary | Yes | Yes | Yes | READ_ONLY | None |
| Planning & Allocation | Production / Purchase Suggestion | Yes | Yes | Yes | DESIGN_ONLY | None |
| Warehouse - Inventory Control | Stock Balance | Yes | Yes | Yes | COMPLETE | None |
| Warehouse - Inventory Control | Available Stock | Yes | Yes | No (missing service) | PARTIAL | Create availableStockService shell |
| Warehouse - Inventory Control | Stock Movement | Yes | Yes | Yes | COMPLETE | None |
| Warehouse - Inventory Control | Inventory Ledger | Yes | Yes | No (missing service) | PARTIAL | Create inventoryLedgerService shell |
| Warehouse - Inventory Control | Stock Adjustment | Yes | Yes | Yes | READ_ONLY | None |
| Warehouse - Inventory Control | Cycle Count | Yes | Yes | Yes | READ_ONLY | None |
| Warehouse - Inventory Control | Lot / Expiry Control | Yes | Yes | Yes | COMPLETE | None |
| Warehouse - WMS Operations | WMS Dashboard | Yes | Yes | No (missing service) | PARTIAL | Create wmsService shell |
| Warehouse - WMS Operations | Receiving | Yes | Yes | Yes | COMPLETE | None |
| Warehouse - WMS Operations | Putaway | Yes | Yes | Yes | COMPLETE | None |
| Warehouse - WMS Operations | Transfer | Yes | Yes | Yes | COMPLETE | None |
| Warehouse - WMS Operations | Picking & Packing | Yes | Yes | Yes | COMPLETE | None |
| Warehouse - WMS Operations | Dispatch / Goods Issue | Yes | Yes | Yes | COMPLETE | None |
| Warehouse - WMS Operations | Scan Center | Yes | Yes | Yes | COMPLETE | None |
| Warehouse - WMS Operations | Handheld Operations | Yes | Yes | Yes | COMPLETE | None |
| Warehouse - Express Weight | Weight Capture | Yes | Yes | Yes | DESIGN_ONLY | None |
| Warehouse - Express Weight | Weight Review | Yes | Yes | Yes | DESIGN_ONLY | None |
| Warehouse - Express Weight | Express Weight Queue | Yes | Yes | Yes | DESIGN_ONLY | None |
| Warehouse - Express Weight | Express Weight Sync Log | Yes | Yes | Yes | DESIGN_ONLY | None |
| Warehouse - Express Weight | Weight Error / Retry | Yes | Yes | Yes | DESIGN_ONLY | None |
| Consignment / Modern Trade | CONSI Dashboard | Yes | Yes | Yes | COMPLETE | None |
| Consignment / Modern Trade | Consignment SO | Yes | Yes | No (missing service) | PARTIAL | Create consignmentService shell |
| Consignment / Modern Trade | Branch Stock | Yes | Yes | No (missing service) | PARTIAL | Create branchStockService shell |
| Consignment / Modern Trade | Consignment Movement | Yes | Yes | Yes | COMPLETE | None |
| Consignment / Modern Trade | Sell-out Record | Yes | Yes | Yes | COMPLETE | None |
| Consignment / Modern Trade | Return from Branch | Yes | Yes | Yes | COMPLETE | None |
| Consignment / Modern Trade | CONSI Return / CN | Yes | Yes | Yes | COMPLETE | None |
| Master Data | Product Master | Yes | Yes | Yes | COMPLETE | None |
| Master Data | SKU Settings | Yes | Yes | Yes | COMPLETE | None |
| Master Data | SKU Alias | Yes | Yes | Yes | COMPLETE | None |
| Master Data | UOM Conversion | Yes | Yes | Yes | COMPLETE | None |
| Master Data | Customer Master | Yes | Yes | Yes | COMPLETE | None |
| Master Data | Customer Branch | Yes | Yes | Yes | COMPLETE | None |
| Master Data | Warehouse Master | Yes | Yes | Yes | COMPLETE | None |
| Master Data | Location Master | Yes | Yes | Yes | COMPLETE | None |
| Master Data | Room / Company | Yes | Yes | Yes | COMPLETE | None |
| System / Admin | System Control | Yes | Yes | Yes | COMPLETE | None |
| System / Admin | Express Sync Status | No | No | Yes | MISSING | Create page, route, menu |
| System / Admin | Data Sync Monitor | No | No | No | MISSING | Create page, route, menu |
| System / Admin | Read Model Refresh | No | No | No | MISSING | Create page, route, menu |
| System / Admin | UAT Signoff | No | No | Yes | MISSING | Create page, route, menu |
| System / Admin | Issue Log | No | No | Yes | MISSING | Create page, route, menu |
| System / Admin | Governance Decision Register | No | No | No | MISSING | Create page, route, menu, service shell |

## Summary of Actions
1. Implement 6 missing pages in `src/features/admin/`
2. Update `src/app/routes.jsx` and `src/app/navigation.js` to expose these 6 new admin pages
3. Create service shells for the MISSING or PARTIAL status items to prevent UI crashes if functions try to access Supabase.
