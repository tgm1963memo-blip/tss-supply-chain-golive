@echo off
setlocal
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Create venv: python -m venv .venv
  echo Then: .venv\Scripts\pip install dbfread python-dotenv supabase
  exit /b 1
)
".venv\Scripts\python.exe" sync_express_readonly.py %*
endlocal
