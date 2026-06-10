# Legacy-Complete Function Inventory

**Project:** `tss-supply-chain-golive`  
**Legacy source:** `IT/Code old project/tgm-supplychain/index.html`  
**Last audit:** run `npm run legacy:audit` — see `docs/legacy-function-coverage-check-result.md`  
**Governance:** No Express DBF write-back. Supabase request-only workflows. No service role key in frontend.

## Audit summary (latest run)

| Metric | Count |
|--------|------:|
| Legacy `pg*` functions in index.html | 24 |
| Registry entries | 26 |
| **COMPLETE** | 15 |
| **PARTIAL** | 7 |
| **MISSING** | 0 |
| **BLOCKED_BY_GOVERNANCE** | 7 |

**Sales module:** all 8 registry entries **COMPLETE** (0 PARTIAL)

**Planning module:** all 7 routable registry entries **COMPLETE** (0 PARTIAL). Legacy `pgProdPlan`, `pgProdSummary`, `pgForecastDoc` remain **BLOCKED_BY_GOVERNANCE**.

**COMPLETE (global):** Sales (8), Planning (7) — see audit MD for full list

**Critical handlers with route + page:** all 12 critical handlers mapped (0 MISSING)

---

## Completion criteria

A function is **COMPLETE** only when all of:

1. Route exists  
2. Navigation exists  
3. Page exists with real UI (not PlaceholderCard / OperationsPreviewPage shell only)  
4. Legacy fields/sections present  
5. Service exists (if data entry)  
6. Supabase migration/table/view exists (if data entry)  
7. Tests exist  
8. Safety boundary documented (SAFE MODE / REQUEST ONLY)  
9. Express write-back marked BLOCKED if applicable  

---

## Sales module

| Module | Menu key | Legacy label | Handler | Sub-functions | Legacy fields (summary) | Route | Page | Service | Migration | Test | Status | Evidence | Gap | Required action |
|--------|----------|--------------|---------|---------------|---------------------------|-------|------|---------|-----------|------|--------|----------|-----|-----------------|
| Sales | mysales | Sales Overview | pgMySales | — | Filters, KPIs, charts, detail table | `/sales/overview` | `SalesOverviewPage.jsx` | `salesOverviewService.js` | `sc_web_sales_dashboard_view`, `sc_express_invoices` | `sales-legacy-functions.test.jsx` | **COMPLETE** | Real UI, read-only, tests | None | — |
| Sales | forecast | Sales Forecast | pgForecast | Grid/summary/entry/list/doc tabs, templates | `/sales/forecast` | `SalesForecastPage.jsx` | `salesForecastService.js` | `006` `sc_sales_forecasts` | `sales-module-completion.test.jsx` | **COMPLETE** | Supabase + local fallback | Run migration 006 | — |
| Sales | custmap | Customer Map | pgCustMap (= pgMySales) | Customer sales summary by code/group | `/sales/customer-map` | `CustomerMapPage.jsx` | `customerMapService.js` | read models | `sales-module-completion.test.jsx` | **COMPLETE** | No map placeholder | — | — |
| Sales | custreg | Customer Registration | pgCustReg | (see sub-functions) | `/sales/customer-registration` | `CustomerRegistrationPage.jsx` | `customerRegistrationService.js` | `004`, `005` | `sales-legacy-functions.test.jsx` | **COMPLETE** | Full workflow | Re-run 004/005 if needed | — |
| Sales | sample | Sample & Consumable | pgSample | List KPIs, form, items, approval/dispatch | `/sales/sample-consumable` | `SampleConsumablePage.jsx` | `sampleConsumableService.js` | `006` `sc_sample_consumable_*` | `sales-module-completion.test.jsx` | **COMPLETE** | Request-only, no GI | Run migration 006 | — |
| Sales | — | Sales Order | pgPlanBooking | SO list, reservation candidates | `/sales/orders` | `SalesOrderListPage.jsx` | `reservationSourceService.js` | read models | `sales-module-completion.test.jsx` | **COMPLETE** | Read-only safe mode | — | — |
| Sales | promotions | Promotion | — | Full promotion workflow | `/sales/promotions` | `SalesPromotionsPage.jsx` | `promotionService.js` | `003` | `sales-promotions-safety.test.jsx` | **COMPLETE** | — | — | — |
| Sales | — | Return / CN | — | CN/return request, lines, approval | `/sales/return-cn` | `ReturnCNPage.jsx` | `returnCnService.js` | `006` `sc_return_cn_*` | `sales-module-completion.test.jsx` | **COMPLETE** | express_queue blocked | Run migration 006 | — |

### Customer Registration sub-functions (pgCustReg)

| Sub-function | Legacy role | Golive mapping | Status |
|--------------|-------------|----------------|--------|
| `_crSave` | Save draft to local DB | `createCustomerRegistrationDraft`, `updateCustomerRegistrationDraft` | **COMPLETE** |
| `crConfirmApproval` | Submit for approval | `submitCustomerRegistration` | **COMPLETE** |
| Approve / Reject / Revision | Manager actions | `approveCustomerRegistration`, `rejectCustomerRegistration`, `requestCustomerRegistrationRevision` | **COMPLETE** |
| `CR_DOC_SLOTS` | 6 attachment slots | `src/constants/customerRegistrationLegacy.js` + `document_slots` jsonb | **COMPLETE** |
| `custreg_subs` | localStorage submissions | `sc_customer_registration_requests` | **COMPLETE** |
| Existing customer search | Load ARMAS/read model | `searchExistingCustomers`, `loadExistingCustomerSnapshot` | **COMPLETE** |
| Original snapshot | Read-only baseline | `original_customer_snapshot` jsonb | **COMPLETE** |
| Proposed changes | Diff fields | `proposed_changes` jsonb | **COMPLETE** |
| Express ARMAS write | Live master update | — | **BLOCKED_BY_GOVERNANCE** — Supabase request only |
| `pgCrWorkflowSettings` | Approver config | Not migrated | **PARTIAL** — admin settings gap |

---

## Planning & allocation

| Module | Menu key | Handler | Route | Page | Service | Migration | Status | Notes |
|--------|----------|---------|-------|------|---------|-----------|--------|-------|
| Planning | demand | goliveDemandPlan | `/planning/demand` | `DemandPlanPage.jsx` | `demandPlanningService.js` | `007` `sc_so_pick_pack_candidate_view` | **COMPLETE** | Read-only L2A workbench |
| Planning | atp | goliveAtpWorkbench | `/planning/atp` | `ATPWorkbenchPage.jsx` | `atpWorkbenchService.js` | `sc_web_atp_view` | **COMPLETE** | Supabase-backed ATP; safe mode |
| Planning | shortage | goliveShortageReview | `/planning/shortage-review` | `ShortageReviewPage.jsx` | `demandPlanningService.js` | `sc_so_pick_pack_candidate_view` | **COMPLETE** | Shortage filter read-only |
| Planning | planstock | pgPlanStock | `/planning/stock` | `StockPlanningPage.jsx` | `stockPlanningService.js` | `sc_web_stock_balance_view`, `sc_sales_forecasts` | **COMPLETE** | Legacy PS_CRITS, KPIs, table |
| Planning | po | pgPO | `/planning/production-purchase` | `ProductionPurchaseSuggestionPage.jsx` | `productionPurchaseSuggestionService.js` | `007` request tables | **COMPLETE** | SUGGESTION ONLY — no PO/prod create |
| Planning | planbook | pgPlanBooking | `/planning/reservation` | `ReservationWorkbenchPage.jsx` | `reservationSourceService.js` | `007` `sc_reservations` | **COMPLETE** | Safe mode; Supabase RPC request |
| Planning | booksummary | pgBookingSummary | `/planning/reservation-summary` | `ReservationSummaryPage.jsx` | `reservationService.js` | `007` `sc_reservations` | **COMPLETE** | Read-only summary |
| Planning | prodplan | pgProdPlan | — | — | — | — | **BLOCKED_BY_GOVERNANCE** | Live production order creation not in golive scope |
| Planning | prodsummary | pgProdSummary | — | — | — | — | **BLOCKED_BY_GOVERNANCE** | Production compare workflow not migrated |
| Planning | forecastdoc | pgForecastDoc | — | — | — | — | **BLOCKED_BY_GOVERNANCE** | Forecast document workflow not migrated |

Production order / PO creation / stock posting: **BLOCKED_BY_GOVERNANCE** or **REQUEST_ONLY** (`sc_planning_*_requests` with `express_queue_status = blocked_by_governance`).

---

## Warehouse / inventory

| Module | Menu key | Handler | Route | Page | Service | Migration | Status | Notes |
|--------|----------|---------|-------|------|---------|-----------|--------|-------|
| Warehouse | wms | pgWMS | `/warehouse/wms` | `WMSDashboardPage.jsx` | `wmsDashboardService.js` | `008` `sc_web_stock_balance_view` | **COMPLETE** | KPI dashboard + WMS quick links |
| Warehouse | stock | pgStock | `/warehouse/inventory/balance` | `StockBalancePage.jsx` | `warehouseInventoryService.js` | `007`/`008` balance views | **COMPLETE** | Supabase read models + seed fallback |
| Warehouse | available | goliveAvailableStock | `/warehouse/inventory/available` | `AvailableStockPage.jsx` | `warehouseInventoryService.js` | `sc_inventory_balance_view` | **COMPLETE** | Available qty filters |
| Warehouse | movement | goliveStockMovement | `/warehouse/inventory/movement` | `StockMovementPage.jsx` | `stockMovementService.js` | `sc_inventory_ledger` | **COMPLETE** | Read-only movement history |
| Warehouse | ledger | goliveInventoryLedger | `/warehouse/inventory/ledger` | `InventoryLedgerPage.jsx` | `movementLedgerReportService.js` | `sc_inventory_ledger` | **COMPLETE** | Ledger from Express sync |
| Warehouse | adjustment | goliveStockAdjustment | `/warehouse/inventory/adjustment` | `StockAdjustmentPage.jsx` | `stockAdjustmentService.js` | `sc_stock_adjustment_requests` | **COMPLETE** | REQUEST_ONLY — no posting |
| Warehouse | cyclecount | goliveCycleCount | `/warehouse/inventory/cycle-count` | `StockCountPage.jsx` | `stockCountService.js` | — | **COMPLETE** | Cycle count workbench |
| Warehouse | expiry | pgExpiry | `/warehouse/inventory/lot-expiry` | `LotExpiryControlPage.jsx` | `storageAgingReportService.js` | — | **COMPLETE** | Lot/expiry aging |
| Warehouse | receiving | goliveReceiving | `/warehouse/wms/receiving` | `ReceivingPage.jsx` | `receivingService.js` | `sc_receiving_confirm_requests` | **COMPLETE** | Schedule read; confirm REQUEST_ONLY |
| Warehouse | putaway | golivePutaway | `/warehouse/wms/putaway` | `PutawayPage.jsx` | `putawayService.js` | — | **COMPLETE** | Putaway workbench |
| Warehouse | transfer | goliveTransfer | `/warehouse/wms/transfer` | `TransferPage.jsx` | `transferService.js` | `sc_express_transfers` | **COMPLETE** | Internal transfer read |
| Warehouse | picking | golivePickingPacking | `/warehouse/wms/picking-packing` | `PickingPackingPage.jsx` | `pickingService.js` | `sc_so_pick_pack_candidate_view` | **COMPLETE** | Pick list; confirm pick SAFE MODE |
| Warehouse | dispatch | goliveDispatchGi | `/warehouse/wms/dispatch-goods-issue` | `DispatchGoodsIssuePage.jsx` | `dispatchService.js` | — | **COMPLETE** | GI preview SAFE MODE |
| Warehouse | scan | goliveScanCenter | `/warehouse/wms/scan-center` | `ScanCenterPage.jsx` | `scanCenterService.js` | — | **COMPLETE** | Local scan log only |
| Warehouse | handheld | goliveHandheld | `/warehouse/wms/handheld` | `HandheldOperationsPage.jsx` | `handheldReceivingService.js` | — | **COMPLETE** | Handheld hub |

Stock adjustment, receiving confirmation, goods issue, pick confirm, and WMS posting: **REQUEST_ONLY** / **SAFE MODE** (`express_queue_status = blocked_by_governance` where applicable). No Express write-back.

---

## Consignment / modern trade

| Module | Menu key | Handler | Route | Page | Service | Migration | Status | Notes |
|--------|----------|---------|-------|------|---------|-----------|--------|-------|
| Consignment | consi | pgConsignment | `/consignment` | `ConsignmentDashboardPage.jsx` | `consignmentService.js` | `009` sales summary view | **COMPLETE** | Legacy pgConsignment KPIs + grouped table |
| Consignment | consi_so | goliveConsignmentSo | `/consignment/so` | `ConsignmentSOPage.jsx` | `consignmentService.js` | `sc_consi_so_requests` | **COMPLETE** | SO read + REQUEST_ONLY |
| Consignment | branch_stock | goliveBranchStock | `/consignment/branch-stock` | `BranchStockPage.jsx` | `branchStockService.js` | `sc_web_consi_branch_stock_view` | **COMPLETE** | Branch stock from SO lines |
| Consignment | consi_movement | goliveConsignmentMovement | `/consignment/movement` | `ConsignmentMovementPage.jsx` | `consignmentMovementService.js` | `sc_consi_movement_requests` | **COMPLETE** | Temp DN workbench |
| Consignment | sell_out | goliveSellOut | `/consignment/sell-out` | `SellOutRecordPage.jsx` | `sellOutService.js` | `sc_consi_sell_out_requests` | **COMPLETE** | Sell-out REQUEST_ONLY |
| Consignment | return_branch | goliveReturnFromBranch | `/consignment/return-from-branch` | `ReturnFromBranchPage.jsx` | `consignmentReturnCnService.js` | `sc_consi_return_branch_requests` | **COMPLETE** | Return REQUEST_ONLY |
| Consignment | return_cn | goliveConsignmentReturnCn | `/consignment/return-cn` | `ConsignmentReturnCNPage.jsx` | `consignmentReturnCnService.js` | `sc_consi_return_cn_requests` | **COMPLETE** | CONSI CN REQUEST_ONLY |

Express consignment SO/CN/stock write-back: **BLOCKED_BY_GOVERNANCE** — all write actions use Supabase request tables with `express_queue_status = blocked_by_governance`.

---

## Master data

| Module | Menu key | Handler | Route | Page | Status | Gap |
|--------|----------|---------|-------|------|--------|-----|
| Master Data | skuadmin | pgSKUAdmin | `/master-data/sku-settings` | `SKUSettingsPage.jsx` | **PARTIAL** | OperationsPreviewPage shell |
| Master Data | groups | pgGroupAdmin | — | — | **BLOCKED_BY_GOVERNANCE** | Group admin not migrated |

---

## System / admin

| Module | Menu key | Handler | Route | Page | Status | Gap |
|--------|----------|---------|-------|------|--------|-----|
| Admin | reports | pgReports | `/executive/management` | `ManagementDashboardPage.jsx` | **PARTIAL** | Reports merged into dashboard |
| Admin | users | pgUsers | — | `UserPage.jsx` (unwired) | **BLOCKED_BY_GOVERNANCE** | Auth module not in scope |
| Admin | perms | pgPerms | — | `RolePermissionPage.jsx` (unwired) | **BLOCKED_BY_GOVERNANCE** | Auth module not in scope |
| Admin | auditlog | pgAudit | — | `AuditLogPage.jsx` (unwired) | **BLOCKED_BY_GOVERNANCE** | Route not in navigation |

---

## Legacy pg* functions not yet in registry

These exist in `index.html` but need explicit registry rows in future audits:

- `pgCrWorkflowSettings` — customer registration approver settings

---

## Newly implemented (Consignment completion pass)

- `supabase/migrations/009_consignment_modern_trade.sql` — CONSI read views + request tables
- `src/constants/consignmentLegacy.js` — legacy pgConsignment constants
- `src/services/consignment/consignmentService.js` — dashboard + SO requests
- `src/services/consignment/branchStockService.js` — `sc_web_consi_branch_stock_view`
- `src/services/consignment/consignmentMovementService.js` — movement read + temp DN requests
- `src/services/consignment/sellOutService.js` — sell-out requests
- `src/services/consignment/consignmentReturnCnService.js` — return branch + CONSI CN requests
- Rewrote all 7 consignment pages (removed OperationsPreviewPage shells)
- Updated `scripts/audit/legacy-registry.js` — 7 Consignment entries
- `tests/unit/consignment-module-completion.test.jsx`

## Newly implemented (Warehouse completion pass)

- `supabase/migrations/008_warehouse_inventory_read_models.sql` — `sc_stock_adjustment_requests`, `sc_receiving_confirm_requests`, `sc_inventory_ledger` view
- `src/services/warehouse/warehouseInventoryService.js` — balance/available from `sc_inventory_balance_view` + seed fallback
- `src/services/warehouse/stockAdjustmentService.js` — adjustment **requests** only (blocked_by_governance)
- `src/services/warehouse/receivingService.js` — receiving schedule from `sc_express_transfers` + seed
- `src/services/warehouse/wmsDashboardService.js` — WMS KPIs from `sc_web_stock_balance_view`
- `src/services/warehouse/scanCenterService.js` — local scan log (safe mode, no posting)
- `src/components/scm-ui/SafeModeActionPanel.jsx` — blocked WMS actions (pick confirm, GI preview)
- Rewrote `StockBalancePage.jsx`, `WMSDashboardPage.jsx`, `StockAdjustmentPage.jsx`, `ReceivingPage.jsx`, `AvailableStockPage.jsx`, `ScanCenterPage.jsx`
- Updated `PickingPackingPage.jsx`, `DispatchGoodsIssuePage.jsx` — removed OperationsPreviewPage posting tabs
- Updated `scripts/audit/legacy-registry.js` — 15 Warehouse entries with service/migration/test patterns
- `tests/unit/warehouse-module-completion.test.jsx`

## Newly implemented (Planning completion pass)

- `supabase/migrations/007_planning_read_models.sql` — `sc_reservations`, `sc_inventory_balance_view`, `sc_so_pick_pack_candidate_view`, planning request tables
- `src/services/planning/stockPlanningService.js` — legacy pgPlanStock benchmarks from read models + forecasts
- `src/services/planning/atpWorkbenchService.js` — ATP from `sc_web_atp_view` with reservation deduction
- `src/constants/stockPlanningLegacy.js` — `PS_CRITS_ALL` from legacy index.html
- Rewrote `StockPlanningPage.jsx`, `ATPWorkbenchPage.jsx` (removed hardcoded demo rows)
- Updated `scripts/audit/legacy-registry.js` — Demand, ATP, Shortage + service/migration/test patterns
- `tests/unit/planning-module-completion.test.jsx`

## Newly implemented (Sales completion pass)

- `supabase/migrations/006_sales_forecast_return_sample.sql`
- `src/services/sales/salesForecastService.js` — Supabase + localStorage fallback
- `src/services/sales/returnCnService.js` — full CN/return request workflow
- `src/services/sales/sampleConsumableService.js` — legacy pgSample workflow
- `src/services/customerMap/customerMapService.js` — pgCustMap = pgMySales sales summary
- Rewrote `CustomerMapPage.jsx`, `ReturnCNPage.jsx`, `SampleConsumablePage.jsx`
- Updated `SalesForecastPage.jsx` — Supabase service integration
- `tests/unit/sales-module-completion.test.jsx`

## Newly implemented (prior session)

- `scripts/audit/legacy_function_coverage_check.js` + `legacy-registry.js`
- `npm run legacy:audit`
- `docs/legacy-function-coverage-check-result.md` / `.json`
- `docs/26_LEGACY_COMPLETE_FUNCTION_INVENTORY.md` (this file)
- `tests/unit/legacy-function-coverage-controller.test.js`
- Customer Registration: existing customer search, snapshot, proposed changes, `credit_change`, `CR_DOC_SLOTS`, metadata-only attachments, `final_note`
- `supabase/migrations/005_customer_registration_snapshot.sql`
- `src/constants/customerRegistrationLegacy.js`

---

## Verification commands

```bash
npm run legacy:audit
npm test
npm run build
```

---

## Safety confirmations

- No service role key added to frontend (anon client only)
- No Express DBF / ARMAS / SO / CN write-back added
- Customer Registration stores requests in Supabase only
- Attachment uploads: metadata-only when `VITE_SUPABASE_STORAGE_BUCKET` is unset

---

## Priority backlog (auto-implementation order)

**A. Sales:** ✅ Complete  
**B. Planning:** ✅ Complete (routable entries); prod plan/summary/doc remain BLOCKED  
**C. Warehouse:** ✅ Complete (15/15 routable entries); all posting actions REQUEST_ONLY / SAFE MODE  
**D. Consignment:** ✅ Complete (7/7 routable entries); SO/CN/stock posting BLOCKED_BY_GOVERNANCE  
**E. Master Data:** SKU settings, group admin  
**F. Admin:** Wire user/perm/audit routes when auth module approved

Regenerate this inventory after each audit: `npm run legacy:audit`
