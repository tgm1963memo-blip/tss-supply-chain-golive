# Supabase Compact Read Model Cleanup Plan

**Document:** `docs/27_SUPABASE_COMPACT_READ_MODEL_CLEANUP_PLAN.md`  
**Strategy:** Local mirror holds full raw Express history; Supabase keeps workflow data + compact `sc_rm_*` read models only.

> **Manual confirmation required.** Do not run cleanup SQL until compact read models are verified in production/UAT.

---

## 1. Tables to preserve (never truncate)

These are system workflow / request data created by the web app:

| Group | Tables |
|---|---|
| Customer registration | `sc_customer_registration_requests`, `sc_customer_registration_branches`, `sc_customer_registration_approval_logs`, `sc_customer_registration_*` |
| Promotions | `sc_promotions`, `sc_promotion_*` |
| Return / CN | `sc_return_cn_*` |
| Sample / consumable | `sc_sample_consumable_*` |
| Consignment requests | `sc_consi_*_requests` |
| Stock / receiving / SKU | `sc_stock_adjustment_requests`, `sc_receiving_confirm_requests`, `sc_sku_setting_requests` |
| Reservations / planning | `sc_reservations`, `sc_reservation_lines`, `sc_planning_*_requests` |
| Sync control (summary) | `sync_jobs`, `sync_logs`, `sync_batches` (keep recent; optional archive) |
| Compact read models | All `sc_rm_*` tables from migration 013 |

Also preserve master staging still needed during transition:

- `sc_express_products` (small — can keep or rely on `sc_rm_product_master`)
- `sc_express_customers` (small — can keep or rely on `sc_rm_customer_master`)
- `sc_express_stock` (medium — can keep current snapshot or rely on `sc_rm_stock_balance`)

---

## 2. Tables to reduce (stop full sync; compact replacement exists)

| Raw staging table | Compact replacement | Action |
|---|---|---|
| `sc_express_invoices` | `sc_rm_sales_daily_summary`, `sc_rm_sales_monthly_summary` | Stop syncing; truncate after verification |
| `sc_express_so_lines` | `sc_rm_open_so_lines` | Stop full history sync; truncate old rows |
| `sc_express_so_headers` | `sc_rm_open_so_headers` | Stop full history sync; truncate old rows |
| `sc_express_transfers` | WMS uses request workflow; receiving schedule may need recent slice only | Truncate after WMS verified |
| `sync_failed_records` | `sc_rm_sync_health` + local mirror logs | Truncate/archive after local mirror stable |

---

## 3. Tables safe to truncate after compact read models verified

Run only after:

1. Migration 013 applied
2. Local mirror pipeline run successfully
3. `push_read_models_to_supabase.py` populated `sc_rm_*` tables
4. Web pages verified (Product Master, Customer Registration search, Sales Overview, Stock Balance, ATP, Consignment)

| Table | Condition |
|---|---|
| `sync_failed_records` | Local mirror logging replaces bulk failure storage |
| `sc_express_invoices` | Sales pages load from `sc_rm_sales_*` |
| `sc_express_transfers` | Receiving page acceptable with workflow requests only |
| `sc_express_so_lines` | Only open SO lines needed → `sc_rm_open_so_lines` |
| `sc_express_so_headers` | Only open SO headers needed → `sc_rm_open_so_headers` |

---

## 4. SQL checks before cleanup

```sql
-- Compact read models populated
select 'sc_rm_product_master' as tbl, count(*) from sc_rm_product_master
union all select 'sc_rm_customer_master', count(*) from sc_rm_customer_master
union all select 'sc_rm_stock_balance', count(*) from sc_rm_stock_balance
union all select 'sc_rm_open_so_headers', count(*) from sc_rm_open_so_headers
union all select 'sc_rm_open_so_lines', count(*) from sc_rm_open_so_lines
union all select 'sc_rm_sales_daily_summary', count(*) from sc_rm_sales_daily_summary
union all select 'sc_rm_sales_monthly_summary', count(*) from sc_rm_sales_monthly_summary
union all select 'sc_rm_consi_branch_stock', count(*) from sc_rm_consi_branch_stock;

-- Compare raw vs compact (sanity)
select count(*) as raw_invoices from sc_express_invoices;
select count(*) as daily_summary_rows from sc_rm_sales_daily_summary;

-- Open SO coverage
select count(*) as raw_so_lines from sc_express_so_lines;
select count(*) as compact_open_lines from sc_rm_open_so_lines;

-- Database size before cleanup
select pg_size_pretty(pg_database_size(current_database())) as db_size;

-- Largest tables
select relname, pg_size_pretty(pg_total_relation_size(relid))
from pg_catalog.pg_statio_user_tables
order by pg_total_relation_size(relid) desc
limit 15;
```

---

## 5. SQL cleanup commands (manual — run one at a time)

```sql
-- Step A: Archive failed records count (optional log)
select status, count(*) from sync_failed_records group by status;

-- Step B: Truncate sync failures (after local mirror stable)
-- TRUNCATE TABLE sync_failed_records;

-- Step C: Remove full invoice history (after sales pages verified)
-- TRUNCATE TABLE sc_express_invoices;

-- Step D: Remove transfer history (after receiving verified)
-- TRUNCATE TABLE sc_express_transfers;

-- Step E: Remove closed/historical SO lines (keep recent if needed)
-- DELETE FROM sc_express_so_lines
-- WHERE (room_code, document_no) NOT IN (
--   SELECT room_code, document_no FROM sc_rm_open_so_headers
-- );

-- Step F: Remove closed/historical SO headers
-- DELETE FROM sc_express_so_headers
-- WHERE (room_code, document_no) NOT IN (
--   SELECT room_code, document_no FROM sc_rm_open_so_headers
-- );

-- Step G: Reclaim space (Supabase / Postgres)
-- VACUUM FULL sc_express_invoices;  -- may lock table; use during maintenance window
```

Uncomment and run each statement only after sign-off.

---

## 6. Rollback / resync strategy

If compact read models are wrong or incomplete:

1. **Do not delete local mirror DB** — `scripts/local-mirror/data/express_mirror.duckdb` (or `.sqlite`) is the source of truth for rebuild.
2. Re-run build + push:
   ```bash
   cd scripts/local-mirror
   python build_read_models_from_local.py
   python push_read_models_to_supabase.py
   ```
3. If raw Supabase staging was truncated, re-sync from Express is **not required** for full history — rebuild from local mirror instead.
4. If local mirror is lost, re-run:
   ```bash
   python sync_express_to_local_mirror.py --room TSS --room TSS-NV --room CONSI
   python build_read_models_from_local.py
   python push_read_models_to_supabase.py
   ```
5. Re-enable legacy express-readonly-sync for emergency fallback only (with date/limit policy) — never full history to Supabase Free tier.

---

## 7. Do not clean

- Any `sc_*_requests` workflow table
- Promotions, customer registration, return/CN, sample/consumable, consignment request tables
- Stock adjustment, receiving confirm, SKU setting requests
- `sc_reservations`, `sc_reservation_lines`
- `sc_planning_*_requests`

---

## 8. Expected outcome

| Before | After |
|---|---|
| Full raw invoice/SO/transfer history in Supabase | Compact summaries + open SO only |
| Supabase Free quota exceeded | Stable quota with workflow + read models |
| Express sync writes large staging tables | Local mirror + push compact models only |
