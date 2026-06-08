# Live Read-only Validation Plan

Phase **3B** — structured UAT for read-only validation against live Supabase data.

## Preconditions

- [ ] `.env.local` configured per `docs/09_SUPABASE_ENV_SETUP.md`
- [ ] **Admin / Control → System Control** shows connection status **ok**
- [ ] Supabase RLS policies allow **anon read** on views used by golive pages
- [ ] Test user understands **safe mode**: no writes, no posting, no Express DBF sync

## Validation legend

| Symbol | Meaning |
|--------|---------|
| ☐ | Not tested |
| ✅ | Pass — data loads, UI stable, read-only enforced |
| ⚠️ | Partial — loads with warnings or seed fallback |
| ❌ | Fail — error, crash, or unexpected write |

Record tester name, date, room code (default `TSS`), and notes for each section.

---

## 1. Management Dashboard

**Route:** `/executive/management`

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1.1 | Page loads without console errors | ☐ | |
| 1.2 | KPI cards show numeric values (not all `—`) | ☐ | |
| 1.3 | Fulfillment pipeline table shows counts | ☐ | |
| 1.4 | Safe-mode warning visible | ☐ | |
| 1.5 | No write/post actions enabled | ☐ | |

---

## 2. Sales Overview (Executive)

**Route:** `/executive/sales-overview`

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 2.1 | SO metrics load from live data | ☐ | |
| 2.2 | Top customers / products tables populated | ☐ | |
| 2.3 | Filters refresh data correctly | ☐ | |
| 2.4 | Read-only — no SO create/edit | ☐ | |

---

## 3. Sales Order

**Routes:** `/sales/orders`, `/sales/orders/:orderId`

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 3.1 | Order list loads with real document numbers | ☐ | |
| 3.2 | Search/filter works | ☐ | |
| 3.3 | Detail page shows header + lines | ☐ | |
| 3.4 | No create/cancel/post buttons active | ☐ | |

---

## 4. Sales Forecast

**Route:** `/sales/forecast`

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 4.1 | Forecast grid renders | ☐ | |
| 4.2 | SKU/month cells editable only if designed (read-only mode) | ☐ | |
| 4.3 | Export/preview works without server write | ☐ | |

---

## 5. Stock Balance

**Route:** `/warehouse/inventory/balance`

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 5.1 | Balance rows from `sc_inventory_balance_view` | ☐ | |
| 5.2 | Room/product/warehouse filters work | ☐ | |
| 5.3 | on_hand / reserved / available columns sensible | ☐ | |
| 5.4 | No adjustment/post actions | ☐ | |

---

## 6. Available Stock

**Route:** `/warehouse/inventory/available`

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 6.1 | Available qty view loads | ☐ | |
| 6.2 | Shortage / available filters work | ☐ | |
| 6.3 | Matches balance view totals (spot check 3 SKUs) | ☐ | |

---

## 7. Stock Movement

**Route:** `/warehouse/inventory/movement`

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 7.1 | Movement list/report loads | ☐ | |
| 7.2 | Date/product filters work | ☐ | |
| 7.3 | Read-only — no movement posting | ☐ | |

---

## 8. ATP Workbench

**Route:** `/planning/atp`

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 8.1 | ATP rows calculated (not seed banner) | ☐ | |
| 8.2 | Formula ATP = On Hand − Reserved − Pending SO spot-check | ☐ | |
| 8.3 | No reserve/PO/production actions | ☐ | |

---

## 9. Reservation Workbench

**Route:** `/planning/reservation`

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 9.1 | SO reservation candidates load | ☐ | |
| 9.2 | Fulfillment location candidates load | ☐ | |
| 9.3 | Active reservations list loads | ☐ | |
| 9.4 | Safe mode — create reservation blocked or preview-only | ☐ | |

---

## 10. Shortage Review

**Route:** `/planning/shortage-review`

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 10.1 | Shortage lines display | ☐ | |
| 10.2 | Quantities align with pick-pack / demand views | ☐ | |
| 10.3 | No PO/production create from this screen | ☐ | |

---

## 11. WMS Dashboard

**Route:** `/warehouse/wms`

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 11.1 | Dashboard preview loads | ☐ | |
| 11.2 | Links to receiving/putaway/picking work | ☐ | |
| 11.3 | Document counts plausible | ☐ | |

---

## 12. Picking & Packing

**Route:** `/warehouse/wms/picking-packing`

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 12.1 | Pick list candidates load | ☐ | |
| 12.2 | Picking documents tab loads | ☐ | |
| 12.3 | Confirm pick / pack actions read-only or disabled | ☐ | |

---

## 13. Dispatch / Goods Issue

**Route:** `/warehouse/wms/dispatch-goods-issue`

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 13.1 | Dispatch document list loads | ☐ | |
| 13.2 | GI preview read-only | ☐ | |
| 13.3 | No goods issue posting | ☐ | |

---

## 14. CONSI Dashboard

**Route:** `/consignment`

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 14.1 | CONSI dashboard tabs render | ☐ | |
| 14.2 | Branch stock / movement preview data loads | ☐ | |
| 14.3 | Sell-out / return preview read-only | ☐ | |

---

## 15. Customer Master

**Route:** `/master-data/customers`

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 15.1 | Customer list loads | ☐ | |
| 15.2 | Search returns expected customers | ☐ | |
| 15.3 | ERP linked rows visible where applicable | ☐ | |
| 15.4 | No create/update/delete | ☐ | |

---

## 16. Product Master

**Route:** `/master-data/products`

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 16.1 | Product list loads | ☐ | |
| 16.2 | Search/filter works | ☐ | |
| 16.3 | Aliases / UOM / ERP link display | ☐ | |
| 16.4 | No master data writes | ☐ | |

---

## Cross-cutting checks

| # | Check | Result | Notes |
|---|-------|--------|-------|
| C.1 | Remove `.env.local` → app still builds (`npm run build`) | ☐ | |
| C.2 | Without env → pages show warning, no crash | ☐ | |
| C.3 | Express Weight pages remain localStorage / safe mode | ☐ | |
| C.4 | No network calls to Express DBF write endpoints | ☐ | |

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Operations UAT | | | |
| IT / Supabase admin | | | |
| Business owner | | | |

---

## Next phase (after 3B)

**Phase 3C — UAT execution & governance**

1. Execute this checklist in staging/production Supabase project
2. Log defects with route, room code, and screenshot
3. Express Weight write-back governance review (`docs/08`)
4. Optional: retire legacy mock routes; backend tables for customer branch / room config
5. Phase 4: controlled write enablement (only after explicit sign-off — out of scope for golive read-only)
