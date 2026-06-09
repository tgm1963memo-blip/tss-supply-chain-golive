# Remove TSS Express automated sync scheduled tasks.

$ErrorActionPreference = "Stop"

$taskNames = @(
    "TSS Express Active Rolling Sync",
    "TSS Express Master Daily Sync",
    "TSS Express Read Model Refresh"
)

foreach ($name in $taskNames) {
    $existing = Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
    if ($existing) {
        Unregister-ScheduledTask -TaskName $name -Confirm:$false
        Write-Host "Removed: $name"
    } else {
        Write-Host "Not found (skipped): $name"
    }
}

Write-Host "Uninstall complete."
