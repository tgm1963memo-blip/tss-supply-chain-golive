# Human UAT Sign-off

Phase **3D** template · Phase **3E** execution tracking.

Complete this document during a **human walkthrough** with operations, IT, and business stakeholders. Automated Phase 3C passed 16/16 pages; this record captures real-world confirmation before production deployment.

**Tracking status:** Human UAT is **In Progress** (Phase 3E). Sign-off fields below are execution-ready — fill in during the walkthrough session.

---

## Execution session (fill during walkthrough)

| Field | Value |
|-------|-------|
| **Human UAT session date** | _YYYY-MM-DD_ |
| **Tester name** | |
| **Department** | |
| **Device used** | e.g. Desktop Chrome / iPhone Safari / Android Chrome |
| **Room code used** | TSS (default) |
| **Environment** | Staging / Production Supabase |
| **App version / branch** | tss-supply-chain-golive |
| **Supabase health** | ok / connection_error / missing_env |

---

## Real document numbers tested

Record actual identifiers observed during the session (minimum one per module group).

| Module | Document / SKU / customer observed | Verified live? |
|--------|-----------------------------------|:--------------:|
| Sales (SO) | e.g. SO-________ | ☐ |
| Inventory / stock | e.g. product code ________ | ☐ |
| Reservation | e.g. reservation id / SO line ________ | ☐ |
| WMS picking | e.g. picking no ________ | ☐ |
| WMS dispatch | e.g. dispatch no ________ | ☐ |
| Master data — customer | e.g. customer code ________ | ☐ |
| Master data — product | e.g. product code ________ | ☐ |

---

## Module walkthrough checklist

| Module | Pages | Walked? | Notes |
|--------|-------|:-------:|-------|
| Executive Dashboard | Management, Sales Overview | ☐ | |
| Sales | Sales Order, Sales Forecast | ☐ | |
| Planning | ATP, Reservation, Shortage Review | ☐ | |
| Inventory | Stock Balance, Available Stock, Stock Movement | ☐ | |
| WMS | Dashboard, Picking & Packing, Dispatch / GI | ☐ | WMS Dashboard = preview only (UAT-003) |
| Consignment | CONSI Dashboard | ☐ | Preview only (UAT-003) |
| Master Data | Customer Master, Product Master | ☐ | |
| Admin / Control | System Control | ☐ | Supabase health ok |

---

## UAT sign-off checklist

Check each item during the walkthrough. All items should pass for a **GO** decision unless noted as accepted limitation.

| # | Check | Pass? | Notes |
|---|-------|:-----:|-------|
| 1 | `.env.local` configured; System Control shows Supabase **ok** | ☐ | |
| 2 | Safe-mode banner visible on executive / planning pages | ☐ | |
| 3 | Express Weight pages show **DESIGN ONLY / SAFE MODE** | ☐ | |
| 4 | No stock posting, GI, or ledger write actions succeed | ☐ | |
| 5 | No Express DBF write-back attempted | ☐ | |
| 6 | All 16 scope pages open without crash | ☐ | See table below |
| 7 | Live data visible where Supabase-backed (not preview-only) | ☐ | |
| 8 | Mobile spot-check — navigation + one table page readable | ☐ | |
| 9 | Accepted limitations understood (WMS / CONSI preview) | ☐ | UAT-003 |
| 10 | Reservation governance decision recorded | ☐ | UAT-004 → `docs/14_GOLIVE_DECISION_REGISTER.md` DEC-001 |

---

## Pages walked through

Record each page visited and at least one **real document number**, SKU, or customer code observed.

| # | Page | Route | Real data observed (doc no / SKU / customer) | Result |
|---|------|-------|---------------------------------------------|--------|
| 1 | Management Dashboard | `/executive/management` | | ☐ PASS |
| 2 | Sales Overview | `/executive/sales-overview` | | ☐ PASS |
| 3 | Sales Order | `/sales/orders` | | ☐ PASS |
| 4 | Sales Forecast | `/sales/forecast` | | ☐ PASS |
| 5 | Stock Balance | `/warehouse/inventory/balance` | | ☐ PASS |
| 6 | Available Stock | `/warehouse/inventory/available` | | ☐ PASS |
| 7 | Stock Movement | `/warehouse/inventory/movement` | | ☐ PASS |
| 8 | ATP Workbench | `/planning/atp` | | ☐ PASS |
| 9 | Reservation Workbench | `/planning/reservation` | | ☐ PASS |
| 10 | Shortage Review | `/planning/shortage-review` | | ☐ PASS |
| 11 | WMS Dashboard | `/warehouse/wms` | _Preview only — note limitation_ | ☐ PASS |
| 12 | Picking & Packing | `/warehouse/wms/picking-packing` | | ☐ PASS |
| 13 | Dispatch / Goods Issue | `/warehouse/wms/dispatch-goods-issue` | | ☐ PASS |
| 14 | CONSI Dashboard | `/consignment` | _Preview only — note limitation_ | ☐ PASS |
| 15 | Customer Master | `/master-data/customers` | | ☐ PASS |
| 16 | Product Master | `/master-data/products` | | ☐ PASS |

---

## Mobile spot-check

| Device / browser | Pages checked | Layout OK? | Notes |
|------------------|---------------|:----------:|-------|
| _Device 1_ | Executive + Sales Order + Stock Balance | ☐ | |
| _Device 2_ | Planning + Warehouse menu | ☐ | |

---

## Issues found (human session)

Log any new issues here. Copy blockers to `docs/12_LIVE_READONLY_UAT_ISSUE_LOG.md`.

| Issue # | Page | Severity | Description | Status |
|---------|------|----------|-------------|--------|
| — | — | — | _None recorded yet_ | — |
| UAT-004 | Reservation Workbench | Medium | Governance decision pending — see below | Open |

---

## Sign-off decision

Select **one**:

| Decision | Meaning | Selected |
|----------|---------|:--------:|
| **GO** | All checks pass; deploy read-only golive | ☐ |
| **GO WITH LIMITATION** | Deploy with documented accepted limitations (UAT-003 preview; UAT-004 partial safe mode until governance implemented) | ☐ |
| **HOLD** | Blockers found — log in `docs/12_LIVE_READONLY_UAT_ISSUE_LOG.md` | ☐ |

| Field | Value |
|-------|-------|
| **Decision selected** | _pending_ |
| **Decision date** | |
| **Conditions / notes** | |

---

## Reservation governance decision (UAT-004)

**Current behavior (unchanged in Phase 3E — tracking only):**

- **Create reservation:** enabled
- **Release reservation:** disabled (safe mode)
- **Stock posting / Express write-back:** disabled

Select **one** option. Record final choice in `docs/14_GOLIVE_DECISION_REGISTER.md` (DEC-001).

| Option | Description | Selected |
|--------|-------------|:--------:|
| **A** | Planner can create **active** reservation; manager release/cancel | ☐ |
| **B** | Planner creates **draft** reservation; manager activates/releases/cancels | ☐ **Recommended default** |
| **C** | Reservation create **disabled** for first go-live | ☐ |
| **D** | Other: _______________________ | ☐ |

| Field | Value |
|-------|-------|
| **Recommended default** | **Option B** — Planner creates draft; manager activates/releases/cancels |
| **Governance decision** | _pending_ |
| **Approved by (name / role)** | |
| **Approval date** | |
| **Implementation** | Phase 4+ only — **do not implement in Phase 3E** |

---

## Sign-off

| Role | Name | Department | Signature | Date |
|------|------|------------|-----------|------|
| Operations UAT lead | | | | |
| IT / Supabase admin | | | | |
| Business owner | | | | |
| Project sponsor | | | | |

---

## After sign-off

1. Update `src/services/system/uatStatusService.js`:
   - `HUMAN_UAT_STATUS.status` → `'signed_off'` when complete (currently `'in_progress'`)
   - `HUMAN_UAT_STATUS.signedOff` → `true`
   - `HUMAN_UAT_STATUS.decision` → `'go'` | `'go_with_limitation'` | `'hold'`
   - `HUMAN_UAT_STATUS.reservationGovernance` → `'A'` | `'B'` | `'C'` | `'D'`
2. Update `docs/14_GOLIVE_DECISION_REGISTER.md` with selected options and dates.
3. Update System Control — Human UAT section reflects new status.

---

## Related documents

- Decision register: `docs/14_GOLIVE_DECISION_REGISTER.md`
- Automated UAT: `docs/11_LIVE_READONLY_UAT_EXECUTION.md`
- Issue log: `docs/12_LIVE_READONLY_UAT_ISSUE_LOG.md`
- Validation plan: `docs/10_LIVE_READONLY_VALIDATION_PLAN.md`
- System Control: `/admin/system-control`
