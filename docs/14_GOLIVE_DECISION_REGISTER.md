# Golive Decision Register

Phase **3E** — formal record of governance and deployment decisions for `tss-supply-chain-golive`.

Update this register when human UAT sign-off completes (`docs/13_HUMAN_UAT_SIGNOFF.md`). **Do not implement system changes from this register until Phase 4+ explicit approval.**

---

## Register format

| Column | Description |
|--------|-------------|
| **Decision ID** | Unique identifier (DEC-xxx) |
| **Topic** | Subject under decision |
| **Options** | Available choices |
| **Selected option** | Final choice (or _pending_) |
| **Decision owner** | Role accountable for sign-off |
| **Decision date** | Date decision confirmed |
| **Impact** | Business / technical effect |
| **Required system change** | What Phase 4+ must implement |
| **Status** | pending / approved / deferred / rejected |

---

## DEC-001 — Reservation governance (UAT-004)

| Field | Value |
|-------|-------|
| **Decision ID** | DEC-001 |
| **Topic** | Reservation Workbench write governance after read-only golive |
| **Options** | **A:** Planner creates active reservation; manager release/cancel · **B:** Planner creates draft; manager activates/releases/cancels · **C:** Create disabled for first go-live · **D:** Other |
| **Recommended default** | **Option B** |
| **Selected option** | _pending_ |
| **Decision owner** | Operations UAT lead + Business owner |
| **Decision date** | _pending_ |
| **Impact** | Controls who can reserve stock and who can release/cancel; affects planning workflow and safe-mode boundaries |
| **Required system change** | Reservation RPC/status workflow, role checks, UI enable/disable for create/activate/release; **no change in Phase 3E** |
| **Status** | **pending** |

**Current interim behavior (until DEC-001 approved):**

- Create reservation: enabled
- Release reservation: disabled (safe mode)
- No stock posting

---

## DEC-002 — Express Weight write-back

| Field | Value |
|-------|-------|
| **Decision ID** | DEC-002 |
| **Topic** | Express DBF weight write-back enablement |
| **Options** | **Enabled** (post governance) · **Disabled** (design-only safe mode) |
| **Selected option** | **Disabled** |
| **Decision owner** | Project sponsor + IT |
| **Decision date** | 2026-06-08 (Phase 3E tracking) |
| **Impact** | No Express ERP DBF updates from golive app; weight capture remains localStorage preview |
| **Required system change** | None until separate governance per `docs/08_EXPRESS_WEIGHT_WRITEBACK_DESIGN.md` |
| **Status** | **approved** (remain disabled) |

---

## DEC-003 — WMS / CONSI preview limitation

| Field | Value |
|-------|-------|
| **Decision ID** | DEC-003 |
| **Topic** | Accept preview-only WMS Dashboard and CONSI Dashboard for first go-live |
| **Options** | **Accepted** (deploy with static OperationsPreview data) · **Not accepted** (block go-live until live Supabase views wired) |
| **Selected option** | _pending_ (recommended: **Accepted** at GO WITH LIMITATION) |
| **Decision owner** | Operations UAT lead + Business owner |
| **Decision date** | _pending_ |
| **Impact** | WMS/CONSI menu pages show preview structure only; live document feeds deferred |
| **Required system change** | Phase 4+ wire `tgd_*` / consignment views to replace `OperationsPreviewPage` (UAT-003) |
| **Status** | **pending** |

**Related issue:** UAT-003 — Accepted / Design Limitation (automated UAT PASS)

---

## Decision summary

| Decision ID | Topic | Selected | Status |
|-------------|-------|----------|--------|
| DEC-001 | Reservation governance | _pending_ (default **B**) | pending |
| DEC-002 | Express Weight write-back | Disabled | approved |
| DEC-003 | WMS/CONSI preview limitation | _pending_ | pending |

---

## Update history

| Date | Author | Change |
|------|--------|--------|
| 2026-06-08 | Cursor Agent (Phase 3E) | Initial register — DEC-001/002/003 |
