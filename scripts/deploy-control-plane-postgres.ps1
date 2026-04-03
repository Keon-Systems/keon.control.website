[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName,

    [Parameter(Mandatory = $true)]
    [ValidateSet('dev', 'prod')]
    [string]$EnvironmentName,

    [string]$Location = 'eastus2',

    [ValidateSet('public', 'private')]
    [string]$NetworkMode,

    [string]$ServerName,

    [string]$DatabaseName = 'keon_control',

    [string]$AdministratorLogin = 'keon_admin',

    [Parameter(Mandatory = $true)]
    [string]$AdministratorPassword,

    [string]$SkuName,

    [ValidateSet('Burstable', 'GeneralPurpose', 'MemoryOptimized')]
    [string]$SkuTier,

    [int]$StorageSizeGB,

    [int]$BackupRetentionDays,

    [ValidateSet('Disabled', 'SameZone', 'ZoneRedundant')]
    [string]$HighAvailabilityMode = 'Disabled',

    [string]$AvailabilityZone = '1',

    [string]$StandbyAvailabilityZone = '2',

    [string]$PublicAccessStartIp,

    [string]$PublicAccessEndIp,

    [string]$PrivateDnsZoneName,

    [string]$VirtualNetworkName,

    [string]$VirtualNetworkAddressPrefix,

    [string]$DelegatedSubnetName = 'postgres',

    [string]$DelegatedSubnetPrefix,

    [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'

function Require-Command([string]$Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found in PATH."
    }
}

Require-Command 'az'

$repoRoot = Split-Path -Parent $PSScriptRoot
$templateFile = Join-Path $repoRoot 'infra\azure\postgres-flex\main.bicep'

if (-not (Test-Path $templateFile)) {
    throw "Template file not found: $templateFile"
}

if (-not $ServerName) {
    $ServerName = "keon-control-$EnvironmentName-pg"
}

if (-not $NetworkMode) {
    $NetworkMode = if ($EnvironmentName -eq 'prod') { 'private' } else { 'public' }
}

if (-not $SkuTier) {
    $SkuTier = if ($EnvironmentName -eq 'prod') { 'GeneralPurpose' } else { 'Burstable' }
}

if (-not $SkuName) {
    $SkuName = if ($EnvironmentName -eq 'prod') { 'Standard_D2ads_v5' } else { 'Standard_B2ms' }
}

if (-not $StorageSizeGB) {
    $StorageSizeGB = if ($EnvironmentName -eq 'prod') { 128 } else { 64 }
}

if (-not $BackupRetentionDays) {
    $BackupRetentionDays = if ($EnvironmentName -eq 'prod') { 14 } else { 7 }
}

if ($NetworkMode -eq 'public' -and [string]::IsNullOrWhiteSpace($PublicAccessStartIp)) {
    throw 'Public mode requires -PublicAccessStartIp.'
}

if ($NetworkMode -eq 'public' -and [string]::IsNullOrWhiteSpace($PublicAccessEndIp)) {
    $PublicAccessEndIp = $PublicAccessStartIp
}

if ($NetworkMode -eq 'private') {
    if (-not $PrivateDnsZoneName) {
        $PrivateDnsZoneName = "$ServerName.postgres.database.azure.com"
    }
    if (-not $VirtualNetworkName) {
        $VirtualNetworkName = "$ServerName-vnet"
    }
    if (-not $VirtualNetworkAddressPrefix) {
        $VirtualNetworkAddressPrefix = if ($EnvironmentName -eq 'prod') { '10.50.0.0/16' } else { '10.40.0.0/16' }
    }
    if (-not $DelegatedSubnetPrefix) {
        $DelegatedSubnetPrefix = if ($EnvironmentName -eq 'prod') { '10.50.1.0/24' } else { '10.40.1.0/24' }
    }
}

$parameters = @{
    location = $Location
    networkMode = $NetworkMode
    serverName = $ServerName
    databaseName = $DatabaseName
    administratorLogin = $AdministratorLogin
    administratorPassword = $AdministratorPassword
    skuTier = $SkuTier
    skuName = $SkuName
    storageSizeGB = $StorageSizeGB
    backupRetentionDays = $BackupRetentionDays
    highAvailabilityMode = $HighAvailabilityMode
    availabilityZone = $AvailabilityZone
    standbyAvailabilityZone = $StandbyAvailabilityZone
}

if ($NetworkMode -eq 'public') {
    $parameters.publicFirewallRules = @(
        @{
            name = 'operator-access'
            startIpAddress = $PublicAccessStartIp
            endIpAddress = $PublicAccessEndIp
        }
    ) | ConvertTo-Json -Compress
} else {
    $parameters.privateDnsZoneName = $PrivateDnsZoneName
    $parameters.virtualNetworkName = $VirtualNetworkName
    $parameters.virtualNetworkAddressPrefix = $VirtualNetworkAddressPrefix
    $parameters.delegatedSubnetName = $DelegatedSubnetName
    $parameters.delegatedSubnetPrefix = $DelegatedSubnetPrefix
}

$parameterArgs = @()
foreach ($entry in $parameters.GetEnumerator()) {
    $parameterArgs += "$($entry.Key)=$($entry.Value)"
}

$deploymentName = "control-postgres-$EnvironmentName-$(Get-Date -Format 'yyyyMMddHHmmss')"

$azArgs = @(
    'deployment', 'group', 'create',
    '--resource-group', $ResourceGroupName,
    '--name', $deploymentName,
    '--template-file', $templateFile,
    '--parameters'
) + $parameterArgs + @('--output', 'json')

if ($WhatIf) {
    $azArgs = @(
        'deployment', 'group', 'what-if',
        '--resource-group', $ResourceGroupName,
        '--name', $deploymentName,
        '--template-file', $templateFile,
        '--parameters'
    ) + $parameterArgs + @('--output', 'json')
}

Write-Host "Executing: az $($azArgs -join ' ')"
$raw = & az @azArgs
if ($LASTEXITCODE -ne 0) {
    throw "Azure deployment command failed with exit code $LASTEXITCODE."
}

if ($WhatIf) {
    $raw
    return
}

$deployment = $raw | ConvertFrom-Json -Depth 20
$outputs = $deployment.properties.outputs

$databaseHost = $outputs.databaseHost.value
$databaseNameOut = $outputs.databaseNameOut.value
$administratorLoginOut = $outputs.administratorLoginOut.value
$encodedPassword = [System.Uri]::EscapeDataString($AdministratorPassword)
$databaseUrl = "postgresql://${administratorLoginOut}:${encodedPassword}@${databaseHost}:5432/${databaseNameOut}?sslmode=require"

Write-Host ''
Write-Host 'Provisioned Azure PostgreSQL Flexible Server.'
Write-Host "Resource group : $ResourceGroupName"
Write-Host "Environment    : $EnvironmentName"
Write-Host "Network mode   : $NetworkMode"
Write-Host "Server         : $($outputs.serverNameOut.value)"
Write-Host "Host           : $databaseHost"
Write-Host "Database       : $databaseNameOut"
Write-Host ''
Write-Host 'DATABASE_URL'
Write-Host $databaseUrl
Write-Host ''
Write-Host 'Next step:'
Write-Host "  `$env:DATABASE_URL='$databaseUrl'; .\scripts\bootstrap-control-plane-db.ps1"
