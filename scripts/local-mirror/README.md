# Local Mirror + Compact Read Model Pipeline

Read-only Express DBF data is mirrored locally, summarized into compact read models, and only those summaries are pushed to Supabase. Large raw transaction history stays off Supabase.

## Architecture

```
Express DBF (network share, read-only)
    ↓  sync_express_to_local_mirror.py
Local mirror DB (DuckDB preferred, SQLite fallback)
    scripts/local-mirror/data/express_mirror.duckdb
    ↓  build_read_models_from_local.py
Local compact read models (rm_* tables)
    ↓  push_read_models_to_supabase.py
Supabase sc_rm_* tables (web app reads these)
```

**Safety**

- No Express DBF write-back
- No Express update
- Service role key only in `scripts/local-mirror/.env` or `scripts/express-readonly-sync/.env`
- Frontend uses anon key only
- Workflow/request tables in Supabase are unchanged

## Prerequisites

- Python 3.10+
- Packages: `dbfread`, `python-dotenv`, `supabase`, `duckdb` (optional — SQLite used if missing)
- Reuse venv from `scripts/express-readonly-sync/.venv` when available

## Environment

Create `scripts/local-mirror/.env` (or reuse express-readonly-sync env):

```env
READONLY_MODE=true
EXPRESS_DBF_PATH=\\server\expsrv\ExpressI\TSS
ERP_BASE_PATH=\\server\expsrv\ExpressI
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SYNC_BATCH_SIZE=500
```

## Commands

```bash
cd scripts/local-mirror

# 1. Sync full raw Express data to local mirror
python sync_express_to_local_mirror.py --room TSS

# 2. Build compact read models locally
python build_read_models_from_local.py

# 3. Push compact models to Supabase (sc_rm_*)
python push_read_models_to_supabase.py

# Full pipeline
python run_local_mirror_pipeline.py --room TSS
```

## Local mirror tables

| Local table | Express source |
|---|---|
| `local_express_products` | STMAS.DBF |
| `local_express_customers` | ARMAS.DBF |
| `local_express_stock` | STLOC.DBF |
| `local_express_so_headers` | OESO.DBF |
| `local_express_so_lines` | OESOIT.DBF |
| `local_express_invoices` | ARTRN.DBF |
| `local_express_transfers` | STTRN.DBF |

Each row includes: `room_code`, `source_table`, `source_row_id`, `raw_data`, `synced_at`, plus normalized columns.

## Local read model tables → Supabase

| Local | Supabase |
|---|---|
| `rm_product_master` | `sc_rm_product_master` |
| `rm_customer_master` | `sc_rm_customer_master` |
| `rm_stock_balance` | `sc_rm_stock_balance` |
| `rm_open_so_headers` | `sc_rm_open_so_headers` |
| `rm_open_so_lines` | `sc_rm_open_so_lines` |
| `rm_sales_daily_summary` | `sc_rm_sales_daily_summary` |
| `rm_sales_monthly_summary` | `sc_rm_sales_monthly_summary` |
| `rm_consi_branch_stock` | `sc_rm_consi_branch_stock` |

## Database engine

- **Preferred:** DuckDB at `scripts/local-mirror/data/express_mirror.duckdb`
- **Fallback:** SQLite at `scripts/local-mirror/data/express_mirror.sqlite`

Local data, logs, and cache are gitignored.

## Supabase migration

Apply `supabase/migrations/013_compact_read_model_strategy.sql` before first push.

## Cleanup

See `docs/27_SUPABASE_COMPACT_READ_MODEL_CLEANUP_PLAN.md` for manual steps to reduce raw staging tables after verification.
