[CmdletBinding()]
param(
    [string]$DatabaseUrl
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot

if (-not $DatabaseUrl) {
    $DatabaseUrl = $env:DATABASE_URL
}

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    throw 'Provide -DatabaseUrl or set DATABASE_URL in the environment before running bootstrap-control-plane-db.ps1.'
}

$env:DATABASE_URL = $DatabaseUrl

Push-Location $repoRoot
try {
    Write-Host 'Running pnpm db:init against the configured database.'
    & pnpm db:init
    if ($LASTEXITCODE -ne 0) {
        throw "pnpm db:init failed with exit code $LASTEXITCODE."
    }
} finally {
    Pop-Location
}
