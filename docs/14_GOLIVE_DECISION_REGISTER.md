# Golive Decision Register

Phase **3E** register · Phase **3F** recommended positions for human approval.

Update final **Selected option** and **Status** when human sign-off completes (`docs/13_HUMAN_UAT_SIGNOFF.md`). **Do not implement system changes until Phase 4+ explicit approval.**

---

## Register format

| Column | Description |
|--------|-------------|
| **Decision ID** | Unique identifier (DEC-xxx) |
| **Topic** | Subject under decision |
| **Options** | Available choices |
| **Recommended selected option** | Project recommendation (Phase 3F) |
| **Selected option** | Final human-approved choice |
| **Decision owner** | Role accountable for sign-off |
| **Decision date** | Date decision confirmed |
| **Impact** | Business / technical effect |
| **Required system change** | What Phase 4+ must implement |
| **Status** | pending human approval / approved / deferred / rejected |

---

## DEC-001 — Reservation governance (UAT-004)

| Field | Value |
|-------|-------|
| **Decision ID** | DEC-001 |
| **Topic** | Reservation Workbench write governance after read-only golive |
| **Options** | **A:** Planner creates active; manager release/cancel · **B:** Planner draft; manager activate/release/cancel · **C:** Create disabled · **D:** Other |
| **Recommended selected option** | **B** — Planner creates draft reservation; manager activates/releases/cancels |
| **Selected option** | _pending human approval_ |
| **Decision owner** | Operations UAT lead + Business owner |
| **Decision date** | _pending_ |
| **Impact** | Controls reservation workflow and safe-mode boundaries |
| **Required system change** | Draft/active status workflow, role checks, UI gates — **Phase 4+ only** |
| **Status** | **pending human approval** |

**Interim behavior (unchanged until Phase 4):** create enabled · release disabled · no stock posting

---

## DEC-002 — Express Weight write-back

| Field | Value |
|-------|-------|
| **Decision ID** | DEC-002 |
| **Topic** | Express DBF weight write-back enablement |
| **Options** | Enabled · **Disabled** |
| **Recommended selected option** | **Disabled** |
| **Selected option** | **Disabled** |
| **Decision owner** | Project sponsor + IT |
| **Decision date** | 2026-06-08 |
| **Impact** | No Express ERP DBF updates; localStorage preview only |
| **Required system change** | None until `docs/08_EXPRESS_WEIGHT_WRITEBACK_DESIGN.md` governance |
| **Status** | **approved** |

---

## DEC-003 — WMS / CONSI preview limitation

| Field | Value |
|-------|-------|
| **Decision ID** | DEC-003 |
| **Topic** | Accept preview-only WMS Dashboard and CONSI Dashboard for first go-live |
| **Options** | **Accept with limitation** · Not accepted (block go-live) |
| **Recommended selected option** | **Accept with limitation** — deploy with static OperationsPreview; live feeds Phase 4+ |
| **Selected option** | _pending human approval_ |
| **Decision owner** | Operations UAT lead + Business owner |
| **Decision date** | _pending_ |
| **Impact** | WMS/CONSI menu shows preview structure; users informed via UAT-003 |
| **Required system change** | Phase 4+ wire live Supabase views (UAT-003) |
| **Status** | **pending human approval** |

**Related issue:** UAT-003 — Accepted / Design Limitation (automated UAT PASS)

---

## Decision summary

| Decision ID | Topic | Recommended | Selected (human) | Status |
|-------------|-------|-------------|------------------|--------|
| DEC-001 | Reservation governance | **B** | _pending_ | pending human approval |
| DEC-002 | Express Weight write-back | Disabled | **Disabled** | **approved** |
| DEC-003 | WMS/CONSI preview limitation | Accept with limitation | _pending_ | pending human approval |

---

## Update history

| Date | Author | Change |
|------|--------|--------|
| 2026-06-08 | Cursor Agent (Phase 3E) | Initial register — DEC-001/002/003 |
| 2026-06-08 | Cursor Agent (Phase 3F) | Recommended positions; DEC-002 confirmed approved; DEC-001/003 pending human approval |
