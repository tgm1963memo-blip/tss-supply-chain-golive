# Legacy Function Coverage Check Result

Generated: 2026-06-09T09:56:48.255Z

Legacy source: `C:\Users\TSS\OneDrive\เดสก์ท็อป\IT\Code old project\tgm-supplychain\index.html`

## Summary

| Metric | Count |
|--------|------:|
| Legacy pg* functions in index.html | 24 |
| Registry entries audited | 26 |
| COMPLETE | 3 |
| PARTIAL | 16 |
| MISSING | 0 |
| BLOCKED_BY_GOVERNANCE | 7 |

## Critical missing

_None — all critical handlers have route + page mapping._

## Registry entries

| Module | Menu | Handler | Route | Page | Service | Migration | Tests | Status | Gap |
|--------|------|---------|-------|------|---------|-----------|-------|--------|-----|
| Executive | dash | pgDash | ✓ | ✓ | ✓ | ✓ | ✗ | **PARTIAL** | No dedicated test coverage found |
| Sales | mysales | pgMySales | ✓ | ✓ | ✓ | ✓ | ✓ | **COMPLETE** | None |
| Sales | forecast | pgForecast | ✓ | ✓ | ✓ | ✗ | ✗ | **PARTIAL** | Supabase migration/table/view missing; No dedicated test coverage found |
| Sales | custmap | pgCustMap | ✓ | ✓ | ✓ | ✓ | ✗ | **PARTIAL** | No dedicated test coverage found |
| Sales | custreg | pgCustReg | ✓ | ✓ | ✓ | ✓ | ✓ | **COMPLETE** | None |
| Sales | sample | pgSample | ✓ | ✗ | ✗ | ✗ | ✗ | **PARTIAL** | Page is PlaceholderCard or OperationsPreviewPage shell only; Service layer missing; Supabase migration/table/view missing; No dedicated test coverage found |
| Sales | sales_order | pgPlanBooking | ✓ | ✓ | ✓ | ✓ | ✗ | **PARTIAL** | No dedicated test coverage found |
| Sales | promotions | promotions | ✓ | ✓ | ✓ | ✓ | ✓ | **COMPLETE** | None |
| Sales | return_cn | return_cn | ✓ | ✗ | ✗ | ✗ | ✗ | **PARTIAL** | Page is PlaceholderCard or OperationsPreviewPage shell only; Service layer missing; Supabase migration/table/view missing; No dedicated test coverage found |
| Consignment | consi | pgConsignment | ✓ | ✗ | ✗ | ✗ | ✗ | **PARTIAL** | Page is PlaceholderCard or OperationsPreviewPage shell only; Service layer missing; Supabase migration/table/view missing; No dedicated test coverage found |
| Planning | planstock | pgPlanStock | ✓ | ✗ | ✓ | ✓ | ✗ | **PARTIAL** | Page is PlaceholderCard or OperationsPreviewPage shell only; No dedicated test coverage found |
| Planning | po | pgPO | ✓ | ✓ | ✓ | ✓ | ✗ | **PARTIAL** | No dedicated test coverage found |
| Planning | planbook | pgPlanBooking | ✓ | ✓ | ✓ | ✗ | ✗ | **PARTIAL** | Supabase migration/table/view missing; No dedicated test coverage found |
| Planning | booksummary | pgBookingSummary | ✓ | ✓ | ✓ | ✓ | ✗ | **PARTIAL** | No dedicated test coverage found |
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