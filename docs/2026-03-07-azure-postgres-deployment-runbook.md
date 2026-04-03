# KEON Control Azure PostgreSQL Deployment Runbook

**Date:** 2026-03-07  
**Status:** Draft  
**Owner:** Platform / Control Plane  
**Related:** [docs/2026-03-07-azure-postgres-flexible-server-setup-plan.md](D:/Repos/keon-omega/keon.control.website/docs/2026-03-07-azure-postgres-flexible-server-setup-plan.md), [infra/azure/postgres-flex/main.bicep](D:/Repos/keon-omega/keon.control.website/infra/azure/postgres-flex/main.bicep), [scripts/deploy-control-plane-postgres.ps1](D:/Repos/keon-omega/keon.control.website/scripts/deploy-control-plane-postgres.ps1), [scripts/bootstrap-control-plane-db.ps1](D:/Repos/keon-omega/keon.control.website/scripts/bootstrap-control-plane-db.ps1)

---

## 1. What This Adds

This repo now includes:

- a Bicep template for Azure Database for PostgreSQL Flexible Server
- example parameter files for `dev` and `prod`
- a PowerShell deployment wrapper that emits the exact `DATABASE_URL`
- a PowerShell bootstrap wrapper that runs `pnpm db:init`

Files:

- [infra/azure/postgres-flex/main.bicep](D:/Repos/keon-omega/keon.control.website/infra/azure/postgres-flex/main.bicep)
- [infra/azure/postgres-flex/dev.parameters.example.json](D:/Repos/keon-omega/keon.control.website/infra/azure/postgres-flex/dev.parameters.example.json)
- [infra/azure/postgres-flex/prod.parameters.example.json](D:/Repos/keon-omega/keon.control.website/infra/azure/postgres-flex/prod.parameters.example.json)
- [scripts/deploy-control-plane-postgres.ps1](D:/Repos/keon-omega/keon.control.website/scripts/deploy-control-plane-postgres.ps1)
- [scripts/bootstrap-control-plane-db.ps1](D:/Repos/keon-omega/keon.control.website/scripts/bootstrap-control-plane-db.ps1)

---

## 2. Prerequisites

Install and authenticate:

```powershell
az login
az account set --subscription "<subscription-id-or-name>"
```

Ensure:

- the target resource group exists
- `pnpm install` has been run in this repo
- the operator machine can reach the database path you choose

---

## 3. Dev Deployment

Recommended first pass:

- use `public` mode for `dev`
- restrict firewall access to the operator or runner IP only

Example:

```powershell
.\scripts\deploy-control-plane-postgres.ps1 `
  -ResourceGroupName "rg-keon-control-dev" `
  -EnvironmentName dev `
  -AdministratorPassword "<strong-password>" `
  -PublicAccessStartIp "203.0.113.10" `
  -PublicAccessEndIp "203.0.113.10"
```

What it does:

- deploys [infra/azure/postgres-flex/main.bicep](D:/Repos/keon-omega/keon.control.website/infra/azure/postgres-flex/main.bicep)
- provisions a Burstable dev server by default
- creates database `keon_control`
- prints a ready-to-use `DATABASE_URL`

Bootstrap the schema:

```powershell
$env:DATABASE_URL="postgresql://keon_admin:<password>@keon-control-dev-pg.postgres.database.azure.com:5432/keon_control?sslmode=require"
.\scripts\bootstrap-control-plane-db.ps1
```

---

## 4. Prod Deployment

Recommended target:

- use `private` mode
- run bootstrap from a host inside the VNet or through approved private connectivity

Example:

```powershell
.\scripts\deploy-control-plane-postgres.ps1 `
  -ResourceGroupName "rg-keon-control-prod" `
  -EnvironmentName prod `
  -AdministratorPassword "<strong-password>"
```

Default production behavior:

- General Purpose `Standard_D2ads_v5`
- 128 GiB storage
- 14-day backups
- private VNet, delegated subnet, and private DNS zone

If you want HA at provision time:

```powershell
.\scripts\deploy-control-plane-postgres.ps1 `
  -ResourceGroupName "rg-keon-control-prod" `
  -EnvironmentName prod `
  -AdministratorPassword "<strong-password>" `
  -HighAvailabilityMode ZoneRedundant
```

Bootstrap the schema from an approved network path:

```powershell
$env:DATABASE_URL="postgresql://keon_admin:<password>@keon-control-prod-pg.postgres.database.azure.com:5432/keon_control?sslmode=require"
.\scripts\bootstrap-control-plane-db.ps1
```

---

## 5. App Environment Setup

After the database exists and `pnpm db:init` succeeds, set app configuration based on the environment blocks in [docs/2026-03-07-azure-postgres-flexible-server-setup-plan.md](D:/Repos/keon-omega/keon.control.website/docs/2026-03-07-azure-postgres-flexible-server-setup-plan.md).

Minimum required database settings:

```bash
DATABASE_URL=postgresql://keon_admin:<password>@<server>.postgres.database.azure.com:5432/keon_control?sslmode=require
DATABASE_POOL_MAX=5
```

Production starting point:

```bash
DATABASE_POOL_MAX=10
```

---

## 6. Safe Operating Sequence

Use this order:

1. provision the server
2. capture the generated `DATABASE_URL`
3. run `.\scripts\bootstrap-control-plane-db.ps1`
4. configure app secrets and non-secret env vars
5. deploy the app
6. verify billing/session/webhook persistence paths

Avoid:

- deploying the app with `DATABASE_URL` set before schema bootstrap is complete
- leaving `dev` public firewall rules broader than necessary
- treating `pnpm db:init` as a long-term migration strategy

---

## 7. Next Infra Follow-Ups

The immediate follow-ups after this runbook should be:

1. add app-host infrastructure and wire its app settings to the DB outputs
2. move live DB and Stripe secrets into Key Vault
3. replace bootstrap-only SQL evolution with real migrations
