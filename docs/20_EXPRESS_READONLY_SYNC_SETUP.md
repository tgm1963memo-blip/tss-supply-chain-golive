# Express Read-only Sync Setup

Phase **3G** — load live Express ERP data into Supabase staging tables for UAT, without modifying Express DBF files.

## Purpose

The sync scripts read Express **DBF files only**, copy them to a local cache, parse records, and upsert into Supabase **`sc_express_*`** staging tables. The golive React app reads from Supabase (anon key) in **read-only / safe mode**.

## Read-only rules (mandatory)

| Rule | Detail |
|------|--------|
| **Express DBF** | Read and copy only — **never write, update, or delete** DBF files |
| **Supabase target** | Upsert into `sc_express_*` staging tables and `sync_jobs` / `sync_failed_records` only |
| **No write-back** | No Express weight write-back, no stock posting, no ERP mutation |
| **Service role key** | Use `SUPABASE_SERVICE_ROLE_KEY` **only in Python scripts** — never in Vite/React |
| **Frontend** | Uses `VITE_SUPABASE_ANON_KEY` for read-only status checks |

`READONLY_MODE = True` is enforced in `sync_express_readonly.py`. If disabled, the script exits with a fatal error.

---

## Prerequisites

- Python 3.10+ on a machine with **network access** to the Express DBF share
- Supabase project with `sc_express_*` tables and `sync_jobs` / `sync_failed_records`
- `.env.local` at project root (see below)

---

## Environment variables

Add these to **`.env.local`** at the project root (same file used by Vite). Copy from `.env.example`.

### Frontend (Vite — required for the app)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |

### Server-side sync (Python only — never expose to browser)

| Variable | Description |
|----------|-------------|
| `EXPRESS_DBF_PATH` | Room folder containing DBF files, e.g. `\\server\expsrv\ExpressI\TSS` |
| `ERP_BASE_PATH` | Legacy parent folder, e.g. `\\server\expsrv\ExpressI` (used when `EXPRESS_DBF_PATH` is not set) |
| `SUPABASE_URL` | Same URL as `VITE_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key from Supabase dashboard |
| `SYNC_ROOM_CODE` | Room code filter (default: `TSS`) |
| `SYNC_BATCH_SIZE` | Optional batch size (default: `500`) |

Example `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

EXPRESS_DBF_PATH=\\server\expsrv\ExpressI\TSS
ERP_BASE_PATH=\\server\expsrv\ExpressI
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SYNC_ROOM_CODE=TSS
```

**Path resolution:**

- If `EXPRESS_DBF_PATH` is set → DBF files are read from that folder directly (recommended for UAT).
- If only `ERP_BASE_PATH` is set → scripts use `{ERP_BASE_PATH}\{room}` (e.g. `...\ExpressI\TSS`).

---

## Python setup

```powershell
cd scripts\express-readonly-sync
python -m venv .venv
.\.venv\Scripts\pip install dbfread python-dotenv supabase
```

The virtualenv (`.venv`) and local cache (`cache/`) are gitignored.

---

## DBF → Supabase mapping (UAT scope)

| Express DBF | Supabase table | Golive pages |
|-------------|----------------|--------------|
| `STMAS.DBF` | `sc_express_products` | Product Master |
| `ARMAS.DBF` | `sc_express_customers` | Customer Master |
| `STLOC.DBF` | `sc_express_stock` | Stock Balance |
| `OESO.DBF` | `sc_express_so_headers` | Sales Order (header) |
| `OESOIT.DBF` | `sc_express_so_lines` | Sales Order (lines) |
| `ARTRN.DBF` | `sc_express_invoices` | Sales / Invoice history |

Encoding: **cp874** (primary), **tis-620** (fallback).

Sync policies (see `sync_policy.py`):

- **Master** (`STMAS`, `ARMAS`): full sync allowed
- **Stock** (`STLOC`): full sync allowed
- **Active orders** (`OESO`): open/active orders by default; closed orders need date window or `--full`
- **Detail / history** (`OESOIT`, `ARTRN`): latest 1 year by default; use `--since-date` or `--limit`

---

## Sync commands (recommended UAT order)

Run from `scripts\express-readonly-sync` with the venv Python:

```powershell
cd scripts\express-readonly-sync

.\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table STMAS.DBF
.\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table ARMAS.DBF
.\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table STLOC.DBF
.\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table OESO.DBF
.\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table OESOIT.DBF --limit 5000
.\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table ARTRN.DBF --since-date 2025-01-01
```

### Useful flags

| Flag | Purpose |
|------|---------|
| `--dry-run` | Parse and validate without writing to Supabase |
| `--limit N` | Cap records after policy filtering |
| `--since-date YYYY-MM-DD` | Override default date window |
| `--full` | Allow full sync on large/history tables (use with care) |
| `--retry-failed` | Retry rows in `sync_failed_records` instead of re-reading DBF |

Dry-run example:

```powershell
.\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table STMAS.DBF --dry-run
```

Batch helper (Windows):

```powershell
.\run_sync.bat
```

Check sync status (JSON output):

```powershell
.\.venv\Scripts\python.exe sync_status_check.py
```

---

## Verify in the app

1. Start the app: `npm run dev`
2. Open **Admin / Control → System Control** (`/admin/system-control`)
3. Review **Express Sync Status**:
   - Products / customers / stock / SO counts > 0 after first sync
   - Read-only mode active: **Yes**
   - Express write-back disabled: **Yes**
4. Click **Refresh sync status** after each sync run

See also: `docs/21_EXPRESS_SYNC_UAT_VALIDATION.md`

---

## Troubleshooting

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| `[FATAL] EXPRESS sync must run in READONLY_MODE=true` | `READONLY_MODE` disabled in mapping | Do not change — must stay `True` |
| `FileNotFoundError` / cannot open DBF | Wrong `EXPRESS_DBF_PATH` or no network share access | Verify UNC path from sync machine; test `dir \\server\expsrv\ExpressI\TSS\STMAS.DBF` |
| `Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY` | Missing server-side env | Add keys to `.env.local`; scripts load via `python-dotenv` from project root |
| Supabase upsert errors / RLS | Service role not used or table missing | Confirm `SUPABASE_SERVICE_ROLE_KEY`; check migrations for `sc_express_*` |
| Zero counts after sync | Wrong `SYNC_ROOM_CODE` or empty DBF | Match room code to Express folder; run `--dry-run` to see parsed count |
| Thai text garbled | Encoding mismatch | Scripts use cp874/tis-620; check `safe_dbf_parser.py` if new fields added |
| `sync_jobs` / status tables missing | Schema not deployed | Deploy Supabase schema; frontend shows info message until first sync |
| Failed records > 0 | Mapping or data quality issues | Query `sync_failed_records`; run `--retry-failed --retry-limit 100` |
| Disk space on Supabase | Large `--full` sync | Use `--since-date` and `--limit`; avoid `--full` on `OESOIT`/`ARTRN` without approval |

Local cache: `scripts/express-readonly-sync/cache/dbf_temp/` — safe to delete between runs.

---

## Script files

| File | Purpose |
|------|---------|
| `sync_express_readonly.py` | Entry point with read-only guard |
| `express_sync_engine.py` | Sync engine (parse, filter, upsert) |
| `express_table_mapping.py` | DBF → Supabase mapping and paths |
| `sync_policy.py` | Date/limit policies per table |
| `safe_dbf_parser.py` | SafeFieldParser + record cleaning |
| `sync_status_check.py` | Counts and last sync job status |
| `run_sync.bat` | Windows batch for UAT table order |

Adapted from `tss-supply-chain-management/sync_scripts/sync_express.py`.

---

## Related docs

- `docs/09_SUPABASE_ENV_SETUP.md` — Vite / Supabase frontend setup
- `docs/21_EXPRESS_SYNC_UAT_VALIDATION.md` — post-sync validation checklist
- `docs/17_THAI_UAT_TEST_SCRIPT.md` — Thai UAT with Express data section (E.1–E.7)
- `scripts/express-readonly-sync/README.md` — quick reference
