# Human UAT Sign-off

Phase **3D** template · Phase **3E** execution tracking · Phase **3F** walkthrough completion.

Complete this document during a **human walkthrough** with operations, IT, and business stakeholders. Automated Phase 3C passed 16/16 pages; this record captures real-world confirmation before production deployment.

**Tracking status:** Human UAT is **In Progress** (Phase 3F). Recommended go-live position: **GO WITH LIMITATION** — awaiting final human sign-off below.

---

## Final sign-off record (human results)

Fill this section when the walkthrough session is complete.

| Field | Value |
|-------|-------|
| **Session completed** | ☐ Yes · ☐ No |
| **Session date** | _YYYY-MM-DD_ |
| **Tester name(s)** | |
| **Department** | |
| **Device(s) used** | e.g. Desktop Chrome / iPhone Safari |
| **Room code used** | TSS (default) |
| **Environment** | Staging / Production Supabase |
| **Supabase health at session** | ok / connection_error / missing_env |

### Real document numbers tested

| Module | Document / SKU / customer observed | Verified live? |
|--------|-----------------------------------|:--------------:|
| Sales (SO) | | ☐ |
| Inventory / stock | | ☐ |
| Reservation | | ☐ |
| WMS picking | | ☐ |
| WMS dispatch | | ☐ |
| Master data — customer | | ☐ |
| Master data — product | | ☐ |

### Pages walked through (16 scope)

| # | Page | Route | Real data observed | Result |
|---|------|-------|-------------------|--------|
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
| 11 | WMS Dashboard | `/warehouse/wms` | _Preview only_ | ☐ PASS |
| 12 | Picking & Packing | `/warehouse/wms/picking-packing` | | ☐ PASS |
| 13 | Dispatch / Goods Issue | `/warehouse/wms/dispatch-goods-issue` | | ☐ PASS |
| 14 | CONSI Dashboard | `/consignment` | _Preview only_ | ☐ PASS |
| 15 | Customer Master | `/master-data/customers` | | ☐ PASS |
| 16 | Product Master | `/master-data/products` | | ☐ PASS |

### Mobile spot-check result

| Device / browser | Pages checked | Layout OK? | Result |
|------------------|---------------|:----------:|--------|
| | Executive + Sales Order + Stock Balance | ☐ | ☐ Pass · ☐ Fail |
| | Planning + Warehouse menu | ☐ | ☐ Pass · ☐ Fail |

**Mobile spot-check overall:** ☐ Pass · ☐ Fail · ☐ Not tested

### Issues found (human session)

| Issue # | Page | Severity | Description | Status |
|---------|------|----------|-------------|--------|
| UAT-004 | Reservation Workbench | Medium | Governance decision pending (DEC-001) | Open |
| | | | _Add new issues here_ | |

### Final decision

| Decision | Meaning | Selected |
|----------|---------|:--------:|
| **GO** | All checks pass; deploy read-only golive | ☐ |
| **GO WITH LIMITATION** | Deploy with UAT-003 preview + UAT-004 interim safe mode | ☐ **Recommended** |
| **HOLD** | Blockers — log in `docs/12_LIVE_READONLY_UAT_ISSUE_LOG.md` | ☐ |

| Field | Value |
|-------|-------|
| **Final decision selected** | _pending_ (recommended: **GO WITH LIMITATION**) |
| **Decision date** | |
| **Conditions / notes** | |

### Reservation governance (UAT-004 / DEC-001)

| Option | Description | Selected |
|--------|-------------|:--------:|
| **A** | Planner creates active reservation; manager release/cancel | ☐ |
| **B** | Planner creates draft; manager activates/releases/cancels | ☐ **Recommended** |
| **C** | Create disabled for first go-live | ☐ |
| **D** | Other: _______________ | ☐ |

| Field | Value |
|-------|-------|
| **Governance decision** | _pending_ (recommended: **Option B**) |
| **Approved by** | |
| **Approval date** | |

### Sign-off name / date

| Role | Name | Department | Signature | Date |
|------|------|------------|-----------|------|
| Operations UAT lead | | | | |
| IT / Supabase admin | | | | |
| Business owner | | | | |
| Project sponsor | | | | |

**Primary sign-off name:** _______________________

**Sign-off date:** _______________________

---

## Execution session (reference)

| Field | Value |
|-------|-------|
| **Human UAT session date** | _YYYY-MM-DD_ |
| **Tester name** | |
| **Department** | |
| **Device used** | |
| **App version / branch** | tss-supply-chain-golive |

---

## Module walkthrough checklist

| Module | Pages | Walked? | Notes |
|--------|-------|:-------:|-------|
| Executive Dashboard | Management, Sales Overview | ☐ | |
| Sales | Sales Order, Sales Forecast | ☐ | |
| Planning | ATP, Reservation, Shortage Review | ☐ | |
| Inventory | Stock Balance, Available Stock, Stock Movement | ☐ | |
| WMS | Dashboard, Picking & Packing, Dispatch / GI | ☐ | WMS Dashboard = preview (UAT-003) |
| Consignment | CONSI Dashboard | ☐ | Preview (UAT-003) |
| Master Data | Customer Master, Product Master | ☐ | |
| Admin / Control | System Control | ☐ | |

---

## UAT sign-off checklist

| # | Check | Pass? | Notes |
|---|-------|:-----:|-------|
| 1 | System Control shows Supabase **ok** | ☐ | |
| 2 | Safe-mode banner visible | ☐ | |
| 3 | Express Weight **DESIGN ONLY / SAFE MODE** | ☐ | DEC-002 approved |
| 4 | No stock posting / GI / ledger writes | ☐ | |
| 5 | No Express DBF write-back | ☐ | |
| 6 | All 16 pages open without crash | ☐ | |
| 7 | Live data where Supabase-backed | ☐ | |
| 8 | Mobile spot-check | ☐ | |
| 9 | WMS/CONSI preview limitation understood | ☐ | DEC-003 |
| 10 | Reservation governance recorded | ☐ | DEC-001 |

---

## After sign-off

When **Session completed = Yes** and sign-off names/dates are filled:

1. Update `src/services/system/uatStatusService.js`:
   - `HUMAN_UAT_STATUS.status` → `'signed_off'`
   - `HUMAN_UAT_STATUS.signedOff` → `true`
   - `HUMAN_UAT_STATUS.decision` → final decision value
   - `HUMAN_UAT_STATUS.reservationGovernance` → `'A'` | `'B'` | `'C'` | `'D'`
2. Update `docs/14_GOLIVE_DECISION_REGISTER.md` — DEC-001 and DEC-003 to **approved**.
3. Update `docs/15_GOLIVE_READINESS_CHECKLIST.md` — mark Human UAT and Final GO.
4. Update System Control — Human UAT section.

---

## Related documents

- Readiness checklist: `docs/15_GOLIVE_READINESS_CHECKLIST.md`
- Decision register: `docs/14_GOLIVE_DECISION_REGISTER.md`
- Automated UAT: `docs/11_LIVE_READONLY_UAT_EXECUTION.md`
- Issue log: `docs/12_LIVE_READONLY_UAT_ISSUE_LOG.md`
- System Control: `/admin/system-control`
