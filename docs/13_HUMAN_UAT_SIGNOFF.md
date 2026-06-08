# Human UAT Sign-off

Phase **3D** — formal sign-off template for read-only golive validation.

Complete this document during a **human walkthrough** with operations, IT, and business stakeholders. Automated Phase 3C passed 16/16 pages; this record captures real-world confirmation before production deployment.

---

## Session information

| Field | Value |
|-------|-------|
| **Test date** | _YYYY-MM-DD_ |
| **Tester name** | |
| **Department** | |
| **Room code used** | TSS (default) |
| **Environment** | Staging / Production Supabase |
| **App version / branch** | tss-supply-chain-golive |
| **Supabase health** | ok / connection_error / missing_env |

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
| 10 | Reservation governance decision recorded | ☐ | UAT-004 |

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
| e.g. iPhone Safari | Executive + Sales Order + Stock Balance | ☐ | |
| e.g. Android Chrome | Planning + Warehouse menu | ☐ | |

---

## Overall decision

Select **one**:

| Decision | Meaning |
|----------|---------|
| ☐ **GO** | All checks pass; deploy read-only golive |
| ☐ **GO WITH LIMITATION** | Deploy with documented accepted limitations (UAT-003 preview pages; reservation partial safe mode until UAT-004 resolved) |
| ☐ **HOLD** | Blockers found — log in `docs/12_LIVE_READONLY_UAT_ISSUE_LOG.md` |

**Decision selected:** _______________________

**Decision date:** _______________________

**Conditions / notes:**

---

## Reservation governance decision (UAT-004)

Reservation Workbench current behavior (Phase 3D — **unchanged**):

- **Create reservation:** enabled
- **Release reservation:** disabled (safe mode)
- **Stock posting / Express write-back:** disabled

Select **one** governance option for post-golive phases:

| Option | Description | Selected |
|--------|-------------|:--------:|
| ☐ **Keep create enabled** | Maintain current partial safe mode; enable release only after separate sign-off |
| ☐ **Disable create** | Full read-only reservation workbench until governance approves writes |
| ☐ **Allow create only by role** | Restrict create to planning/admin roles via auth (future Phase 4+) |
| ☐ **Require manager approval** | Create flows queue for approval before Supabase RPC (future Phase 4+) |

**Governance decision:** _______________________

**Approved by (name / role):** _______________________

**Approval date:** _______________________

**Implementation phase:** _Do not implement until explicit Phase 4 sign-off_

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
   - `HUMAN_UAT_STATUS.status` → `'signed_off'` (or `'in_progress'` if walkthrough ongoing)
   - `HUMAN_UAT_STATUS.statusLabel` → `'Signed Off'` / `'In Progress'`
2. Update System Control page — Human UAT section reflects new status.
3. Archive completed PDF or signed scan alongside this file (optional).

---

## Related documents

- Automated UAT: `docs/11_LIVE_READONLY_UAT_EXECUTION.md`
- Issue log: `docs/12_LIVE_READONLY_UAT_ISSUE_LOG.md`
- Validation plan: `docs/10_LIVE_READONLY_VALIDATION_PLAN.md`
- System Control: `/admin/system-control`
