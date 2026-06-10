# Legacy Function Coverage Check Result

Generated: 2026-06-10T03:02:10.491Z

Legacy source: `C:\Users\TSS\OneDrive\เดสก์ท็อป\IT\Code old project\tgm-supplychain\index.html`

## Summary

| Metric | Count |
|--------|------:|
| Legacy pg* functions in index.html | 24 |
| Registry entries audited | 29 |
| COMPLETE | 15 |
| PARTIAL | 7 |
| MISSING | 0 |
| BLOCKED_BY_GOVERNANCE | 7 |

## Critical missing

_None — all critical handlers have route + page mapping._

## Registry entries

| Module | Menu | Handler | Route | Page | Service | Migration | Tests | Status | Gap |
|--------|------|---------|-------|------|---------|-----------|-------|--------|-----|
| Executive | dash | pgDash | ✓ | ✓ | ✓ | ✓ | ✗ | **PARTIAL** | No dedicated test coverage found |
| Sales | mysales | pgMySales | ✓ | ✓ | ✓ | ✓ | ✓ | **COMPLETE** | None |
| Sales | forecast | pgForecast | ✓ | ✓ | ✓ | ✓ | ✓ | **COMPLETE** | None |
| Sales | custmap | pgCustMap | ✓ | ✓ | ✓ | ✓ | ✓ | **COMPLETE** | None |
| Sales | custreg | pgCustReg | ✓ | ✓ | ✓ | ✓ | ✓ | **COMPLETE** | None |
| Sales | sample | pgSample | ✓ | ✓ | ✓ | ✓ | ✓ | **COMPLETE** | None |
| Sales | sales_order | pgPlanBooking | ✓ | ✓ | ✓ | ✓ | ✓ | **COMPLETE** | None |
| Sales | promotions | promotions | ✓ | ✓ | ✓ | ✓ | ✓ | **COMPLETE** | None |
| Sales | return_cn | return_cn | ✓ | ✓ | ✓ | ✓ | ✓ | **COMPLETE** | None |
| Consignment | consi | pgConsignment | ✓ | ✗ | ✗ | ✗ | ✗ | **PARTIAL** | Page is PlaceholderCard or OperationsPreviewPage shell only; Service layer missing; Supabase migration/table/view missing; No dedicated test coverage found |
| Planning | demand | goliveDemandPlan | ✓ | ✓ | ✓ | ✓ | ✓ | **COMPLETE** | None |
| Planning | atp | goliveAtpWorkbench | ✓ | ✓ | ✓ | ✓ | ✓ | **COMPLETE** | None |
| Planning | shortage | goliveShortageReview | ✓ | ✓ | ✓ | ✓ | ✓ | **COMPLETE** | None |
| Planning | planstock | pgPlanStock | ✓ | ✓ | ✓ | ✓ | ✓ | **COMPLETE** | None |
| Planning | po | pgPO | ✓ | ✓ | ✓ | ✓ | ✓ | **COMPLETE** | None |
| Planning | planbook | pgPlanBooking | ✓ | ✓ | ✓ | ✓ | ✓ | **COMPLETE** | None |
| Planning | booksummary | pgBookingSummary | ✓ | ✓ | ✓ | ✓ | ✓ | **COMPLETE** | None |
|  | prodplan | pgProdPlan | ✗ | ✗ | ✗ | ✗ | ✗ | **BLOCKED_BY_GOVERNANCE** | No golive route mapped yet — planning module gap |
|  | prodsummary | pgProdSummary | ✗ | ✗ | ✗ | ✓ | ✗ | **BLOCKED_BY_GOVERNANCE** | No golive route mapped yet — planning module gap |
|  | forecastdoc | pgForecastDoc | ✗ | ✗ | ✗ | ✗ | ✗ | **BLOCKED_BY_GOVERNANCE** | Forecast document workflow not migrated |
| Warehouse | wms | pgWMS | ✓ | ✗ | ✓ | ✓ | ✗ | **PARTIAL** | Page is PlaceholderCard or OperationsPreviewPage shell only; No dedicated test coverage found |
| Warehouse | stock | pgStock | ✓ | ✓ | ✓ | ✓ | ✗ | **PARTIAL** | No dedicated test coverage found |
| Warehouse | expiry | pgExpiry | ✓ | ✓ | ✓ | ✓ | ✗ | **PARTIAL** | No dedicated test coverage found |
| Master Data | skuadmin | pgSKUAdmin | ✓ | ✗ | ✗ | ✗ | ✗ | **PARTIAL** | Page is PlaceholderCard or OperationsPreviewPage shell only; Service layer missing; Supabase migration/table/view missing; No dedicated test coverage found |
|  | groups | pgGroupAdmin | ✗ | ✗ | ✗ | ✗ | ✗ | **BLOCKED_BY_GOVERNANCE** | Group admin not migrated — master data gap |
| Admin | reports | pgReports | ✓ | ✓ | ✓ | ✓ | ✗ | **PARTIAL** | No dedicated test coverage found |
|  | users | pgUsers | ✗ | ✓ | ✗ | ✗ | ✗ | **BLOCKED_BY_GOVERNANCE** | User admin route not in navigation — NOT_IN_SCOPE until auth module |
|  | perms | pgPerms | ✗ | ✓ | ✗ | ✗ | ✗ | **BLOCKED_BY_GOVERNANCE** | Permissions admin route not in navigation |
|  | auditlog | pgAudit | ✗ | ✓ | ✗ | ✓ | ✗ | **BLOCKED_BY_GOVERNANCE** | Audit log route not wired in navigation |

## Workflow / sub-functions

| Function | Parent | Mapped | Tests | Status | Gap |
|----------|--------|--------|-------|--------|-----|
| _crSave | custreg | ✓ | ✓ | **COMPLETE** | — |
| crConfirmApproval | custreg | ✓ | ✓ | **COMPLETE** | — |
| CR_DOC_SLOTS | custreg | ✓ | ✓ | **COMPLETE** | — |
| custreg_subs | custreg | ✓ | ✓ | **COMPLETE** | — |

## All pg* functions found in legacy index.html

- `pgAudit`
- `pgBookingSummary`
- `pgConsignment`
- `pgCrWorkflowSettings`
- `pgCustMap`
- `pgCustReg`
- `pgDash`
- `pgExpiry`
- `pgForecast`
- `pgForecastDoc`
- `pgGroupAdmin`
- `pgMySales`
- `pgPO`
- `pgPerms`
- `pgPlanBooking`
- `pgPlanStock`
- `pgProdPlan`
- `pgProdSummary`
- `pgReports`
- `pgSKUAdmin`
- `pgSample`
- `pgStock`
- `pgUsers`
- `pgWMS`