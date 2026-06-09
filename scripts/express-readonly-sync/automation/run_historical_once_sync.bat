@echo off
setlocal EnableExtensions
call "%~dp0_common.bat"
if errorlevel 1 exit /b 1

set "LOG=%SYNC_ROOT%\logs\historical_once_sync_%TS%.log"
echo [%date% %time%] Starting historical once sync ^> "%LOG%"

(
  echo === Historical once sync started %TS% ===
  "%RECORD%" --run historical_once --status running --detail "batch start"
  "%SYNC%" --historical-rooms --table STMAS.DBF --full
  if errorlevel 1 goto :failed
  "%SYNC%" --historical-rooms --table ARMAS.DBF --full
  if errorlevel 1 goto :failed
  "%SYNC%" --historical-rooms --table STLOC.DBF --full
  if errorlevel 1 goto :failed
  "%SYNC%" --historical-rooms --table OESO.DBF --full
  if errorlevel 1 goto :failed
  "%SYNC%" --historical-rooms --table OESOIT.DBF --full
  if errorlevel 1 goto :failed
  "%SYNC%" --historical-rooms --table ARTRN.DBF --full
  if errorlevel 1 goto :failed
  "%RECORD%" --run historical_once --status completed --detail "batch finished"
  echo === Historical once sync completed ===
  exit /b 0
) >> "%LOG%" 2>&1
exit /b 0

:failed
(
  echo === Historical once sync FAILED ===
  "%RECORD%" --run historical_once --status failed --detail "see log"
) >> "%LOG%" 2>&1
exit /b 1
