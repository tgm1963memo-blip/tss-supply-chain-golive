# Express read-only sync (Phase 3G)

Read Express ERP **DBF files only** → upsert into Supabase **staging tables** (`sc_express_*`).

## Rules

- **Read-only toward Express** — DBF files are copied to local cache and never modified
- **No write-back** to Express, no DBF updates, no stock posting
- **Service role key** is for this script only — never put in React/Vite frontend

## Setup

```powershell
cd scripts\express-readonly-sync
python -m venv .venv
.\.venv\Scripts\pip install dbfread python-dotenv supabase
```

Copy env from project root `.env.local` and add server-side keys:

```env
EXPRESS_DBF_PATH=\\server\expsrv\ExpressI\TSS
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SYNC_ROOM_CODE=TSS
```

Or use legacy `ERP_BASE_PATH=\\server\expsrv\ExpressI` with `--room TSS`.

## UAT sync (recommended order)

```powershell
cd scripts\express-readonly-sync
.\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table STMAS.DBF
.\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table ARMAS.DBF
.\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table STLOC.DBF
.\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table OESO.DBF
.\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table OESOIT.DBF --limit 5000
.\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table ARTRN.DBF --since-date 2025-01-01
```

Dry-run (no Supabase writes):

```powershell
.\.venv\Scripts\python.exe sync_express_readonly.py --room TSS --table STMAS.DBF --dry-run
```

Check status:

```powershell
.\.venv\Scripts\python.exe sync_status_check.py
```

## Files

| File | Purpose |
|------|---------|
| `sync_express_readonly.py` | Entry point with read-only guard |
| `express_sync_engine.py` | Sync engine (from management project) |
| `express_table_mapping.py` | DBF → Supabase table mapping |
| `sync_policy.py` | Date/limit policies |
| `safe_dbf_parser.py` | SafeFieldParser + record cleaning |
| `sync_status_check.py` | Counts and last sync job status |

## Source project

Adapted from `tss-supply-chain-management/sync_scripts/sync_express.py`.

See also: `docs/20_EXPRESS_READONLY_SYNC_SETUP.md`, `docs/21_EXPRESS_SYNC_UAT_VALIDATION.md`.
