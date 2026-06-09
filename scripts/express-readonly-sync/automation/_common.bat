@echo off
setlocal EnableExtensions
set "AUTOMATION_DIR=%~dp0"
set "SYNC_ROOT=%AUTOMATION_DIR%.."
cd /d "%SYNC_ROOT%"

if not exist "logs" mkdir "logs"
if not exist ".venv\Scripts\python.exe" (
  echo [ERROR] Python venv missing. Run: python -m venv .venv
  echo Then: .venv\Scripts\pip install dbfread python-dotenv supabase
  exit /b 1
)

set "PYTHON=%SYNC_ROOT%\.venv\Scripts\python.exe"
set "SYNC=%PYTHON% sync_express_readonly.py"
set "REFRESH=%PYTHON% refresh_read_models.py"
set "RECORD=%PYTHON% automation\record_agent_run.py"
set "CHECK=%PYTHON% automation\check_sync_env.py"

"%CHECK%"
if errorlevel 1 exit /b 1

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "TS=%%i"
exit /b 0
