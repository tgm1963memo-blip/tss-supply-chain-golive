# 03 — User Flow UAT Script

Use this script to walk business users through the mockup shell. Each step expects **MOCKUP** badge and static data — confirm users understand no actions persist.

## Pre-requisites

- Run `npm run dev` and open the app in browser
- Test on desktop (1280px) and mobile (375px) viewports

---

## Flow 1: Executive Overview (5 min)

1. Open `/` — Dashboard
2. Verify 4 summary cards and sales order table render
3. Read workflow, business rule, and next-step note panels
4. Confirm MOCKUP badge visible in page header and topbar

**Pass criteria:** User understands this is a planning shell, not live ERP.

---

## Flow 2: Order-to-Dispatch (15 min)

1. Navigate **Sales → Sales Orders** (`/sales/orders`)
2. Review order list columns: order no., customer, dates, status, shortage
3. Open **Order Detail** (`/sales/orders/SO-2026-001`)
4. Open **Reservation Workbench** (`/sales/reservation`)
5. Open **Shortage Alerts** (`/sales/shortage`)
6. Navigate **Planning → ATP Workbench** (`/planning/atp`)
7. Navigate **Inventory → Stock Balance** (`/inventory/balance`)
8. Navigate **WMS → Picking** (`/wms/picking`)
9. Navigate **WMS → Dispatch** (`/wms/dispatch`)

**Pass criteria:** User confirms workflow sequence and identifies missing fields/actions.

---

## Flow 3: Consignment Branch (10 min)

1. Open **Consignment Dashboard** (`/consignment`)
2. Review branch stock table
3. Open **Consignment SO** (`/consignment/so`)
4. Open **Consignment Movement** (`/consignment/movement`)
5. Open **Consignment Return / CN** (`/consignment/return-cn`)

**Pass criteria:** Branch-level columns and KPIs match business terminology.

---

## Flow 4: Sample & Consumable (8 min)

1. Open **Sample Request** (`/sample-consumable/sample`)
2. Open **Approval** (`/sample-consumable/approval`)
3. Open **Issue Confirm** (`/sample-consumable/issue`)
4. Open **Usage Report** (`/sample-consumable/usage`)

**Pass criteria:** Approval workflow steps make sense to requestor and approver roles.

---

## Flow 5: Master Data & Admin (10 min)

1. Open **Product Master** (`/master-data/products`)
2. Open **Customer Master** (`/master-data/customers`)
3. Open **Warehouse Master** (`/master-data/warehouses`)
4. Open **Admin → Sync Monitor** (`/admin/sync`)

**Pass criteria:** Master data fields align with Express ERP field names (capture gaps in notes).

---

## Flow 6: Mobile Warehouse (5 min)

1. Resize to mobile width
2. Open hamburger menu — verify all module groups accessible
3. Use bottom mobile nav — verify quick links work
4. Open **WMS → Barcode Scan** (`/wms/barcode`)
5. Scroll data table horizontally

**Pass criteria:** Touch targets ≥ 44px, no horizontal page overflow, table scrolls inside wrapper.

---

## UAT Sign-off Checklist

- [ ] All 47 routes visited
- [ ] Terminology review complete
- [ ] Missing screens documented
- [ ] Mobile WMS flows acceptable
- [ ] Stakeholder sign-off date: _______________
