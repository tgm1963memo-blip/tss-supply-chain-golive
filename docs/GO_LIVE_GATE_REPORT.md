# Go-live Gate Report — Real-Data Readiness

**Project:** `tss-supply-chain-golive`  
**Gate run:** 2026-06-10 (local)  
**Baseline commit:** `33dc4eb` — *Complete legacy supply chain migration coverage*  
**Gate operator:** Cursor Agent (readonly sync + Supabase probes + CI)

---

## Recommendation: **NO-GO**

Real Express data is synced for core master/transaction staging tables, and two core pages (Stock Balance, SKU Admin) can show live data. Several critical pages still show seed/empty KPIs, two sync tables failed, and multiple frontend read models are missing or unreachable from the anon key. Do not go live until blockers below are resolved and pages are re-validated in the browser.

---

## 1. Environment & sync configuration

| Check | Result |
|-------|--------|
| `scripts/express-readonly-sync/.env` | OK — `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `EXPRESS_DBF_PATH` present |
| `READONLY_MODE` | `true` |
| `SYNC_ROOM_CODE` | `TSS` |
| Express DBF path reachable | `\\server\expsrv\ExpressI\TSS` — all 7 DBF files present |
| Frontend `.env.local` | OK — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` present |
| Frontend service role key | **Not present** (correct) |
| Frontend vs sync Supabase URL | **Match** (`irnhwmkfxzvaxcllzbxv`) |

---

## 2. Express readonly sync (this gate run)

| Source DBF | Staging table | Gate run status | TSS row count (service role) | Notes |
|------------|---------------|-----------------|------------------------------|-------|
| STMAS.DBF | `sc_express_products` | **Completed** | 3,736 | Full master refresh |
| ARMAS.DBF | `sc_express_customers` | **Completed** | 6,067 | Full master refresh |
| STLOC.DBF | `sc_express_stock` | **Completed** | 3,156 | Full stock refresh |
| OESO.DBF | `sc_express_so_headers` | **Completed** | 70,338 | `--since-date 2025-01-01` |
| OESOIT.DBF | `sc_express_so_lines` | **Completed w/ errors** | 204,030 (room TSS) | 1 failed row; incremental run used `--limit 10000` |
| ARTRN.DBF | `sc_express_invoices` | **Failed** | 0 | `42P10` — ON CONFLICT `(room_code,document_no)` does not match unique index `(room_code, document_no, coalesce(line_no,-1))` |
| STTRN.DBF | `sc_express_transfers` | **Failed** | 0 | `PGRST204` — column `transfer_date` not in PostgREST schema cache for `sc_express_transfers` |

**Express write-back:** None (readonly sync only).

---

## 3. Read model refresh

| Step | Result |
|------|--------|
| `refresh_read_models.py` | **Completed** — probes OK: products 3,736 · stock 9,280 · SO headers 128,547 (global counts incl. non-TSS rooms) |
| Prior failure (`so_headers_view`) | Cleared after STLOC/OESO resync |

---

## 4. Supabase row counts (TSS room — `sync_status_check.py`)

```json
{
  "products": 3736,
  "customers": 6067,
  "stock_rows": 3156,
  "so_headers": 70338,
  "so_lines": 204030,
  "invoices": 0,
  "transfers": 0,
  "failed_records": 1,
  "read_only_mode": true,
  "express_write_back": false
}
```

**Note:** `sc_inventory_balance_view` aggregates to **9,280** balance lines (includes historical/non-TSS stock rows in Supabase). Frontend stock pages use this view, not raw `sc_express_stock` count.

---

## 5. CI / quality gates

| Command | Result |
|---------|--------|
| `npm run legacy:audit` | **40 COMPLETE · 0 PARTIAL · 0 MISSING · 7 BLOCKED_BY_GOVERNANCE** |
| `npm test` | **82/82 passed** |
| `npm run build` | **Success** (chunk size warning only) |

Code coverage audit passes; this does **not** override real-data gate failures.

---

## 6. Page validation (anon key — frontend simulation)

Probed the same Supabase project and anon key the Vite app uses. Browser spot-check recommended after fixes.

| Page | Route | Primary data source | Live data? | Finding |
|------|-------|---------------------|------------|---------|
| Executive Dashboard | `/executive/dashboard` | Mixed services | **Partial** | Stock section can load via `sc_inventory_balance_view`. Sales KPIs use missing `sc_so_reservation_candidate_view` → **0 SO lines**. Sync KPI cards query `sc_express_*` via anon → **0 counts** despite synced data. |
| Product Master | `/master-data/products` | *(none wired)* | **No** | Static mock UI (hardcoded 1,245 SKUs). Does not call `productService` / Express data. |
| Customer Registration search | `/sales/customer-registration` | `sc_web_customer_master_view` → fallback `sc_express_customers` | **No** | View missing in schema. Anon cannot read staging customers (0 rows). Search returns empty. |
| Sales Overview | `/executive/sales-overview` | `sc_so_reservation_candidate_view` | **No** | View **not in Supabase schema** (not defined in golive migrations). |
| Stock Balance | `/warehouse/inventory/balance` | `sc_inventory_balance_view` | **Yes** | **9,280** rows readable; real product/warehouse/lot data in sample. |
| ATP Workbench | `/planning/atp` | `sc_web_atp_view` | **No** | View missing → service falls back to **seed ATP**. |
| WMS Dashboard | `/warehouse/wms` | `sc_web_stock_balance_view` | **No** | View missing → **seed stock summary** banner. |
| Consignment Branch Stock | `/consignment/branch-stock` | `sc_web_consi_branch_stock_view` | **No** | Query **statement timeout** (`57014`) on anon. |
| SKU Admin | `/master-data/sku-settings` | `sc_web_sku_admin_view` | **Yes** | **3,736** SKUs with real codes/names from STMAS sync. |
| Admin Reports | `/admin/reports` | Mixed per report id | **Partial** | Stock/inventory reports can use live balance view; sales/consignment/WMS reports hit missing views or timeouts. |

### Pages with confirmed real Express-backed data visible (anon)

1. **Stock Balance** — `sc_inventory_balance_view`
2. **SKU Admin** — `sc_web_sku_admin_view`

---

## 7. Defects found

| ID | Severity | Area | Description |
|----|----------|------|-------------|
| G1 | **Critical** | Sync | **ARTRN** upsert conflict keys do not match DB unique index; invoices never load. |
| G2 | **Critical** | Sync / Schema | **STTRN** fails — `transfer_date` column absent from PostgREST schema cache (migration 002 `sc_express_transfers` columns likely not applied or cache stale). WMS transfer/receiving views stay empty. |
| G3 | **Critical** | Schema / Frontend | **`sc_so_reservation_candidate_view`** referenced by sales/executive services but **not created** in golive migrations (007 adds `sc_so_pick_pack_candidate_view` instead). Sales Overview and Executive sales KPIs broken. |
| G4 | **Critical** | Schema / Frontend | Migration **001 read views** missing from remote schema: `sc_web_stock_balance_view`, `sc_web_atp_view`, `sc_web_shortage_view`, `sc_web_customer_master_view`, `sc_web_sales_dashboard_view`, `sc_web_sales_order_lines_view`. WMS/ATP/customer pages affected. |
| G5 | **High** | RLS | Anon key returns **0 rows** on `sc_express_*` staging tables (direct select), while service role sees TSS data. Breaks sync status KPIs on Executive Dashboard and customer search fallback. |
| G6 | **High** | UI | **Product Master** page is still static mock — not connected to synced STMAS data (use `sc_web_sku_admin_view` or wire `productService`). |
| G7 | **Medium** | Performance | Consignment branch stock / pick-pack candidate views **timeout** on full count/query at anon — needs indexes or scoped filters. |
| G8 | **Low** | Sync | 1 failed OESOIT row in `sync_failed_records`; 1 invalid OESO date (`DLVDAT=b'20266006'`). |

---

## 8. Blockers (must fix before GO)

1. **Apply / reconcile Supabase migrations 001–002 on remote** — restore missing `sc_web_*` views and `sc_express_transfers.transfer_date`.
2. **Fix ARTRN sync** — align upsert conflict with `(room_code, document_no, line_no)` and map `line_no` from ARTRN, or add matching unique constraint.
3. **Align reservation read model** — create `sc_so_reservation_candidate_view` (compat alias to 007 pick-pack view) **or** update `reservationSourceService.js` / sales dashboard to use `sc_so_pick_pack_candidate_view`.
4. **Fix anon read path** — grant/select policies or route all frontend reads through granted views (not raw staging tables).
5. **Wire Product Master** to live read model (minimum: `sc_web_sku_admin_view`).
6. **Re-run full gate** after fixes: sync all 7 tables, refresh read models, browser-verify all 10 pages with **no seed banners**.

---

## 9. Governance reminders (unchanged)

- **7 BLOCKED_BY_GOVERNANCE** pages remain intentional (production planning, group admin, users, permissions, audit).
- No Express write-back performed in this gate.
- No service role key in frontend (verified).

---

## 10. Suggested fix sequence

```powershell
# 1. Apply pending migrations on Supabase (001–002 minimum, verify 003–010)
# 2. Fix ARTRN upsert in express_table_mapping.py + express_sync_engine.py
# 3. Re-sync failed tables
cd scripts/express-readonly-sync
.\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table ARTRN.DBF --since-date 2025-01-01
.\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table STTRN.DBF --since-date 2025-01-01
.\.venv\Scripts\python.exe refresh_read_models.py
.\.venv\Scripts\python.exe sync_status_check.py

# 4. npm run dev — browser verify all core pages
# 5. Re-run this gate checklist
```

---

## 11. Sign-off checklist (for next gate)

- [ ] All 7 Express tables synced without failure  
- [ ] Invoices > 0 (if required for sales history)  
- [ ] Transfers > 0 (if required for WMS)  
- [ ] All 10 core pages show live data (no seed banner)  
- [ ] Executive Dashboard sync KPIs match `sync_status_check` counts  
- [ ] Customer search returns ARMAS customers  
- [ ] `npm run legacy:audit` · `npm test` · `npm run build` green  

**Current sign-off:** **NO-GO** — 2 of 10 core pages confirmed live; critical schema/sync gaps remain.

---

## 12. Gate Fix Round 1 Result

**Date:** 2026-06-10  
**Scope:** Schema / sync / read-model compatibility / anon RLS / Product Master live wiring (no new business features)

### Files changed

| File | Change |
|------|--------|
| `supabase/migrations/011_gate_fix_sync_read_models.sql` | **New** — invoice unique constraint, transfer columns, compatibility views, RLS/grants |
| `scripts/express-readonly-sync/express_table_mapping.py` | ARTRN upsert key → `room_code,document_no,line_no` |
| `scripts/express-readonly-sync/express_sync_engine.py` | ARTRN maps `line_no`; invoice payload validation |
| `scripts/express-readonly-sync/validate_upsert_conflict_keys.py` | **New** — conflict-key guard |
| `scripts/gate-run-2-validate.py` | **New** — Gate Run 2 validation script |
| `src/services/master-data/productMasterService.js` | **New** — live product list service |
| `src/features/master-data/ProductMasterPage.jsx` | Rewired from mock UI to live service |
| `src/services/warehouse/wmsDashboardService.js` | Fallback to `sc_inventory_balance_view` |
| `src/services/planning/atpWorkbenchService.js` | Fallback to `sc_inventory_balance_view` |
| `tests/unit/gate-fix-round1.test.jsx` | **New** — mapping + Product Master tests |
| `package.json` | Added `gate:validate`, `sync:validate-keys` scripts |

### Migration 011 details

1. **ARTRN / invoices:** Backfill `line_no = 0`, replace expression unique index with `UNIQUE (room_code, document_no, line_no)` matching sync upsert.
2. **STTRN / transfers:** `ALTER TABLE ADD COLUMN IF NOT EXISTS` for `transfer_date`, `document_date`, product/warehouse/qty fields, `raw_data`, `synced_at`, etc.
3. **Compatibility views:** Recreates `sc_web_customer_master_view`, `sc_web_stock_balance_view`, `sc_web_atp_view`, `sc_web_product_master_view`, `sc_web_sales_order_lines_view`; adds `sc_so_reservation_candidate_view` (management 015 compat) and `sc_so_reservation_fulfillment_location_candidate_view` (golive anon-safe, no auth permission gate).
4. **RLS:** Re-applies SELECT-only policies + grants on all `sc_express_*` staging tables for `anon` / `authenticated`.
5. Ends with `NOTIFY pgrst, 'reload schema'`.

**Action required:** Apply migration 011 on remote Supabase (SQL Editor or CLI) before re-sync and Gate Run 2.

### ARTRN fix result

| Item | Status |
|------|--------|
| Sync mapping includes `line_no` (SEQNUM/SEQ/LINE_NO/TRNLIN, default 0) | **Done** |
| Upsert conflict key aligned to `room_code,document_no,line_no` | **Done** |
| `validate_upsert_conflict_keys.py` guard | **Pass** (7 tables) |
| Live ARTRN sync on remote | **Pending migration 011** — remote still has expression index; targeted sync run in progress / will succeed after 011 applied |

### STTRN fix result

| Item | Status |
|------|--------|
| Migration adds `transfer_date` + related columns | **Done** (in 011) |
| Sync engine already maps `transfer_date` from DOCDAT | **Unchanged** |
| Live STTRN sync on remote | **Pending migration 011** — PostgREST schema cache missing `transfer_date` until 011 applied |

### Read views created (migration 011)

- `sc_web_customer_master_view`
- `sc_web_stock_balance_view`
- `sc_web_atp_view`
- `sc_web_product_master_view`
- `sc_web_sales_order_lines_view`
- `sc_so_reservation_candidate_view` → wraps SO headers/lines + reservations
- `sc_so_reservation_fulfillment_location_candidate_view` → inventory location candidates

### RLS / read policy changes

- SELECT-only policies recreated on all seven `sc_express_*` staging tables.
- Grants re-applied for staging tables and new/compat views to `anon`, `authenticated`.
- No INSERT/UPDATE/DELETE policies added for anon on staging tables.

### Product Master live wiring result

- `ProductMasterPage.jsx` now calls `productMasterService.js`.
- Reads `sc_web_product_master_view` → fallback `sc_web_sku_admin_view` → fallback `sc_express_products`.
- KPIs: total / active / inactive / product groups; filters: search, group, status.
- Read-only; “Request change” links to SKU Setting Requests (`/master-data/sku-settings`).
- **After migration 011 + STMAS sync:** expects ~3,736 live rows (via sku admin view even before product master view exists).

### Service fallbacks (pre-migration resilience)

- WMS Dashboard: `sc_web_stock_balance_view` → `sc_inventory_balance_view`
- ATP Workbench: `sc_web_atp_view` → `sc_inventory_balance_view`

### CI after Round 1 fixes

| Command | Result |
|---------|--------|
| `npm run legacy:audit` | 40 COMPLETE · 0 PARTIAL · 0 MISSING · 7 BLOCKED |
| `npm test` | **86/86 passed** (+4 gate-fix tests) |
| `npm run build` | **Success** |
| `npm run sync:validate-keys` | **Pass** |
| `npm run gate:validate` | **NO-GO** until migration 011 applied on remote |

### Pages revalidated (pre–migration 011 on remote)

| Page | Post-fix expectation |
|------|----------------------|
| Product Master | Live via `sc_web_sku_admin_view` fallback once app rebuilt |
| Stock Balance | Live (`sc_inventory_balance_view`) |
| SKU Admin | Live |
| WMS Dashboard | Live via inventory fallback (no seed banner) |
| ATP Workbench | Live via inventory fallback |
| Customer Registration | Live after 011 (`sc_web_customer_master_view`) |
| Sales Overview | Live after 011 (`sc_so_reservation_candidate_view`) |
| Executive Dashboard sales KPIs | Live after 011 |
| Executive Dashboard sync KPIs | Live after 011 (anon staging read) |

### Remaining blockers (Gate Run 2)

1. **Apply `011_gate_fix_sync_read_models.sql` on remote Supabase**
2. Re-run ARTRN + STTRN sync after 011
3. Re-run `npm run gate:validate` — expect views present and anon staging counts > 0
4. Browser spot-check Customer Registration search + Sales Overview
5. Consignment branch stock view timeout (performance — may need indexes or scoped query)

### Targeted sync attempt (2026-06-10, post mapping fix)

| Table | Result | Detail |
|-------|--------|--------|
| ARTRN | **Failed** | ~9,960 rows read; **0 upserted**. HTTP/2 `ConnectionTerminated` after ~568s during bulk upsert (network/stream limit, not ON CONFLICT). Migration 011 still required on remote. |
| STTRN | **Failed** | 271 rows selected; **0 upserted**. `PGRST204` — `transfer_date` column still missing in PostgREST schema until migration 011 is applied. |

**Next:** Apply migration 011, then re-run ARTRN with chunked sync (see sync tooling update below).

### Gate Fix Round 1 — sync tooling update

| Change | Detail |
|--------|--------|
| `--offset` CLI flag | Added to `sync_express_readonly.py` / `express_sync_engine.py` (default `0`) |
| Slice behavior | Policy-filtered rows are sliced as `filtered[offset : offset + limit]` before upsert |
| Logging | Emits `[SLICE]`, `[SLICE_SUMMARY]` with offset, limit, policy-filtered count, rows skipped by offset, selected rows after slice |
| ARTRN chunk sync | Run in batches to avoid HTTP/2 connection drops on large upserts |
| STTRN policy | Use `--limit N` or `--full` (or `--offset`) — `blocked_full_history_by_default` no longer blocks table start when slice controls are set |
| Tests | `scripts/express-readonly-sync/test_sync_offset.py`, `tests/unit/sync-offset.test.js` |

**ARTRN chunked sync (recommended):**

```powershell
cd scripts/express-readonly-sync
.\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table ARTRN.DBF --since-date 2025-01-01 --limit 2000 --offset 0
.\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table ARTRN.DBF --since-date 2025-01-01 --limit 2000 --offset 2000
# repeat offset by 2000 until a batch upserts fewer than limit rows
```

**STTRN sync:**

```powershell
.\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table STTRN.DBF --since-date 2025-01-01 --limit 500
# or --full for all policy-eligible rows
```

### Gate Run 2 — DBF temp cache lock fix (confirmed)

| Item | Status |
|------|--------|
| Problem | ARTRN sync failed with WinError 32 when reusing `cache/dbf_temp/TSS/ARTRN.DBF` |
| Fix | Each sync run copies DBF sidecars into a **unique** run folder via `shutil.copy2` |
| Run folder format | `cache/dbf_temp/runs/<timestamp>_<pid>_<uuid8>/<room>/ARTRN.DBF` |
| Uniqueness | `uuid4().hex[:8]` suffix added so `make_run_cache_root()` never returns the same path twice in one process |
| Collision guard | `mkdir(parents=True, exist_ok=False)` |
| Cleanup | Best-effort only — `[WARN]` on failure; next run uses a new folder |
| Test fix | `test_each_run_gets_unique_directory` passes after uuid suffix |
| Readonly | Unchanged — no Express write-back |

**Next manual ARTRN Gate Run 2 sync (limit 1000 chunks):**

```powershell
cd scripts/express-readonly-sync

& .\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table ARTRN.DBF --since-date 2025-01-01 --limit 1000 --offset 0
& .\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table ARTRN.DBF --since-date 2025-01-01 --limit 1000 --offset 1000
& .\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table ARTRN.DBF --since-date 2025-01-01 --limit 1000 --offset 2000
# repeat offset by 1000 until a batch upserts fewer than limit rows
```

Each chunk uses its own `cache/dbf_temp/runs/<timestamp>_<pid>_<uuid8>/TSS/` folder. `--offset` is applied after policy filtering and before `--limit`.

### Gate Run 2 recommendation

**NO-GO** until migration 011 is applied on remote and validation script reports:

- ARTRN sync completes without ON CONFLICT error  
- STTRN sync completes without `transfer_date` schema error  
- Required views exist in PostgREST schema  
- Anon can read staging tables (counts match service role for room TSS)  
- Product Master, Customer search, Sales Overview, ATP, WMS show live data (no seed banner)

```powershell
# Apply migration 011 in Supabase SQL Editor, then:
cd scripts/express-readonly-sync
.\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table ARTRN.DBF --since-date 2025-01-01 --limit 2000 --offset 0
.\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table ARTRN.DBF --since-date 2025-01-01 --limit 2000 --offset 2000
.\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table STTRN.DBF --since-date 2025-01-01 --limit 500
.\.venv\Scripts\python.exe refresh_read_models.py
cd ..\..
npm run gate:validate
npm run dev
```

---

## 13. Gate Fix Round 2 — STTRN Conflict Key

**Date:** 2026-06-10
**Scope:** Fix STTRN upsert conflict key

1. Created migration `012_fix_sttrn_transfer_conflict_key.sql` to define unique index `uq_sc_express_transfers_room_doc` on `(room_code, document_no)`.
2. This matches the sync mapping requirement and fixes the `42P10` ON CONFLICT error.

**Action required:** Apply migration 012 on remote Supabase before re-sync.

**STTRN chunked sync (recommended):**

```powershell
cd scripts/express-readonly-sync
.\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table STTRN.DBF --since-date 2025-01-01 --limit 500
```

