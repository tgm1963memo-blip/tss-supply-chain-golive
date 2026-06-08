# Express Sync UAT Validation

Phase **3G** — validate that Express read-only sync populated Supabase correctly before golive UAT sign-off.

**Prerequisites:** Sync completed per `docs/20_EXPRESS_READONLY_SYNC_SETUP.md`. Room code default: **`TSS`**.

---

## Validation legend

| Symbol | Meaning |
|--------|---------|
| ☐ | Not tested |
| ✅ | Pass |
| ⚠️ | Partial — acceptable with documented note |
| ❌ | Fail — block sign-off until resolved |

Record tester name, date, and room code for each section.

---

## 1. Environment and read-only guard

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1.1 | `EXPRESS_DBF_PATH` points to live TSS room folder | ☐ | |
| 1.2 | `SUPABASE_SERVICE_ROLE_KEY` used only in Python (not in Vite) | ☐ | |
| 1.3 | `sync_express_readonly.py` prints `[READONLY]` banner on start | ☐ | |
| 1.4 | No DBF file timestamps changed after sync run | ☐ | Compare before/after on sample file |
| 1.5 | System Control shows **Read-only mode active: Yes** | ☐ | `/admin/system-control` |
| 1.6 | System Control shows **Express write-back disabled: Yes** | ☐ | |

---

## 2. Row counts (minimum thresholds)

Run `sync_status_check.py` or check **Express Sync Status** on System Control.

Adjust minimums to your environment; zero rows on any core table is a **fail** unless documented (empty DBF).

| # | Table | Minimum expected | Actual count | Result | Notes |
|---|-------|------------------|--------------|--------|-------|
| 2.1 | `sc_express_products` (STMAS) | > 0 | | ☐ | |
| 2.2 | `sc_express_customers` (ARMAS) | > 0 | | ☐ | |
| 2.3 | `sc_express_stock` (STLOC) | > 0 | | ☐ | |
| 2.4 | `sc_express_so_headers` (OESO) | > 0 | | ☐ | |
| 2.5 | `sc_express_so_lines` (OESOIT) | > 0 | | ☐ | |
| 2.6 | `sc_express_invoices` (ARTRN) | ≥ 0 | | ☐ | May be 0 if date window excludes all |
| 2.7 | `sync_failed_records` (room TSS) | 0 preferred | | ☐ | Investigate if > 0 |

**CLI count check:**

```powershell
cd scripts\express-readonly-sync
.\.venv\Scripts\python.exe sync_status_check.py
```

---

## 3. Sample document cross-check

Pick documents that exist in Express and verify they appear in Supabase and the golive UI.

| # | Check | Express reference | Supabase / UI | Result | Notes |
|---|-------|-------------------|---------------|--------|-------|
| 3.1 | Product code from STMAS | e.g. known SKU | Product Master page shows name/UOM | ☐ | |
| 3.2 | Customer code from ARMAS | e.g. known customer | Customer Master page | ☐ | |
| 3.3 | Stock row from STLOC | SKU + location | Stock Balance qty matches (approx.) | ☐ | |
| 3.4 | Open SO from OESO | document number | Sales Order list + detail | ☐ | |
| 3.5 | SO line from OESOIT | doc + line | Order detail lines populated | ☐ | |
| 3.6 | Invoice from ARTRN (if synced) | document number | Sales overview / invoice views | ☐ | |

**Sample SO documents** (from status script JSON `samples.so_documents`):

```powershell
.\.venv\Scripts\python.exe sync_status_check.py
```

Open each sample in **Sales → Sales Order** detail and confirm header + lines load.

---

## 4. SQL checks (Supabase SQL Editor)

Replace `'TSS'` if using a different room code.

### 4.1 Counts by room

```sql
SELECT 'products' AS entity, COUNT(*) AS cnt
FROM sc_express_products WHERE room_code = 'TSS'
UNION ALL
SELECT 'customers', COUNT(*) FROM sc_express_customers WHERE room_code = 'TSS'
UNION ALL
SELECT 'stock', COUNT(*) FROM sc_express_stock WHERE room_code = 'TSS'
UNION ALL
SELECT 'so_headers', COUNT(*) FROM sc_express_so_headers WHERE room_code = 'TSS'
UNION ALL
SELECT 'so_lines', COUNT(*) FROM sc_express_so_lines WHERE room_code = 'TSS'
UNION ALL
SELECT 'invoices', COUNT(*) FROM sc_express_invoices WHERE room_code = 'TSS';
```

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 4.1 | All core counts > 0 (except invoices if date-filtered) | ☐ | |

### 4.2 Orphan SO lines (lines without header)

```sql
SELECT l.document_no, COUNT(*) AS orphan_lines
FROM sc_express_so_lines l
LEFT JOIN sc_express_so_headers h
  ON h.room_code = l.room_code AND h.document_no = l.document_no
WHERE l.room_code = 'TSS' AND h.document_no IS NULL
GROUP BY l.document_no
LIMIT 20;
```

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 4.2 | No orphan lines (or explained by partial OESO sync) | ☐ | Re-sync OESO if orphans found |

### 4.3 Stock without product master

```sql
SELECT DISTINCT s.product_code
FROM sc_express_stock s
LEFT JOIN sc_express_products p
  ON p.room_code = s.room_code AND p.product_code = s.product_code
WHERE s.room_code = 'TSS' AND p.product_code IS NULL
LIMIT 20;
```

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 4.3 | Missing products acceptable or STMAS re-synced | ☐ | |

### 4.4 Latest sync job status

```sql
SELECT source_table, status, started_at, finished_at, last_error
FROM sync_jobs
WHERE room_code = 'TSS'
ORDER BY created_at DESC
LIMIT 10;
```

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 4.4 | Recent jobs show `success` or documented partial | ☐ | |

### 4.5 Failed records

```sql
SELECT source_table, COUNT(*) AS failed_count
FROM sync_failed_records
WHERE room_code = 'TSS'
GROUP BY source_table;
```

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 4.5 | Zero failed rows, or failures reviewed and accepted | ☐ | |

---

## 5. UI smoke test (Express-sourced data)

| # | Route | Check | Result | Notes |
|---|-------|-------|--------|-------|
| 5.1 | `/master/products` | Real product codes/names (not seed only) | ☐ | |
| 5.2 | `/master/customers` | Real customer names | ☐ | |
| 5.3 | `/warehouse/inventory/balance` | Stock quantities from STLOC | ☐ | |
| 5.4 | `/sales/orders` | SO list with Express document numbers | ☐ | |
| 5.5 | `/sales/orders/:id` | Header + line items match Supabase | ☐ | |
| 5.6 | `/executive/sales-overview` | KPIs use live synced data | ☐ | |
| 5.7 | `/admin/system-control` | Express Sync Status counts match SQL | ☐ | |

---

## 6. Safe mode re-check

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 6.1 | No save/post buttons write to Express | ☐ | |
| 6.2 | Stock adjustment / cycle count remain preview-only | ☐ | |
| 6.3 | Express Weight pages remain DESIGN ONLY / localStorage | ☐ | |

---

## 7. Sign-off criteria

All must be true before Express UAT sign-off:

- [ ] Sections 1–6 completed with no ❌ on blocking items
- [ ] `sync_failed_records` reviewed (zero or accepted with issue log entry)
- [ ] Sample documents verified in UI (section 3)
- [ ] Thai UAT section **E.1–E.7** in `docs/17_THAI_UAT_TEST_SCRIPT.md` completed
- [ ] Issues logged in `docs/18_THAI_UAT_ISSUE_LOG.md` if any ⚠️

---

## Related docs

- `docs/20_EXPRESS_READONLY_SYNC_SETUP.md` — setup and sync commands
- `docs/17_THAI_UAT_TEST_SCRIPT.md` — Thai UAT execution (section E)
- `docs/10_LIVE_READONLY_VALIDATION_PLAN.md` — general read-only UAT plan
- `docs/09_SUPABASE_ENV_SETUP.md` — Supabase env setup
