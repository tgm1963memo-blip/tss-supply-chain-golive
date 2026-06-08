# 07 — Function Reuse and Menu Regroup Matrix

> **Phase 2A (Sales):** Sales module migration completed 2026-06-08. See [Sales Migration Summary](#phase-2a-sales-migration-summary) below.  
> **Phase 2D (Warehouse Inventory Control):** Inventory module migration completed 2026-06-08. See [Inventory Migration Summary](#phase-2d--warehouse-inventory-control-migration-summary) below.  
> **Phase 2E (WMS Operations):** WMS operations migration completed 2026-06-08. See [WMS Operations Migration Summary](#phase-2e--wms-operations-migration-summary) below.  
> **Phase 2F (Consignment):** Consignment module migration completed 2026-06-08. See [Consignment Migration Summary](#phase-2f--consignment-migration-summary) below.  
> **Phase 2G (Master Data):** Master data migration completed 2026-06-08. See [Master Data Migration Summary](#phase-2g--master-data-migration-summary) below.  
> **Phase 2I (Express Weight Write-back):** Design-only safe mode completed 2026-06-08. See [Phase 2I Summary](#phase-2i--express-weight-write-back-design-summary) and `docs/08_EXPRESS_WEIGHT_WRITEBACK_DESIGN.md`.  
> **Phase 2H (Executive Dashboard):** Executive Dashboard migration completed 2026-06-08. See [Phase 2H Summary](#phase-2h--executive-dashboard-migration-summary) below.  
> **Phase 2C (Planning):** Planning module migration completed 2026-06-08. See [Planning Migration Summary](#phase-2c-planning-migration-summary) below.  
> **Target:** `tss-supply-chain-golive`  
> **Sources:** `tss-supply-chain-management` (SCM), `TGD WMS` (WMS)

## Legend

| Reuse Level | Meaning |
|-------------|---------|
| **Direct** | Copy/adapt page + service with minimal changes |
| **Adapt** | Reuse logic but change layout, routes, or data layer |
| **Mock Only** | No approved source yet — keep mockup placeholder |
| **Exclude** | Do not migrate (deprecated, duplicate, or high risk) |

| Migration Status | Meaning |
|----------------|---------|
| **Menu Only** | Route + placeholder created; no source migration |
| **Pending** | Approved for next migration sprint |
| **Migrated** | Source UI/service copied; build verified (Phase 2A+) |
| **Mock Only** | No approved source — mockup fallback retained |
| **Blocked** | Cannot migrate yet (missing source, dependency, or config) |

---

## WMS Duplicate Consolidation Summary

| Final Menu Function | Consolidated From (Original Names) | Source Projects |
|---------------------|-----------------------------------|-----------------|
| **Picking & Packing** | Picking, Packing, Checking, SO Pick-Pack, Confirm Pick Safe Mode, PickListCandidatePage | SCM + WMS |
| **Dispatch / Goods Issue** | Dispatch, Goods Issue, OutboundListPage, OutboundDraftPage | SCM + WMS |
| **Scan Center** | Barcode Scan, BarcodeInputPlaceholder | WMS |
| **Handheld Operations** | Handheld Receiving, Handheld Putaway, HandheldPage | WMS |

Underlying function names remain documented in rows below for migration traceability.

---

## Matrix

| Final Menu Group | Sub Group | Final Menu Function | Original Function Name | Source Project | Source File | Target File | Reuse Level | Risk | Safe Mode | Express WB | Duplicate Consolidation Note | Migration Note | Status |
|------------------|-----------|---------------------|------------------------|----------------|-------------|-------------|-------------|------|-----------|------------|------------------------------|----------------|--------|
| Executive Dashboard | — | Management Dashboard | DashboardPage | SCM | `src/modules/reports/pages/DashboardPage.jsx` + `dashboardService.js` | `src/features/executive/ManagementDashboardPage.jsx` | Adapt | Low | Yes | No | — | Aggregated KPIs + pipeline from live Supabase views; read-only safe mode | **Migrated** |
| Executive Dashboard | — | Sales Overview | ReportsPage / sales-dashboard (menu only) | SCM | `src/modules/reports/pages/ReportsPage.jsx` + `dashboardService.js` (`getSalesDashboardMetrics`) | `src/features/executive/SalesOverviewPage.jsx` | Adapt | Low | Yes | No | — | Same Sales Dashboard tab as Sales module overview | **Migrated** |
| Executive Dashboard | — | Stock Overview | ReportsPage inventory tab | SCM | `ReportsPage.jsx` + `dashboardService.js` (`getInventoryDashboardMetrics`) | `src/features/executive/StockOverviewPage.jsx` | Adapt | Low | Yes | No | — | sc_inventory_balance_view summary + shortage lists | **Migrated** |
| Executive Dashboard | — | Shortage Overview | shortage-risk / demandPlanningService | SCM | `demandPlanningService.js` (`onlyShortage`) | `src/features/executive/ShortageOverviewPage.jsx` | Adapt | Medium | Yes | No | — | Executive shortage KPIs + top lines table | **Migrated** |
| Executive Dashboard | — | Order Fulfillment | DashboardPage KPI links / pipeline | SCM | `DashboardPage.jsx` + reservation/picking/WMS services | `src/features/executive/OrderFulfillmentPage.jsx` | Adapt | Medium | Yes | No | — | SO → reservation → pick → dispatch pipeline read-only | **Migrated** |
| Executive Dashboard | — | CONSI Overview | OperationsPreviewPage (modern-trade-stock) | SCM | `src/modules/operations-preview/pages/OperationsPreviewPage.jsx` | `src/features/executive/CONSIOverviewPage.jsx` | Adapt | Medium | Yes | No | — | modern-trade-stock preview; import-ready structure only | **Migrated** |
| Sales | — | Sales Order | ReservationPage SO Candidates / listSalesOrderReservationCandidates | SCM | `src/modules/reservation/pages/ReservationPage.jsx`, `src/modules/reservation/services/reservationSourceService.js` | `src/features/sales/SalesOrderListPage.jsx` | Adapt | Low | No | No | — | Read-only SO lines from sc_so_reservation_candidate_view | **Migrated** |
| Sales | — | Sales Order Detail | getSalesOrderLines (same view) | SCM | `src/modules/reservation/services/reservationSourceService.js` | `src/features/sales/SalesOrderDetailPage.jsx` | Adapt | Low | No | No | — | Detail by documentNo route param | **Migrated** |
| Sales | — | Sales Forecast | pgForecast (legacy TGM) | Legacy | `IT/Code old project/tgm-supplychain/index.html` (`pgForecast`, `_renderFcGrid`) | `src/features/sales/SalesForecastPage.jsx` | Adapt | Low | No | No | — | Migrated from legacy Sales Forecast UI | **Migrated** |
| Sales | — | Sales Overview | ReportsPage sales tab / getSalesDashboardMetrics | SCM | `src/modules/reports/pages/ReportsPage.jsx`, `src/modules/reports/services/dashboardService.js` | `src/features/sales/SalesOverviewPage.jsx` | Adapt | Low | No | No | — | Live KPIs when Supabase configured | **Migrated** |
| Sales | — | Return / CN | OperationsPreviewPage (cn-return) | SCM | `src/modules/operations-preview/pages/OperationsPreviewPage.jsx` | `src/features/sales/ReturnCNPage.jsx` | Adapt | Medium | No | No | — | Static preview structure; no write-back | **Migrated** |
| Sales | — | Customer Registration | CustomerRegistrationPage (PlaceholderCard) | SCM | `src/modules/customer-registration/pages/CustomerRegistrationPage.jsx` | `src/features/sales/CustomerRegistrationPage.jsx` | Adapt | Low | No | No | — | Same PlaceholderCard stub as SCM | **Migrated** |
| Sales | — | Customer Map | — | — | — | `src/features/sales/CustomerMapPage.jsx` | Mock Only | Low | No | No | — | No source in SCM or WMS | **Mock Only** |
| Sales | — | Sample & Consumable | OperationsPreviewPage (issue-request) | SCM | `src/modules/operations-preview/pages/OperationsPreviewPage.jsx` | `src/features/sales/SampleConsumablePage.jsx` | Adapt | Low | No | No | Merged Sample Request + Consumable | issue-request preview key | **Migrated** |
| Planning & Allocation | — | Demand Planning | DemandPlanningPage | SCM | `src/modules/sales/pages/DemandPlanningPage.jsx` | `src/features/planning/DemandPlanPage.jsx` | Direct | Low | No | No | — | Full implementation with demandPlanningService | **Migrated** |
| Planning & Allocation | — | Stock & Planning | stock-planning (menu) / PlanningPage | SCM | `src/modules/planning/pages/PlanningPage.jsx` | `src/features/planning/StockPlanningPage.jsx` | Adapt | Medium | No | No | — | PlanningPage is placeholder | **Migrated** |
| Planning & Allocation | — | ATP Workbench | — | — | — | `src/features/planning/ATPWorkbenchPage.jsx` | Mock Only | High | No | No | — | No ATP page in either source — design first | **Mock Only** |
| Planning & Allocation | — | Reservation Workbench | ReservationPage | SCM | `src/modules/reservation/pages/ReservationPage.jsx` | `src/features/sales/ReservationWorkbenchPage.jsx` | Direct | High | Yes | No | Moved from Sales menu to Planning | createReservation OK; release disabled safe mode | **Migrated** |
| Planning & Allocation | — | Shortage Review | shortage-risk (menu only) | SCM | `demandPlanningService.js` (`onlyShortage`) | `src/features/planning/ShortageReviewPage.jsx` | Adapt | Medium | No | No | Renamed from Shortage Alerts | Derived from sc_so_pick_pack_candidate_view shortage filter | **Migrated** |
| Planning & Allocation | — | Reservation Summary | ReservationPage (summary tab) | SCM | `src/modules/reservation/pages/ReservationPage.jsx` | `src/features/planning/ReservationSummaryPage.jsx` | Adapt | Medium | No | No | — | Read-only listReservations summary | **Migrated** |
| Planning & Allocation | — | Production / Purchase Suggestion | production-planning (menu only) | Legacy | `IT/Code old project/tgm-supplychain/index.html` (`pgPlanStock`, `pgProdPlan`) | `src/features/planning/ProductionPurchaseSuggestionPage.jsx` | Mock Only | Medium | No | No | — | Legacy source too large (~250+ lines, AI/PO write-back); mock retained with note | **Mock Only** |
| Warehouse | Inventory Control | Stock Balance | StockBalancePage | SCM | `src/modules/warehouse/pages/StockBalancePage.jsx` | `src/features/inventory/StockBalancePage.jsx` | Direct | Low | No | No | — | Also similar in WMS reports; prefer SCM service | **Migrated** |
| Warehouse | Inventory Control | Available Stock | AllocationsPage (partial) | WMS | `src/features/operations/AllocationsPage.jsx` | `src/features/warehouse/inventory/AvailableStockPage.jsx` | Adapt | Medium | No | No | — | WMS allocations ≈ available/reserved view | **Migrated** |
| Warehouse | Inventory Control | Stock Movement | StockMovementPage | SCM | `src/modules/warehouse/pages/StockMovementPage.jsx` | `src/features/inventory/StockMovementPage.jsx` | Direct | Low | No | No | — | stockMovementService read-only | **Migrated** |
| Warehouse | Inventory Control | Inventory Ledger | MovementLedgerReportPage | WMS | `src/features/reports/MovementLedgerReportPage.jsx` | `src/features/inventory/InventoryLedgerPage.jsx` | Adapt | Low | No | No | — | SCM has inventoryLedgerService but no page | **Migrated** |
| Warehouse | Inventory Control | Stock Adjustment | OperationsPreviewPage (stock-adjust) | SCM | `src/modules/operations-preview/pages/OperationsPreviewPage.jsx` | `src/features/wms/StockAdjustmentPage.jsx` | Adapt | High | Yes | No | — | WMS AdjustmentPage has write logic — migrate read-first | **Migrated** |
| Warehouse | Inventory Control | Cycle Count | OperationsPreviewPage (cycle-count) / StockCountPage | SCM + WMS | `src/modules/operations-preview/...`, `src/features/stock-count/StockCountPage.jsx` | `src/features/wms/StockCountPage.jsx` | Adapt | High | Yes | No | Renamed from Stock Count | Prefer WMS StockCountPage with safe posting | **Migrated** |
| Warehouse | Inventory Control | Lot / Expiry Control | StorageAgingReportPage / expiry-tracking (menu) | WMS + SCM | `src/features/reports/StorageAgingReportPage.jsx` | `src/features/warehouse/inventory/LotExpiryControlPage.jsx` | Adapt | Medium | No | No | — | WMS storage aging + SCM expiry menu | **Migrated** |
| Warehouse | WMS Operations | WMS Dashboard | OperationsPreviewPage (warehouse-dashboard) | SCM | `src/modules/operations-preview/pages/OperationsPreviewPage.jsx` | `src/features/wms/WMSDashboardPage.jsx` | Adapt | Low | No | No | — | Also WmsPage placeholder in SCM | **Migrated** |
| Warehouse | WMS Operations | Receiving | ReceivingPreviewPage / ReceivingPage | SCM + WMS | `src/modules/warehouse/pages/ReceivingPreviewPage.jsx`, `src/features/operations/ReceivingPage.jsx` | `src/features/wms/ReceivingPage.jsx` | Adapt | Medium | Yes | No | — | WMS has full receiving flow — migrate read-first | **Migrated** |
| Warehouse | WMS Operations | Putaway | OperationsPreviewPage (putaway) / PutawayPage | SCM + WMS | `src/modules/operations-preview/...`, `src/features/operations/PutawayPage.jsx` | `src/features/wms/PutawayPage.jsx` | Adapt | Medium | Yes | No | — | WMS PutawayPage + services | **Migrated** |
| Warehouse | WMS Operations | Transfer | OperationsPreviewPage (transfer) / TransferPage | SCM + WMS | `src/modules/operations-preview/...`, `src/features/operations/TransferPage.jsx` | `src/features/wms/TransferPage.jsx` | Adapt | Medium | Yes | No | — | WMS transferService | **Migrated** |
| Warehouse | WMS Operations | Picking & Packing | PickListCandidatePage, PickingPage, OperationsPreviewPage (confirm-pick) | SCM + WMS | `src/modules/picking/pages/PickListCandidatePage.jsx`, `src/features/operations/PickingPage.jsx`, `src/modules/operations-preview/...` | `src/features/warehouse/wms/PickingPackingPage.jsx` | Adapt | High | Yes | No | **Consolidated:** Picking + Packing + Checking + SO Pick-Pack + Confirm Pick Safe Mode | Tabbed UI merging SCM pick-pack + WMS picking draft | **Migrated** |
| Warehouse | WMS Operations | Dispatch / Goods Issue | OperationsPreviewPage (dispatch, goods-issue), DispatchPage, OutboundListPage | SCM + WMS | `src/modules/operations-preview/...`, `src/features/operations/DispatchPage.jsx`, `src/features/operations/outbound/OutboundListPage.jsx` | `src/features/warehouse/wms/DispatchGoodsIssuePage.jsx` | Adapt | High | Yes | No | **Consolidated:** Dispatch + Goods Issue | Merge dispatch history + outbound posting UI | **Migrated** |
| Warehouse | WMS Operations | Scan Center | BarcodeScanPage / HandheldPage | Golive + WMS | `src/features/wms/BarcodeScanPage.jsx`, `src/features/handheld/HandheldPage.jsx` | `src/features/warehouse/wms/ScanCenterPage.jsx` | Adapt | Low | No | No | **Consolidated:** Barcode Scan → Scan Center | Reuse WMS HandheldPage scan hub | **Migrated** |
| Warehouse | WMS Operations | Handheld Operations | HandheldPage, handheldReceivingService, handheldPutawayService | WMS | `src/features/handheld/HandheldPage.jsx`, `src/services/handheldReceivingService.js`, `src/services/handheldPutawayService.js` | `src/features/warehouse/wms/HandheldOperationsPage.jsx` | Adapt | Medium | Yes | No | **Consolidated:** Handheld Receiving + Handheld Putaway | Single mobile entry with mode selector | **Migrated** |
| Warehouse | Express Weight Write-back | Weight Capture | — | SCM (preview) | Design-only (`expressWeightService.js`) | `src/features/warehouse/express-weight/WeightCapturePage.jsx` | Design Only | High | Yes | Yes | — | Capture form + localStorage draft; no DBF write | **Design Only** |
| Warehouse | Express Weight Write-back | Weight Review | — | Design | `expressWeightService.js` | `src/features/warehouse/express-weight/WeightReviewPage.jsx` | Design Only | High | Yes | Yes | — | Approve/Reject/Queue safe-mode only | **Design Only** |
| Warehouse | Express Weight Write-back | Express Weight Queue | OperationsPreviewPage (express-queue) | SCM + Design | `operationsExtensionService.js` + `expressWeightService.js` | `src/features/warehouse/express-weight/ExpressWeightQueuePage.jsx` | Design Only | High | Yes | Yes | — | Queue structure from SCM preview; no sync execution | **Design Only** |
| Warehouse | Express Weight Write-back | Express Weight Sync Log | — | Design | `expressWeightService.js` | `src/features/warehouse/express-weight/ExpressWeightSyncLogPage.jsx` | Design Only | High | Yes | Yes | — | Read-only sync log structure | **Design Only** |
| Warehouse | Express Weight Write-back | Weight Error / Retry | — | Design | `expressWeightService.js` | `src/features/warehouse/express-weight/WeightErrorRetryPage.jsx` | Design Only | High | Yes | Yes | — | Retry/Cancel safe-mode only; see docs/08 | **Design Only** |
| Consignment / Modern Trade | — | CONSI Dashboard | OperationsPreviewPage (modern-trade-stock) / ConsiPage | SCM | `src/modules/operations-preview/...`, `src/modules/consi/pages/ConsiPage.jsx` | `src/features/consignment/ConsignmentDashboardPage.jsx` | Adapt | Medium | No | No | — | modern-trade-stock preview is closest | **Migrated** |
| Consignment / Modern Trade | — | Consignment SO | ConsiPage | SCM | `src/modules/consi/pages/ConsiPage.jsx` | `src/features/consignment/ConsignmentSOPage.jsx` | Adapt | Medium | No | No | — | ConsiPage placeholder mentions SO detection | **Migrated** |
| Consignment / Modern Trade | — | Branch Stock | OperationsPreviewPage (modern-trade-stock) | SCM | `src/modules/operations-preview/pages/OperationsPreviewPage.jsx` | `src/features/consignment/BranchStockPage.jsx` | Adapt | Low | No | No | — | Preview: branch stock by customer/SKU | **Migrated** |
| Consignment / Modern Trade | — | Consignment Movement | OperationsPreviewPage (modern-trade-stock) | SCM | `src/modules/operations-preview/pages/OperationsPreviewPage.jsx` | `src/features/consignment/ConsignmentMovementPage.jsx` | Adapt | Medium | No | No | — | Temp DN / movement in preview | **Migrated** |
| Consignment / Modern Trade | — | Sell-out Record | OperationsPreviewPage (modern-trade-stock) sell-out | SCM | `src/modules/operations-preview/pages/OperationsPreviewPage.jsx` | `src/features/consignment/SellOutRecordPage.jsx` | Adapt | Medium | No | No | — | Sell-out section in modern-trade preview | **Migrated** |
| Consignment / Modern Trade | — | Return from Branch | OperationsPreviewPage (modern-trade-stock) return | SCM | `src/modules/operations-preview/pages/OperationsPreviewPage.jsx` | `src/features/consignment/ReturnFromBranchPage.jsx` | Adapt | Medium | No | No | — | Return flow in preview | **Migrated** |
| Consignment / Modern Trade | — | CONSI Return / CN | OperationsPreviewPage (modern-trade-stock) CN adjust | SCM | `src/modules/operations-preview/pages/OperationsPreviewPage.jsx` | `src/features/consignment/ConsignmentReturnCNPage.jsx` | Adapt | Medium | No | No | — | CN adjust in preview | **Migrated** |
| Master Data | — | Product Master | ProductMasterPage | SCM | `src/modules/master-data/pages/ProductMasterPage.jsx` | `src/features/master-data/ProductMasterPage.jsx` | Direct | Low | No | No | — | productService — also WMS ProductsPage | **Migrated** |
| Master Data | — | SKU Settings | OperationsPreviewPage (product-mapping) | SCM | `src/modules/operations-preview/pages/OperationsPreviewPage.jsx` | `src/features/master-data/SKUSettingsPage.jsx` | Adapt | Low | No | No | — | product-mapping preview: SKU attributes | **Migrated** |
| Master Data | — | SKU Alias | OperationsPreviewPage (product-mapping) | SCM | `src/modules/operations-preview/pages/OperationsPreviewPage.jsx` | `src/features/master-data/SKUAliasPage.jsx` | Adapt | Low | No | No | — | Alias section in product-mapping preview | **Migrated** |
| Master Data | — | UOM Conversion | UomConversionPage | SCM | `src/modules/master-data/pages/UomConversionPage.jsx` | `src/features/master-data/UOMConversionPage.jsx` | Direct | Low | No | No | — | uomService full impl | **Migrated** |
| Master Data | — | Customer Master | CustomerMasterPage | SCM | `src/modules/master-data/pages/CustomerMasterPage.jsx` | `src/features/master-data/CustomerMasterPage.jsx` | Direct | Low | No | No | — | Exists but unrouted in SCM | **Migrated** |
| Master Data | — | Customer Branch | customer-branch-stock (menu) / BranchMasterPage | SCM | —, `src/modules/master-data/pages/` (BranchMaster renamed) | `src/features/master-data/CustomerBranchPage.jsx` | Adapt | Low | No | No | Renamed from Branch Master | customer-branch-stock menu item | **Mock Only** |
| Master Data | — | Warehouse Master | WarehouseMasterPage | SCM + WMS | `src/modules/master-data/pages/WarehouseMasterPage.jsx`, `src/features/master/WarehousesPage.jsx` | `src/features/master-data/WarehouseMasterPage.jsx` | Direct | Low | No | No | — | SCM unrouted; WMS has full page | **Migrated** |
| Master Data | — | Location Master | — / LocationsPage | WMS | `src/features/master/LocationsPage.jsx` | `src/features/master-data/LocationMasterPage.jsx` | Direct | Low | No | No | — | WMS LocationsPage | **Migrated** |
| Master Data | — | Room / Company | — | — | — | `src/features/master-data/RoomCompanyPage.jsx` | Mock Only | Low | No | No | — | Cold room filter in SCM StockBalancePage — extract config | **Mock Only** |

---

## Excluded / Deprecated Menu Items (Not in Final Menu)

| Original Function | Source | Reason |
|-------------------|--------|--------|
| Reports (standalone section) | Golive mockup | Merged into Executive Dashboard |
| Admin (standalone section) | Golive mockup + SCM AdminPage | Deferred to Phase 2 auth; SyncMonitor mapped later |
| Sample Request (5 separate pages) | Golive mockup | Consolidated under Sales → Sample & Consumable |
| QC Check | SCM `/warehouse/qc-check` | Out of final menu — revisit if needed |
| WMS Control Tower | SCM menu only | Covered by Executive + WMS Dashboard |
| Picking (standalone) | Golive `/wms/picking` | Consolidated → Picking & Packing; legacy route kept as fallback |
| Dispatch (standalone) | Golive `/wms/dispatch` | Consolidated → Dispatch / Goods Issue; legacy fallback kept |
| Barcode Scan (standalone) | Golive `/wms/barcode` | Consolidated → Scan Center; legacy fallback kept |
| Data Health | SCM preview | Admin/management — deferred |

---

## Recommended Migration Order

| Priority | Module | Rationale |
|----------|--------|-----------|
| 1 | Master Data (Product, Customer, Warehouse, UOM, Location) | Low risk, read-only, foundation for all modules |
| 2 | Warehouse Inventory Control (Stock Balance, Movement, Ledger) | SCM + WMS read-only services proven |
| 3 | Planning (Demand Planning, Reservation Workbench) | SCM has full ReservationPage — high value, use safe mode |
| 4 | WMS Operations (Receiving, Putaway, Transfer) | WMS has mature services — read-first, no posting |
| 5 | WMS Operations (Picking & Packing, Dispatch / Goods Issue) | Consolidated UI — medium/high risk, safe mode required |
| 6 | Consignment / Modern Trade | Adapt SCM operations-preview modern-trade-stock |
| 7 | Sales (SO list, Return/CN) | Depends on Express/Supabase SO integration |
| 8 | Executive Dashboard | Aggregate migrated modules |
| 9 | Express Weight Write-back | **Last** — SAFE MODE / DESIGN ONLY until governance sign-off |

---

## Source Functions Inventory

### tss-supply-chain-management (key files)

| Area | Files |
|------|-------|
| Dashboard/Reports | `DashboardPage.jsx`, `ReportsPage.jsx`, `dashboardService.js` |
| Sales/Planning | `DemandPlanningPage.jsx`, `PlanningPage.jsx`, `demandPlanningService.js` |
| Reservation | `ReservationPage.jsx`, `reservationService.js`, `reservationSourceService.js` |
| Picking | `PickListCandidatePage.jsx`, `pickListCandidateService.js`, `pickSessionService.js` |
| Warehouse | `StockBalancePage.jsx`, `StockMovementPage.jsx`, `ReceivingPreviewPage.jsx` |
| Operations Preview | `OperationsPreviewPage.jsx`, `operationsExtensionService.js` |
| Master Data | `ProductMasterPage.jsx`, `CustomerMasterPage.jsx`, `WarehouseMasterPage.jsx`, `UomConversionPage.jsx` |
| Consignment | `ConsiPage.jsx`, modern-trade-stock preview |
| Admin | `SyncMonitorPage.jsx`, `syncMonitorService.js` |

### TGD WMS (key files)

| Area | Files |
|------|-------|
| Operations | `ReceivingPage.jsx`, `PutawayPage.jsx`, `TransferPage.jsx`, `PickingPage.jsx`, `DispatchPage.jsx`, `OutboundListPage.jsx` |
| Handheld | `HandheldPage.jsx`, `handheldReceivingService.js`, `handheldPutawayService.js` |
| Stock Count | `StockCountPage.jsx`, `stockCountService.js` |
| Adjustment | `AdjustmentPage.jsx`, `adjustmentService.js` |
| Allocations | `AllocationsPage.jsx`, `withdrawalAllocationService.js` |
| Reports | `MovementLedgerReportPage.jsx`, `StorageAgingReportPage.jsx` |
| Master | `ProductsPage.jsx`, `CustomersPage.jsx`, `WarehousesPage.jsx`, `LocationsPage.jsx` |
| Weight (partial) | `storageWeightSnapshotService.js` (billing context only — not write-back) |

---

## Phase 2A — Sales Migration Summary

| Function Name | Source File | Target File | Migration Status | Blocker | Notes |
|---------------|-------------|-------------|------------------|---------|-------|
| Sales Order | `tss-supply-chain-management/src/modules/reservation/pages/ReservationPage.jsx` (SO Candidates tab) + `reservationSourceService.js` | `src/features/sales/SalesOrderListPage.jsx` | **Migrated** | Requires `VITE_SUPABASE_*` for live data | Read-only list from `sc_so_reservation_candidate_view` |
| Sales Order Detail | `reservationSourceService.js` (`getSalesOrderLines`) | `src/features/sales/SalesOrderDetailPage.jsx` | **Migrated** | Requires Supabase env | Lines filtered by `:orderId` route param |
| Sales Forecast | `IT/Code old project/tgm-supplychain/index.html` (`pgForecast`, `_renderFcGrid`, `_renderFcSummary`, `_renderFcEntry`, `_renderFcList`, `_renderFcDoc`) | `src/features/sales/SalesForecastPage.jsx` | **Migrated** | localStorage-only save (no Supabase write-back) | Migrated from legacy Sales Forecast UI |
| Sales Overview | `ReportsPage.jsx` + `dashboardService.js` (`getSalesDashboardMetrics`) | `src/features/sales/SalesOverviewPage.jsx` | **Migrated** | Requires Supabase env for live KPIs | No auth gate (SCM required login) |
| Return / CN | `operations-preview/OperationsPreviewPage.jsx` + `operationsExtensionService.js` (`cn-return`) | `src/features/sales/ReturnCNPage.jsx` | **Migrated** | None — static preview | No Express write-back |
| Customer Registration | `customer-registration/CustomerRegistrationPage.jsx` | `src/features/sales/CustomerRegistrationPage.jsx` | **Migrated** | Wizard not built in source | Same PlaceholderCard as SCM |
| Customer Map | — | `src/features/sales/CustomerMapPage.jsx` | **Mock Only** | No source function | Kept MockupPageShell fallback |
| Sample & Consumable | `OperationsPreviewPage.jsx` (`issue-request`) | `src/features/sales/SampleConsumablePage.jsx` | **Migrated** | None — static preview | Replaces separate sample-consumable mock pages |

---

## Phase 2C — Planning Migration Summary

| Function Name | Source File | Target File | Migration Status | Blocker | Notes |
|---------------|-------------|-------------|------------------|---------|-------|
| Demand Planning | `DemandPlanningPage.jsx` + `demandPlanningService.js` | `src/features/planning/DemandPlanPage.jsx` | **Migrated** | Requires Supabase env | Read-only planner workbench from `sc_so_pick_pack_candidate_view` |
| Stock & Planning | `PlanningPage.jsx` (PlaceholderCard) | `src/features/planning/StockPlanningPage.jsx` | **Migrated** | Wizard not built in source | Same PlaceholderCard stub as SCM |
| Reservation Workbench | `ReservationPage.jsx` + `reservationService.js` + `inventoryService.js` | `src/features/sales/ReservationWorkbenchPage.jsx` | **Migrated** | Requires Supabase env + RPC | Safe mode: create OK, release disabled |
| Shortage Review | `demandPlanningService.js` (`onlyShortage`) | `src/features/planning/ShortageReviewPage.jsx` | **Migrated** | Requires Supabase env | Read-only shortage lines table |
| Reservation Summary | `ReservationPage.jsx` / `listReservations` | `src/features/planning/ReservationSummaryPage.jsx` | **Migrated** | Requires Supabase env | Read-only summary KPIs + list |
| ATP Workbench | — | `src/features/planning/ATPWorkbenchPage.jsx` | **Mock Only** | No source page | Kept MockupPageShell fallback |
| Production / Purchase Suggestion | Legacy `tgm-supplychain/index.html` (`pgPlanStock`, `pgProdPlan`) | `src/features/planning/ProductionPurchaseSuggestionPage.jsx` | **Mock Only** | Legacy too large for sprint | ~250+ lines each with AI/PO write-back; note in mock |

### Infrastructure added (Phase 2A)

- Tailwind CSS + SCM `tgm-*` component styles
- `src/lib/supabaseClient.js`
- `src/services/sales/reservationSourceService.js`, `dashboardService.js`
- `src/services/planning/demandPlanningService.js`, `reservationService.js`
- `src/services/inventory/inventoryService.js`
- `src/services/operations-preview/operationsExtensionService.js`
- `src/components/scm-ui/*` (Alert, Badge, Card, PageHeader, TablePanel, StatusBadge, PageSubnav, PlaceholderCard, OperationsPreviewPage)

---

## Phase 2D — Warehouse Inventory Control Migration Summary

| Function Name | Source File | Target File | Migration Status | Blocker | Notes |
|---------------|-------------|-------------|------------------|---------|-------|
| Stock Balance | `tss-supply-chain-management/.../StockBalancePage.jsx` + `stockBalanceService.js` | `src/features/inventory/StockBalancePage.jsx` | **Migrated** | Requires `VITE_SUPABASE_*` for live data | Read-only from `sc_inventory_balance_view` |
| Available Stock | `TGD WMS/.../AllocationsPage.jsx` + `withdrawalAllocationService.js` | `src/features/warehouse/inventory/AvailableStockPage.jsx` | **Migrated** | Requires Supabase + `tgd_withdrawal_allocations` | Read-only list; no allocation posting |
| Stock Movement | `tss-supply-chain-management/.../StockMovementPage.jsx` + `stockMovementService.js` | `src/features/inventory/StockMovementPage.jsx` | **Migrated** | Requires Supabase env | Read-only from `sc_inventory_ledger` |
| Inventory Ledger | `TGD WMS/.../MovementLedgerReportPage.jsx` + `movementLedgerReportService.js` | `src/features/inventory/InventoryLedgerPage.jsx` | **Migrated** | Requires Supabase + `tgd_inventory_movements` | Report UI + print preview preserved |
| Stock Adjustment | `OperationsPreviewPage.jsx` (`stock-adjust`) | `src/features/wms/StockAdjustmentPage.jsx` | **Migrated** | None — static preview | Safe mode; no WMS adjustment posting |
| Cycle Count | `TGD WMS/.../StockCountPage.jsx` + `stockCountService.js` | `src/features/wms/StockCountPage.jsx` | **Migrated** | Requires Supabase + `tgd_stock_count_documents` | Read-only document list; no count posting |
| Lot / Expiry Control | `TGD WMS/.../StorageAgingReportPage.jsx` + `storageAgingReportService.js` | `src/features/warehouse/inventory/LotExpiryControlPage.jsx` | **Migrated** | Requires Supabase + `tgd_stock_balances` | Aging/expiry report UI preserved |

### Infrastructure added (Phase 2D)

- `src/services/warehouse/stockBalanceService.js`, `stockMovementService.js`
- `src/services/wms/movementLedgerReportService.js`, `storageAgingReportService.js`, `withdrawalAllocationService.js`, `stockCountService.js`, `operationalReportMapper.js`
- `src/components/wms/*` (ui, dashboard, operations, reports)
- `src/styles/wms-components.css`
- `operationsExtensionService.js` — `stock-adjust`, `cycle-count` preview modules

---

## Phase 2E — WMS Operations Migration Summary

| Function Name | Source File | Target File | Migration Status | Blocker | Notes |
|---------------|-------------|-------------|------------------|---------|-------|
| WMS Dashboard | `OperationsPreviewPage.jsx` (`warehouse-dashboard`) | `src/features/wms/WMSDashboardPage.jsx` | **Migrated** | None — static preview | SCM operations-preview key |
| Receiving | `TGD WMS/.../ReceivingListPage.jsx` + `receivingService.js` | `src/features/wms/ReceivingPage.jsx` | **Migrated** | Requires Supabase + `tgd_receiving_documents` | Read-only document list |
| Putaway | `TGD WMS/.../PutawayListPage.jsx` + `putawayService.js` | `src/features/wms/PutawayPage.jsx` | **Migrated** | Requires Supabase + `tgd_putaway_documents` | Read-only document list |
| Transfer | `TGD WMS/.../TransferListPage.jsx` + `transferService.js` | `src/features/wms/TransferPage.jsx` | **Migrated** | Requires Supabase + `tgd_transfer_documents` | Read-only document list |
| Picking & Packing | `PickingListPage.jsx` + `PickListCandidatePage.jsx` + `confirm-pick` preview | `src/features/warehouse/wms/PickingPackingPage.jsx` | **Migrated** | Requires Supabase env | Tabbed: WMS picking + SO candidates + safe mode preview |
| Dispatch / Goods Issue | `DispatchListPage.jsx` + `OutboundListPage.jsx` + `goods-issue` preview | `src/features/warehouse/wms/DispatchGoodsIssuePage.jsx` | **Migrated** | Requires Supabase env | Tabbed: dispatch list + outbound read + preview |
| Scan Center | `TGD WMS/.../HandheldPage.jsx` | `src/features/warehouse/wms/ScanCenterPage.jsx` | **Migrated** | None — UI only | HandheldScanHub component; no scan write-back |
| Handheld Operations | `HandheldPage.jsx` + handheld services | `src/features/warehouse/wms/HandheldOperationsPage.jsx` | **Migrated** | Requires Supabase for session lists | Mode tabs: receiving / putaway / scan hub |

### Infrastructure added (Phase 2E)

- `src/services/wms/receivingService.js`, `putawayService.js`, `transferService.js`, `pickingService.js`, `dispatchService.js`, `outboundPickingService.js`, `masterDataService.js`, `handheldReceivingService.js`, `handheldPutawayService.js`
- `src/services/picking/pickListCandidateService.js`
- `src/components/wms/handheld/HandheldScanHub.jsx`
- `operationsExtensionService.js` — `warehouse-dashboard`, `putaway`, `transfer`, `confirm-pick`, `dispatch`, `goods-issue` preview keys
- `OperationsPreviewPage.jsx` — `defaultTab` prop for consignment/master preview routing

---

## Phase 2F — Consignment Migration Summary

| Function Name | Source File | Target File | Migration Status | Blocker | Notes |
|---------------|-------------|-------------|------------------|---------|-------|
| CONSI Dashboard | `OperationsPreviewPage.jsx` (`modern-trade-stock`) | `src/features/consignment/ConsignmentDashboardPage.jsx` | **Migrated** | None — static preview | defaultTab: branch-stock |
| Consignment SO | `ConsiPage.jsx` (placeholder) / modern-trade-stock | `src/features/consignment/ConsignmentSOPage.jsx` | **Migrated** | None — static preview | defaultTab: branch-stock |
| Branch Stock | `modern-trade-stock` preview | `src/features/consignment/BranchStockPage.jsx` | **Migrated** | None — static preview | defaultTab: branch-stock |
| Consignment Movement | `modern-trade-stock` preview | `src/features/consignment/ConsignmentMovementPage.jsx` | **Migrated** | None — static preview | defaultTab: temp-dn |
| Sell-out Record | `modern-trade-stock` preview | `src/features/consignment/SellOutRecordPage.jsx` | **Migrated** | None — static preview | defaultTab: sell-out |
| Return from Branch | `modern-trade-stock` preview | `src/features/consignment/ReturnFromBranchPage.jsx` | **Migrated** | None — static preview | defaultTab: return |
| CONSI Return / CN | `modern-trade-stock` preview | `src/features/consignment/ConsignmentReturnCNPage.jsx` | **Migrated** | None — static preview | defaultTab: cn-adjust |

---

## Phase 2G — Master Data Migration Summary

| Function Name | Source File | Target File | Migration Status | Blocker | Notes |
|---------------|-------------|-------------|------------------|---------|-------|
| Product Master | `ProductMasterPage.jsx` + `productService.js` + components | `src/features/master-data/ProductMasterPage.jsx` | **Migrated** | Requires Supabase env | ProductForm + ProductTable preserved |
| SKU Settings | `OperationsPreviewPage.jsx` (`product-mapping`) | `src/features/master-data/SKUSettingsPage.jsx` | **Migrated** | None — static preview | defaultTab: rules |
| SKU Alias | `product-mapping` preview | `src/features/master-data/SKUAliasPage.jsx` | **Migrated** | None — static preview | defaultTab: alias |
| UOM Conversion | `UomConversionPage.jsx` + `uomService.js` | `src/features/master-data/UOMConversionPage.jsx` | **Migrated** | Requires Supabase env | Full SCM page with upsert/deactivate |
| Customer Master | `CustomerMasterPage.jsx` + `customerService.js` | `src/features/master-data/CustomerMasterPage.jsx` | **Migrated** | Requires Supabase env | Read-only list + detail panel |
| Customer Branch | — | `src/features/master-data/CustomerBranchPage.jsx` | **Mock Only** | No SCM branch master page | MockupPageShell retained |
| Warehouse Master | `WarehouseMasterPage.jsx` + `warehouseService.js` | `src/features/master-data/WarehouseMasterPage.jsx` | **Migrated** | Requires Supabase env | SCM preferred over WMS WarehousesPage |
| Location Master | `TGD WMS/.../LocationsPage.jsx` + `masterDataService.js` | `src/features/master-data/LocationMasterPage.jsx` | **Migrated** | Requires Supabase + `tgd_locations` | Read-only WMS location list |
| Room / Company | — | `src/features/master-data/RoomCompanyPage.jsx` | **Mock Only** | No approved source | MockupPageShell retained |

### Infrastructure added (Phase 2G)

- `src/services/master-data/productService.js`, `customerService.js`, `warehouseService.js`, `uomService.js`
- `src/components/master-data/ProductForm.jsx`, `ProductTable.jsx`

---

## Phase 2H — Executive Dashboard Migration Summary

| Function Name | Source File | Target File | Migration Status | Blocker | Notes |
|---------------|-------------|-------------|------------------|---------|-------|
| Management Dashboard | `DashboardPage.jsx` + `executiveDashboardService.js` (aggregates sales/inventory/demand/reservation/WMS) | `src/features/executive/ManagementDashboardPage.jsx` | **Migrated** | Requires Supabase env for live KPIs | SCM layout preserved; operation cards link to golive routes |
| Sales Overview | `ReportsPage.jsx` + `dashboardService.js` (`getSalesDashboardMetrics`) | `src/features/executive/SalesOverviewPage.jsx` | **Migrated** | Requires Supabase env | Same UI as Sales module overview |
| Stock Overview | `ReportsPage.jsx` + `getInventoryDashboardMetrics` | `src/features/executive/StockOverviewPage.jsx` | **Migrated** | Requires Supabase env | sc_inventory_balance_view; shortage/low-stock tables |
| Shortage Overview | `demandPlanningService.js` (`onlyShortage`) | `src/features/executive/ShortageOverviewPage.jsx` | **Migrated** | Requires Supabase env | Executive shortage KPIs + top 15 lines |
| Order Fulfillment | `DashboardPage.jsx` pipeline + reservation/picking/WMS services | `src/features/executive/OrderFulfillmentPage.jsx` | **Migrated** | Requires Supabase env | Read-only SO → dispatch pipeline |
| CONSI Overview | `OperationsPreviewPage.jsx` (`modern-trade-stock`) | `src/features/executive/CONSIOverviewPage.jsx` | **Migrated** | None — static preview | Import-ready CONSI structure; no settlement write-back |

### Infrastructure added (Phase 2H)

- `src/services/executive/executiveDashboardService.js` — aggregates `dashboardService`, `stockBalanceService`, `demandPlanningService`, `reservationService`, `pickListCandidateService`, WMS picking/dispatch lists
- `OperationsPreviewPage.jsx` — optional `pageTitle` / `pageDescription` props for executive CONSI view

---

## Phase 2I — Express Weight Write-back Design Summary

| Function Name | Source File | Target File | Migration Status | Blocker | Notes |
|---------------|-------------|-------------|------------------|---------|-------|
| Weight Capture | Design-only (`expressWeightService.js`) | `src/features/warehouse/express-weight/WeightCapturePage.jsx` | **Design Only** | Governance sign-off required before production | localStorage drafts; SO/Pick/weight fields |
| Weight Review | Design-only service | `src/features/warehouse/express-weight/WeightReviewPage.jsx` | **Design Only** | Same | Tolerance compare; Approve/Reject/Queue safe-mode |
| Express Weight Queue | SCM `express-queue` preview + design service | `src/features/warehouse/express-weight/ExpressWeightQueuePage.jsx` | **Design Only** | Local Sync Service not built | Queue table; no sync execution |
| Express Weight Sync Log | Design-only service | `src/features/warehouse/express-weight/ExpressWeightSyncLogPage.jsx` | **Design Only** | Production audit table TBD | Read-only log structure |
| Weight Error / Retry | Design-only service | `src/features/warehouse/express-weight/WeightErrorRetryPage.jsx` | **Design Only** | Express connection TBD | Retry/Cancel/Mark Reviewed safe-mode |

### Infrastructure added (Phase 2I)

- `src/services/expressWeight/expressWeightService.js` — `EXPRESS_WEIGHT_SAFE_MODE = true`, localStorage mock, all write functions return safe-mode responses
- `src/features/warehouse/express-weight/components/ExpressWeightLayout.jsx` — shared safe-mode banner and layout
- `docs/08_EXPRESS_WEIGHT_WRITEBACK_DESIGN.md` — workflow, governance, queue, rollback, audit requirements

---

## Next Actions

1. Business sign-off on final menu (this document).
2. Mark **Pending** rows for Sprint 1 migration (Master Data + Inventory read-only).
3. Implement consolidated WMS UI shells (tabs) before migrating pick/dispatch logic.
4. Keep Express Weight Write-back in SAFE MODE until explicit go-live approval.
5. Update `docs/02_FUNCTION_STATUS_MATRIX.md` when migrations begin.
