@echo off
setlocal enabledelayedexpansion

REM Run active rolling Express read-only sync.
REM Safe mode: no Express DBF write-back.

set "AUTOMATION_DIR=%~dp0"
set "SYNC_ROOT=%AUTOMATION_DIR%.."

cd /d "%SYNC_ROOT%"

if not exist "logs" mkdir "logs"

for /f "tokens=1-4 delims=/ " %%a in ("%date%") do (
  set "DD=%%a"
  set "MM=%%b"
  set "YYYY=%%c"
)

for /f "tokens=1-3 delims=:." %%a in ("%time%") do (
  set "HH=%%a"
  set "MI=%%b"
  set "SS=%%c"
)

set "HH=%HH: =0%"
set "LOG_FILE=logs\active_rolling_sync_%YYYY%%MM%%DD%_%HH%%MI%%SS%.log"

echo ================================================== >> "%LOG_FILE%"
echo Active Rolling Sync started at %date% %time% >> "%LOG_FILE%"
echo Sync root: %CD% >> "%LOG_FILE%"
echo Read-only mode: true >> "%LOG_FILE%"
echo Express write-back: disabled >> "%LOG_FILE%"
echo ================================================== >> "%LOG_FILE%"

if exist ".venv\Scripts\python.exe" (
  set "PYTHON_EXE=.venv\Scripts\python.exe"
) else (
  set "PYTHON_EXE=python"
)

echo Using Python: %PYTHON_EXE% >> "%LOG_FILE%"

%PYTHON_EXE% sync_express_readonly.py --active-rooms --table STLOC.DBF >> "%LOG_FILE%" 2>&1
%PYTHON_EXE% sync_express_readonly.py --active-rooms --table OESO.DBF --months 2 >> "%LOG_FILE%" 2>&1
%PYTHON_EXE% sync_express_readonly.py --active-rooms --table OESOIT.DBF --months 2 >> "%LOG_FILE%" 2>&1
%PYTHON_EXE% sync_express_readonly.py --active-rooms --table ARTRN.DBF --months 2 >> "%LOG_FILE%" 2>&1

if exist "refresh_read_models.py" (
  %PYTHON_EXE% refresh_read_models.py >> "%LOG_FILE%" 2>&1
)

echo ================================================== >> "%LOG_FILE%"
echo Active Rolling Sync finished at %date% %time% >> "%LOG_FILE%"
echo ================================================== >> "%LOG_FILE%"

exit /b 0