# Legacy Sales Function Completion Audit

**Date:** 2026-06-08  
**Legacy source:** `IT/Code old project/tgm-supplychain/index.html`  
**Current app:** `tss-supply-chain-golive`

## Legacy inspection confirmation

Legacy `index.html` was inspected for Sales menu functions. Key page handlers:

| Legacy key | Legacy title (PTITLES / menu) | Handler |
|------------|-------------------------------|---------|
| `mysales` | Sales Overview / ยอดขายของฉัน | `pgMySales()` |
| `forecast` | Sales Forecast | `pgForecast()` |
| `custmap` | Customer Map / สรุปยอดขาย | `pgCustMap()` → reuses `pgMySales()` layout |
| `custreg` | ข้อมูลลูกค้า / Customer Registration | `pgCustReg()` |
| `sample` | Sample / ของตัวอย่าง | `pgSample()` |
| SO / CN | via planbook, reports, consi modules | various |

Promotion (เคาะราคาหาง) is implemented separately in `SalesPromotionsPage.jsx` — not modified in this pass.

---

## Function-by-function audit

### 1. Sales Order

| Item | Value |
|------|-------|
| Legacy function | SO list / reservation via planbook context |
| Legacy fields/sections | Document no, customer, product, qty, reservation status |
| Current route | `/sales/orders`, `/sales/orders/:orderId` |
| Current page | `SalesOrderListPage.jsx`, `SalesOrderDetailPage.jsx` |
| Status | **COMPLETE** (read-only reservation candidates) |
| What was added | — (pre-existing) |
| Remaining gaps | Full Express SO create/edit not in scope (safe mode) |

### 2. Sales Order Detail

| Item | Value |
|------|-------|
| Legacy function | SO line detail |
| Current route | `/sales/orders/:orderId` |
| Current page | `SalesOrderDetailPage.jsx` |
| Status | **COMPLETE** |
| Remaining gaps | — |

### 3. Sales Forecast

| Item | Value |
|------|-------|
| Legacy function | `forecast` — forecast entry and documents |
| Legacy fields | Period, customer/product lines, forecast qty |
| Current route | `/sales/forecast` |
| Current page | `SalesForecastPage.jsx` |
| Status | **PARTIAL** — page exists; full legacy forecast doc workflow not migrated |
| Remaining gaps | `forecastdoc` linkage, team forecast views |

### 4. Sales Overview ⭐ (this pass)

| Item | Value |
|------|-------|
| Legacy function | `mysales` / `pgMySales()` |
| Legacy fields/sections | Date presets (week/month/year/custom), YoY toggle, search, salesperson filter, KPI row (total, qty, invoices, AR), tabs: รายลูกค้า / รายสินค้า / รายเซลส์, export Excel, AI insight card |
| Current route | `/sales/overview` |
| Current page | `SalesOverviewPage.jsx` |
| Service | `src/services/sales/salesOverviewService.js` |
| Status | **COMPLETE** (read-only analytics structure) |
| What was added | Full filter toolbar, 5 KPI cards, 3 chart panels, detail table, READ ONLY / SAFE MODE banners, service using `sc_web_sales_dashboard_view` + `sc_express_invoices` with graceful empty fallback |
| Remaining gaps | YoY compare, week navigator, Excel export, AI insight, product-group join from SO lines (amount often in `raw_data` only) |

### 5. Return / CN

| Item | Value |
|------|-------|
| Legacy function | CN / return documents |
| Current route | `/sales/return-cn` |
| Current page | `ReturnCNPage.jsx` → `OperationsPreviewPage` |
| Status | **PARTIAL** — preview scaffold only |
| Remaining gaps | CN request form, approval, link to Express ARTRN read model |

### 6. Customer Registration ⭐ (updated — legacy field rebuild)

| Item | Value |
|------|-------|
| Legacy function | `custreg` / `pgCustReg()` → stored in `custreg_subs` |
| Legacy wizard steps | ทั่วไป (crSec0), ร้านค้า (crSec1), ส่งสินค้า (crSec2), การเงิน (crSec3), เอกสาร (crSec4), สรุป (crSec5) |
| Legacy approval | `crConfirmApproval()` → `custreg_subs` with status pending/approved/rejected |
| Current route | `/sales/customer-registration` |
| Current page | `CustomerRegistrationPage.jsx` + `customer-registration.css` |
| Service | `customerRegistrationService.js` |
| Migration | `004_sales_customer_registration.sql` (+ additive ALTER columns) |
| Status | **COMPLETE** (legacy-mapped Supabase workflow) |

#### Legacy inspection — exact functions

- `pgCustReg()` — full-page wizard with sidebar steps
- `_crSave()` / `_crReset()` — persists `_cr.data` field ids
- `crConfirmApproval()` — pushes to `custreg_subs` (no Express ARMAS)
- `CR_DOC_SLOTS` — document slots: id-card, tax-cert, vat-20, map-doc, shop-photo, other-doc

#### Legacy sections → current tabs A–G

| Tab | Legacy source | Legacy field ids (sample) |
|-----|---------------|---------------------------|
| A Request Header | crSec0 | `_cr.docNo`, `cr-sales-owner`, `cr-c-new`, `cr-c-branch`, `cr-c-credit` |
| B Customer | crSec1 | `cr-shopname`, `cr-contact`, `cr-phone`, `cr-email`, `cr-st-*` store types |
| C Billing & Tax | crSec1 tax block | `cr-taxid`, `cr-branch`, `cr-addr`, `cr-zip`, `cr-tax-addr`, `cr-tax-zip`, `cr-vat-reg-date` |
| D Delivery | crSec2 | `cr-delplace`, `cr-receiver`, `cr-delphone`, `cr-deladdr`, `cr-tr-*`, `cr-route-*` |
| E Credit & Trade | crSec3 | `cr-pr-*`, `cr-disc`, `cr-crdays`, `cr-billdate`, `cr-bill-*`, `cr-pay-*`, `cr-inv-*` |
| F Attachments | crSec4 + CR_DOC_SLOTS | `cr-drive-link`, `cr-external-emails`, slot files + `cr-final-note` |
| G Approval | crSec5/6 + approve view | status, approvers, `cr-apv-note`, timeline |

#### Legacy `custreg_subs` snapshot fields

`docNo`, `shop`, `sales`, `salesUid`, `ownerSalesUid`, `requestType`, `existingCust`, `driveLink`, `externalEmails`, `taxAddr`, `taxZip`, `phone`, `taxid`, `crdays`, `price`, `date`, `note`, `finalNote`, `approvers[]`, `status`, `custcode`, `docs[]`

#### Previous gap (before this rebuild)

- Only section A visible with generic English tab labels
- Missing district/subdistrict, billing cycle, collection method, per-document attachment fields
- No legacy Thai section names or sidebar navigation

#### Fields added in this rebuild

- **Billing:** `district`, `subdistrict`
- **Delivery:** `branch_name`, full delivery contact block
- **Credit:** `billing_cycle` (cr-billdate), `collection_method` (cr-inv-*)
- **Attachments:** `doc_business_registration`, `doc_tax_certificate`, `doc_storefront_photo`, `doc_map_location`, `doc_other`, `internal_note`, `drive_link`
- **UI:** sidebar section nav A–G (Thai + EN), 2–4 column grids, sticky action bar, section cards

#### Remaining gaps

- OCR auto-fill (`crOcrApply`), binary file upload to slots, email mailto workflow, workflow settings tab

### 7. Customer Map

| Item | Value |
|------|-------|
| Legacy function | `custmap` — same sales dashboard layout as mysales |
| Current route | `/sales/customer-map` |
| Current page | `CustomerMapPage.jsx` |
| Status | **PARTIAL** — zone/province table view; not full legacy sales-by-territory |
| Remaining gaps | Reuse sales overview aggregates by customer geography |

### 8. Sample & Consumable

| Item | Value |
|------|-------|
| Legacy function | `sample` / `pgSample()` |
| Current route | `/sales/sample-consumable` |
| Current page | `SampleConsumablePage.jsx` |
| Status | **PARTIAL** — operations preview |
| Remaining gaps | Sample request form, approval, inventory link |

### 9. Promotion / เคาะราคาห้าง

| Item | Value |
|------|-------|
| Legacy function | promotion pricing workflow |
| Current route | `/sales/promotions` |
| Current page | `SalesPromotionsPage.jsx` |
| Status | **COMPLETE** (polished separately) |
| Remaining gaps | — (do not break) |

---

## Navigation verification

| Menu label | Path | Status |
|------------|------|--------|
| Sales Overview | `/sales/overview` | OK — `navigation.js` + `routes.jsx` |
| Customer Registration | `/sales/customer-registration` | OK |

No duplicate routes for these paths. Promotion remains at `/sales/promotions`.

---

## Safety verification

| Check | Result |
|-------|--------|
| Sales Overview Express write-back | None — read-only service |
| Customer Registration ARMAS update | None — Supabase tables only |
| Service role in React | Not used — anon client only |

---

## Files changed (this completion pass)

- `src/features/sales/SalesOverviewPage.jsx` — rewritten
- `src/features/sales/CustomerRegistrationPage.jsx` — legacy rebuild with sidebar A–G
- `src/features/sales/customer-registration.css` — compact workbench layout
- `src/services/sales/salesOverviewService.js` — new
- `src/services/sales/customerRegistrationService.js` — new
- `supabase/migrations/004_sales_customer_registration.sql` — new
- `docs/25_LEGACY_SALES_FUNCTION_COMPLETION_AUDIT.md` — new
- `tests/unit/sales-legacy-functions.test.jsx` — new

**Not modified:** `SalesPromotionsPage.jsx`, `sales-promotions.css`, promotion service/migration.
