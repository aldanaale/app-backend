$ErrorActionPreference = "Stop"
param(
  [string]$ContainerName = "db",
  [string]$User = "postgres",
  [string]$Db = "mudanzaapp",
  [string]$Input = "../backups/mudanza_backup.sql"
)
Get-Content -Path $Input | docker exec -i $ContainerName psql -U $User -d $Db
Write-Output "Restore ejecutado desde $Input"
