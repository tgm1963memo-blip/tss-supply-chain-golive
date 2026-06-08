# 02 — Function Status Matrix

Legend: **MOCK** = static UI with sample data | **PLAN** = designed, not built | **LIVE** = production-ready (requires Supabase env)

| Module | Screen | Route | Status | Data Source |
|--------|--------|-------|--------|-------------|
| Executive | Management Dashboard | `/executive/management` | MOCK | mockSalesOrders |
| Sales | Sales Order List | `/sales/orders` | LIVE | sc_so_reservation_candidate_view |
| Sales | Sales Order Detail | `/sales/orders/:orderId` | LIVE | sc_so_reservation_candidate_view |
| Planning | Reservation Workbench | `/planning/reservation` | LIVE | reservationService (safe mode) |
| Planning | Shortage Review | `/planning/shortage-review` | LIVE | demandPlanningService |
| Planning | Demand Plan | `/planning/demand` | LIVE | sc_so_pick_pack_candidate_view |
| Planning | ATP Workbench | `/planning/atp` | MOCK | mockInventory |
| Inventory | Stock Balance | `/warehouse/inventory/balance` | LIVE | sc_inventory_balance_view |
| Inventory | Available Stock | `/warehouse/inventory/available` | LIVE | tgd_withdrawal_allocations |
| Inventory | Stock Movement | `/warehouse/inventory/movement` | LIVE | sc_inventory_ledger |
| Inventory | Inventory Ledger | `/warehouse/inventory/ledger` | LIVE | tgd_inventory_movements |
| Inventory | Stock Adjustment | `/warehouse/inventory/adjustment` | MOCK | operations-preview (stock-adjust) |
| Inventory | Cycle Count | `/warehouse/inventory/cycle-count` | LIVE | tgd_stock_count_documents |
| Inventory | Lot / Expiry Control | `/warehouse/inventory/lot-expiry` | LIVE | tgd_stock_balances |
| WMS | WMS Dashboard | `/warehouse/wms` | MOCK | operations-preview (warehouse-dashboard) |
| WMS | Receiving | `/warehouse/wms/receiving` | LIVE | tgd_receiving_documents |
| WMS | Putaway | `/warehouse/wms/putaway` | LIVE | tgd_putaway_documents |
| WMS | Transfer | `/warehouse/wms/transfer` | LIVE | tgd_transfer_documents |
| WMS | Picking & Packing | `/warehouse/wms/picking-packing` | LIVE | WMS picking + SO pick-pack candidates |
| WMS | Dispatch / Goods Issue | `/warehouse/wms/dispatch-goods-issue` | LIVE | dispatch + outbound documents |
| WMS | Scan Center | `/warehouse/wms/scan-center` | MOCK | HandheldScanHub (UI only) |
| WMS | Handheld Operations | `/warehouse/wms/handheld` | LIVE | handheld session lists |
| Consignment | Dashboard | `/consignment` | MOCK | operations-preview (modern-trade-stock) |
| Consignment | Branch Stock | `/consignment/branch-stock` | MOCK | operations-preview (modern-trade-stock) |
| Consignment | Consignment SO | `/consignment/so` | MOCK | operations-preview (modern-trade-stock) |
| Consignment | Movement | `/consignment/movement` | MOCK | operations-preview (modern-trade-stock) |
| Consignment | Sell-out Record | `/consignment/sell-out` | MOCK | operations-preview (modern-trade-stock) |
| Consignment | Return from Branch | `/consignment/return-from-branch` | MOCK | operations-preview (modern-trade-stock) |
| Consignment | Return / CN | `/consignment/return-cn` | MOCK | operations-preview (modern-trade-stock) |
| Master Data | Product Master | `/master-data/products` | LIVE | sc_products |
| Master Data | SKU Settings | `/master-data/sku-settings` | MOCK | operations-preview (product-mapping) |
| Master Data | SKU Alias | `/master-data/sku-alias` | MOCK | operations-preview (product-mapping) |
| Master Data | UOM Conversion | `/master-data/uom` | LIVE | sc_product_uom_conversion |
| Master Data | Customer Master | `/master-data/customers` | LIVE | sc_customers |
| Master Data | Customer Branch | `/master-data/customer-branch` | MOCK | mockMasterData |
| Master Data | Warehouse Master | `/master-data/warehouses` | LIVE | sc_warehouses |
| Master Data | Location Master | `/master-data/locations` | LIVE | tgd_locations |
| Master Data | Room / Company | `/master-data/room-company` | MOCK | mockMasterData |

## Backend Integration Status

| Integration | Status | Notes |
|-------------|--------|-------|
| Supabase | LIVE | Client initialized; requires `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` |
| Express ERP | PLAN | Read via sc_express_* tables; no write-back |
| WMS Hardware | MOCK | Scan Center / Handheld UI only — no scan write-back |
| Auth / RBAC | PLAN | Admin screens deferred; no login gate |
