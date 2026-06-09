# Express Sync Automation

Windows batch wrappers and Task Scheduler installers for Phase 3J automated read-only sync.

## Prerequisites

1. Python venv at `scripts/express-readonly-sync/.venv`
2. `.env` in `scripts/express-readonly-sync/` with:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-side only — never in frontend)
   - `EXPRESS_DBF_PATH` or network access to `\\server\expsrv\ExpressI`
   - `READONLY_MODE=true`
3. Always-on Windows machine with NAS/Express share access

## Manual runs

```bat
cd scripts\express-readonly-sync\automation
run_active_rolling_sync.bat
run_master_daily_sync.bat
run_historical_once_sync.bat
run_refresh_read_models.bat
```

Logs: `scripts/express-readonly-sync/logs/`

## Install scheduled tasks (Administrator PowerShell)

```powershell
cd scripts\express-readonly-sync\automation
powershell -ExecutionPolicy Bypass -File .\install_windows_task_scheduler.ps1
```

Then in Task Scheduler, set each task:
- Run whether user is logged on or not
- Use service account with Express share + Supabase access

## Uninstall

```powershell
powershell -ExecutionPolicy Bypass -File .\uninstall_windows_task_scheduler.ps1
```

## Validate environment

```bat
.venv\Scripts\python.exe automation\check_sync_env.py
```

See also: `docs/22_AUTOMATED_EXPRESS_SYNC_AGENT.md`
