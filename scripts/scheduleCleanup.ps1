$ErrorActionPreference = "Stop"
$taskName = "MudanzaCleanupRefreshTokens"
$workDir = (Resolve-Path "..").Path
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -Command `"cd $workDir\\backend; npm run cleanup:refresh`""
$trigger = New-ScheduledTaskTrigger -Daily -At 02:00
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Description "Purga refresh tokens expirados/revocados" -RunLevel Highest -Force
Write-Output "Scheduled task '$taskName' registered."
