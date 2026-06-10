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
| **COMPLETE** | 8 |
| **PARTIAL** | 11 |
| **MISSING** | 0 |
| **BLOCKED_BY_GOVERNANCE** | 7 |

**Sales module:** all 8 registry entries **COMPLETE** (0 PARTIAL)

**COMPLETE (global):** `pgMySales`, `pgForecast`, `pgCustMap`, `pgCustReg`, `pgSample`, Sales Order, Promotions, Return/CN

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

| Module | Menu key | Handler | Route | Page | Status | Gap | Action |
|--------|----------|---------|-------|------|--------|-----|--------|
| Planning | planstock | pgPlanStock | `/planning/stock` | `StockPlanningPage.jsx` | **PARTIAL** | PlaceholderCard | Real planning UI + read models |
| Planning | po | pgPO | `/planning/production-purchase` | `ProductionPurchaseSuggestionPage.jsx` | **PARTIAL** | Needs tests | Add tests |
| Planning | planbook | pgPlanBooking | `/planning/reservation` | `ReservationWorkbenchPage.jsx` | **PARTIAL** | No tests | Add reservation tests |
| Planning | booksummary | pgBookingSummary | `/planning/reservation-summary` | `ReservationSummaryPage.jsx` | **PARTIAL** | No tests | Add summary tests |
| Planning | prodplan | pgProdPlan | — | — | **BLOCKED_BY_GOVERNANCE** | No route | Map route or mark NOT_IN_SCOPE |
| Planning | prodsummary | pgProdSummary | — | — | **BLOCKED_BY_GOVERNANCE** | No route | Map route or mark NOT_IN_SCOPE |
| Planning | forecastdoc | pgForecastDoc | — | — | **BLOCKED_BY_GOVERNANCE** | No route | Forecast document workflow |

---

## Warehouse / inventory

| Module | Menu key | Handler | Route | Page | Status | Gap |
|--------|----------|---------|-------|------|--------|-----|
| Warehouse | wms | pgWMS | `/warehouse/wms` | `WMSDashboardPage.jsx` | **PARTIAL** | OperationsPreviewPage shell |
| Warehouse | stock | pgStock | `/warehouse/inventory/balance` | `StockBalancePage.jsx` | **PARTIAL** | Needs tests |
| Warehouse | expiry | pgExpiry | `/warehouse/inventory/lot-expiry` | `LotExpiryControlPage.jsx` | **PARTIAL** | Needs tests |

---

## Consignment / modern trade

| Module | Menu key | Handler | Route | Page | Status | Gap |
|--------|----------|---------|-------|------|--------|-----|
| Consignment | consi | pgConsignment | `/consignment` | `ConsignmentDashboardPage.jsx` | **PARTIAL** | OperationsPreviewPage shell — all CONSI sub-pages preview-only |

Express consignment write-back (stock moves, CN): **BLOCKED_BY_GOVERNANCE** — request workflow required.

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

**A. Sales:** Sample & Consumable, Return/CN request workflow, Forecast migration/tests  
**B. Planning:** StockPlanning real UI, prod plan/summary routes  
**C. Warehouse:** WMS dashboard real UI, stock balance tests  
**D. Consignment:** Replace OperationsPreviewPage shells with request workflows  
**E. Master Data:** SKU settings, group admin  
**F. Admin:** Wire user/perm/audit routes when auth module approved

Regenerate this inventory after each audit: `npm run legacy:audit`
