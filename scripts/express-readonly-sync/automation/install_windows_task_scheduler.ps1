# install_windows_task_scheduler.ps1
# Install automated Express read-only sync tasks using schtasks.exe
# Safe mode: no Express DBF write-back.

$ErrorActionPreference = "Stop"

$AutomationDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SyncRoot = Split-Path -Parent $AutomationDir

Write-Host "Sync root: $SyncRoot"
Write-Host "Automation dir: $AutomationDir"
Write-Host "Installing scheduled tasks by schtasks.exe..."

$ActiveBat = Join-Path $AutomationDir "run_active_rolling_sync.bat"
$MasterBat = Join-Path $AutomationDir "run_master_daily_sync.bat"
$RefreshBat = Join-Path $AutomationDir "run_refresh_read_models.bat"

foreach ($file in @($ActiveBat, $MasterBat, $RefreshBat)) {
    if (-not (Test-Path $file)) {
        throw "Required batch file not found: $file"
    }
}

$TaskNames = @(
    "TSS Express Active Rolling Sync",
    "TSS Express Master Daily Sync",
    "TSS Express Read Model Refresh"
)

foreach ($taskName in $TaskNames) {
    Write-Host "Checking existing task: $taskName"

    cmd.exe /c "schtasks /Query /TN ""$taskName"" >nul 2>nul"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Removing existing task: $taskName"
        cmd.exe /c "schtasks /Delete /TN ""$taskName"" /F"

        if ($LASTEXITCODE -ne 0) {
            throw "Failed to delete existing task: $taskName"
        }
    } else {
        Write-Host "Task not found, skip delete: $taskName"
    }
}

Write-Host "Creating: TSS Express Active Rolling Sync"
cmd.exe /c "schtasks /Create /TN ""TSS Express Active Rolling Sync"" /TR ""\""$ActiveBat\"""" /SC MINUTE /MO 15 /F"

if ($LASTEXITCODE -ne 0) {
    throw "Failed to create TSS Express Active Rolling Sync"
}

Write-Host "Creating: TSS Express Master Daily Sync"
cmd.exe /c "schtasks /Create /TN ""TSS Express Master Daily Sync"" /TR ""\""$MasterBat\"""" /SC DAILY /ST 02:00 /F"

if ($LASTEXITCODE -ne 0) {
    throw "Failed to create TSS Express Master Daily Sync"
}

Write-Host "Creating: TSS Express Read Model Refresh"
cmd.exe /c "schtasks /Create /TN ""TSS Express Read Model Refresh"" /TR ""\""$RefreshBat\"""" /SC MINUTE /MO 30 /F"

if ($LASTEXITCODE -ne 0) {
    throw "Failed to create TSS Express Read Model Refresh"
}

Write-Host ""
Write-Host "Installed scheduled tasks:"
cmd.exe /c "schtasks /Query /TN ""TSS Express Active Rolling Sync"""
cmd.exe /c "schtasks /Query /TN ""TSS Express Master Daily Sync"""
cmd.exe /c "schtasks /Query /TN ""TSS Express Read Model Refresh"""

Write-Host ""
Write-Host "IMPORTANT:"
Write-Host "1. Open Task Scheduler and set each task to run whether user is logged on or not if needed."
Write-Host "2. Use a Windows service account with read access to \\server\expsrv\ExpressI"
Write-Host "3. Ensure scripts\express-readonly-sync\.env has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
Write-Host "4. Never commit .env or expose service role key to the React frontend"
Write-Host ""
Write-Host ("Uninstall: powershell -ExecutionPolicy Bypass -File ""{0}""" -f (Join-Path $AutomationDir "uninstall_windows_task_scheduler.ps1"))