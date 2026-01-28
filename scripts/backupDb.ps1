$ErrorActionPreference = "Stop"
param(
  [string]$ContainerName = "db",
  [string]$User = "postgres",
  [string]$Db = "mudanzaapp",
  [string]$Output = "../backups/mudanza_backup.sql"
)
if (!(Test-Path (Split-Path $Output))) { New-Item -ItemType Directory -Path (Split-Path $Output) | Out-Null }
docker exec -t $ContainerName pg_dump -U $User -d $Db | Set-Content -Path $Output
Write-Output "Backup creado en $Output"
