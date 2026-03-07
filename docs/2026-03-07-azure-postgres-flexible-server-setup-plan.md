# KEON Control Azure PostgreSQL Flexible Server Setup Plan

**Date:** 2026-03-07  
**Status:** Draft  
**Owner:** Platform / Control Plane  
**Depends On:** [db/control-plane.sql](D:/Repos/keon-omega/keon.control.website/db/control-plane.sql), [scripts/init-control-plane-db.mjs](D:/Repos/keon-omega/keon.control.website/scripts/init-control-plane-db.mjs), [src/lib/server/control-plane-db.ts](D:/Repos/keon-omega/keon.control.website/src/lib/server/control-plane-db.ts), [docs/2026-03-06-billing-backend-wiring-plan.md](D:/Repos/keon-omega/keon.control.website/docs/2026-03-06-billing-backend-wiring-plan.md)

---

## 1. Scope

This plan covers the first Azure PostgreSQL deployment for `keon.control.website` using Azure Database for PostgreSQL Flexible Server.

It is intentionally aligned to the repository as it exists today:

- the app only requires `DATABASE_URL` and `DATABASE_POOL_MAX` for PostgreSQL
- schema bootstrap is done by `pnpm db:init`
- the control-plane DB currently stores billing sessions, billing projections, tenants, webhook dedupe rows, and seed/demo state
- no Azure infrastructure has been provisioned from this repo yet

---

## 2. Recommended Starting Shape

### 2.1 Environment recommendation

Use separate servers per environment:

- `local`: no Azure database required by default; leave `DATABASE_URL` unset and the app stays in mock mode
- `dev`: one small Azure Flexible Server for integration testing
- `prod`: one dedicated Azure Flexible Server for customer-facing control-plane state

### 2.2 SKU recommendation

Recommended starting sizes:

- `dev`: Burstable `Standard_B2ms`, 2 vCores, 8 GiB RAM, 64-128 GiB storage
- `prod`: General Purpose `Standard_D2ads_v5` or `Standard_D2ads_v6`, 2 vCores, 8 GiB RAM, 128 GiB storage

Rationale:

- Microsoft currently positions Burstable for dev, proof-of-concept, and small low-duty workloads, and explicitly says it is not recommended for production workloads.
- Microsoft positions General Purpose as the default fit for most production workloads.
- This app’s current schema and traffic profile are light, so a 2-vCore General Purpose server is a reasonable day-1 production floor without overcommitting.

### 2.3 High availability recommendation

Start with:

- `dev`: no HA
- `prod`: no HA for the very first internal rollout if cost sensitivity is higher than uptime requirements

Move to:

- `prod`: zone-redundant HA before the database becomes business-critical for real tenant billing and subscription operations

Notes:

- HA is supported on General Purpose and Memory Optimized, not Burstable.
- Enabling HA is the clean path once the control plane becomes authoritative for real customer billing state.

---

## 3. Network Recommendation

### 3.1 Preferred production topology

Prefer **Private access (virtual network integration)** for `dev` and `prod` if the app will run in Azure.

Recommended layout:

1. Create a dedicated VNet for app/data workloads.
2. Create a delegated subnet for PostgreSQL Flexible Server.
3. Create or attach a Private DNS zone ending in `.postgres.database.azure.com`.
4. Place the app runtime in the same VNet or a peered VNet.
5. Reach the server only by FQDN, never by IP.

Why this is the preferred path:

- it keeps the database off the public internet
- it matches Azure’s native private networking model for Flexible Server
- it avoids broad firewall exceptions later

### 3.2 Local developer access guidance

Private access is the right production posture, but it complicates laptop access.

Use one of these patterns:

- preferred: run `pnpm db:init` and other admin tasks from an Azure-hosted runner or VM inside the VNet
- acceptable: use VPN/ExpressRoute into the VNet if the team already has it
- temporary fallback: provision `dev` as public access with tightly scoped firewall rules, then lock down later

Do not use broad public firewall openings as the steady-state production design.

### 3.3 Public access fallback

If the team needs faster initial setup before app networking exists, use **Public access (allowed IP addresses)** only for `dev`, or briefly for first bootstrap.

If using public access:

- allow only specific outbound IPs for the app or operator machine
- do not enable broad “allow Azure services” style access
- still use the FQDN and TLS in the connection string

### 3.4 Private endpoint note

Azure supports Private Link/private endpoints for servers created with **public access** networking. It is not the same as the **private access (VNet integration)** model.

For this repo, choose one of these and keep it simple:

- preferred: private access (VNet integration) for the real target topology
- fallback: public access plus narrow firewall rules for early-stage setup

---

## 4. Connection String Format

The current code passes `DATABASE_URL` directly into `pg`:

- [src/lib/server/control-plane-db.ts](D:/Repos/keon-omega/keon.control.website/src/lib/server/control-plane-db.ts)
- [scripts/init-control-plane-db.mjs](D:/Repos/keon-omega/keon.control.website/scripts/init-control-plane-db.mjs)

Use this format:

```bash
postgresql://<admin-user>:<urlencoded-password>@<server-name>.postgres.database.azure.com:5432/<database-name>?sslmode=require
```

Example:

```bash
DATABASE_URL=postgresql://keon_admin:REPLACE_ME@keon-control-dev-pg.postgres.database.azure.com:5432/keon_control?sslmode=require
```

Important details:

- use the server FQDN from Azure, not an IP address
- use the Flexible Server admin username exactly as created in Azure
- URL-encode the password if it contains `@`, `:`, `/`, `?`, `#`, or `%`
- keep `sslmode=require` at minimum so `pg` connects with TLS

### 4.1 TLS hardening note

For this repo as written today, `sslmode=require` is the lowest-friction compatible choice because the app only supplies a connection string to `pg`.

Future hardening can move toward stricter certificate verification, but that likely requires an explicit client SSL configuration path instead of relying only on `DATABASE_URL`.

---

## 5. Environment Variables

### 5.1 Local development, mock-only

Use this when working on the UI or API shim without Azure:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/control
NEXT_PUBLIC_API_TIMEOUT=10000
NEXT_PUBLIC_API_USE_MOCK_FALLBACK=true
NEXT_PUBLIC_APP_ORIGIN=http://localhost:3000
DATABASE_URL=
DATABASE_POOL_MAX=5
NEXT_PUBLIC_API_LIVE_MODE=false
KEON_CONTROL_GOVERNANCE_MODE=mock
KEON_CONTROL_GOVERNANCE_BASE_URL=http://localhost:5000
KEON_CONTROL_GOVERNANCE_TIMEOUT_MS=5000
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTUP=
STRIPE_PRICE_GROWTH=
```

### 5.2 Local development against Azure `dev` database

Use this when the website runs locally but persists billing/control data in Azure PostgreSQL:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/control
NEXT_PUBLIC_API_TIMEOUT=10000
NEXT_PUBLIC_API_USE_MOCK_FALLBACK=false
NEXT_PUBLIC_APP_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://keon_admin:REPLACE_ME@keon-control-dev-pg.postgres.database.azure.com:5432/keon_control?sslmode=require
DATABASE_POOL_MAX=5
NEXT_PUBLIC_API_LIVE_MODE=true
KEON_CONTROL_GOVERNANCE_MODE=mock
KEON_CONTROL_GOVERNANCE_BASE_URL=http://localhost:5000
KEON_CONTROL_GOVERNANCE_TIMEOUT_MS=5000
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTUP=
STRIPE_PRICE_GROWTH=
```

### 5.3 Shared dev deployment

Use this when the app is deployed to an Azure-hosted `dev` environment:

```bash
NEXT_PUBLIC_API_BASE_URL=https://control-dev.keon.systems/api/control
NEXT_PUBLIC_API_TIMEOUT=10000
NEXT_PUBLIC_API_USE_MOCK_FALLBACK=false
NEXT_PUBLIC_APP_ORIGIN=https://control-dev.keon.systems
DATABASE_URL=postgresql://keon_admin:REPLACE_ME@keon-control-dev-pg.postgres.database.azure.com:5432/keon_control?sslmode=require
DATABASE_POOL_MAX=5
NEXT_PUBLIC_API_LIVE_MODE=true
KEON_CONTROL_GOVERNANCE_MODE=live
KEON_CONTROL_GOVERNANCE_BASE_URL=https://governance-dev.keon.systems
KEON_CONTROL_GOVERNANCE_TIMEOUT_MS=5000
STRIPE_SECRET_KEY=sk_test_REPLACE_ME
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_ME
STRIPE_PRICE_STARTUP=price_REPLACE_ME
STRIPE_PRICE_GROWTH=price_REPLACE_ME
```

### 5.4 Production deployment

Use this for the real customer-facing control plane:

```bash
NEXT_PUBLIC_API_BASE_URL=https://control.keon.systems/api/control
NEXT_PUBLIC_API_TIMEOUT=10000
NEXT_PUBLIC_API_USE_MOCK_FALLBACK=false
NEXT_PUBLIC_APP_ORIGIN=https://control.keon.systems
DATABASE_URL=postgresql://keon_admin:REPLACE_ME@keon-control-prod-pg.postgres.database.azure.com:5432/keon_control?sslmode=require
DATABASE_POOL_MAX=10
NEXT_PUBLIC_API_LIVE_MODE=true
KEON_CONTROL_GOVERNANCE_MODE=live
KEON_CONTROL_GOVERNANCE_BASE_URL=https://governance.keon.systems
KEON_CONTROL_GOVERNANCE_TIMEOUT_MS=5000
STRIPE_SECRET_KEY=sk_live_REPLACE_ME
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_ME
STRIPE_PRICE_STARTUP=price_REPLACE_ME
STRIPE_PRICE_GROWTH=price_REPLACE_ME
```

### 5.5 Secret handling

Do not commit live values for:

- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTUP`
- `STRIPE_PRICE_GROWTH`

---

## 6. Provisioning and Bootstrap Steps

### 6.1 Azure provisioning sequence

1. Create resource group for the environment.
2. Create VNet and required subnets if using private access.
3. Create Azure Database for PostgreSQL Flexible Server.
4. Create database `keon_control`.
5. Record:
   - server FQDN
   - admin username
   - database name
6. Configure backup retention:
   - `dev`: 7 days
   - `prod`: 14-35 days depending on recovery requirements
7. Configure networking:
   - private access preferred
   - otherwise, narrow public firewall rules only
8. Set app environment variables in the deployment platform.

### 6.2 Database bootstrap

From a trusted machine or runner that can reach the database:

```bash
pnpm install
pnpm db:init
```

`pnpm db:init` executes [scripts/init-control-plane-db.mjs](D:/Repos/keon-omega/keon.control.website/scripts/init-control-plane-db.mjs), which applies [db/control-plane.sql](D:/Repos/keon-omega/keon.control.website/db/control-plane.sql).

### 6.3 First application start

After `pnpm db:init` succeeds:

1. start or deploy the website
2. hit the control-plane routes
3. verify that `me`, tenant, usage, billing summary, and billing session writes succeed
4. if Stripe is enabled, configure the webhook target and verify event dedupe writes into `control_webhook_events`

### 6.4 Suggested initial verification

Verify:

- app starts with `DATABASE_URL` set
- `Admin > Subscription` loads
- a checkout session row persists
- a portal session row persists
- Stripe webhook events can be received and deduped

---

## 7. Operational Notes

### 7.1 Pool sizing

This repo currently uses a direct `pg` pool with `DATABASE_POOL_MAX`.

Recommended starting values:

- local: `5`
- dev: `5`
- prod: `10`

If the app is scaled out horizontally, reduce per-instance pool size or add connection pooling strategy before increasing app replica count aggressively.

### 7.2 Restore behavior

Azure point-in-time restore creates a **new server**. It does not overwrite the existing one.

Plan for recovery like this:

1. restore to a new server
2. update `DATABASE_URL`
3. redeploy or restart the app
4. validate application reads/writes

---

## 8. Future Hardening

### 8.1 Schema migrations

Current state:

- schema bootstrap is SQL-file based via `pnpm db:init`

Recommended next step:

- introduce explicit migrations so schema evolution is ordered, repeatable, and reviewable
- keep `db/control-plane.sql` either as the baseline snapshot or replace it with a migrations directory plus a bootstrap command

### 8.2 Audit tables

The current schema stores webhook dedupe but not full audit history.

Add:

- billing transition audit table
- actor + request metadata for admin mutations
- webhook payload or normalized event audit table with retention policy

### 8.3 Backups and restore practice

Add:

- documented PITR runbook
- quarterly restore drill in `dev`
- production backup retention review
- optional Azure Backup long-term retention for compliance or forensic needs

### 8.4 Secret storage

Move live secrets out of app config files and into Azure Key Vault.

Recommended direction:

- store DB credentials and Stripe secrets in Key Vault
- grant the app runtime managed identity access to only required secrets
- inject secrets into the app at deploy/runtime rather than storing them directly in repo-managed environment files

### 8.5 Network tightening

After first deployment:

- eliminate temporary public firewall rules
- keep database access only from approved app/admin paths
- standardize DNS for private connectivity

---

## 9. Recommended Next Session

The next session should focus on one of these:

1. Infrastructure-as-code for Azure PostgreSQL Flexible Server, VNet, DNS, and app settings.
2. A deployment runbook for `dev` and `prod`.
3. Migration tooling so `pnpm db:init` is no longer the long-term schema evolution path.

---

## 10. Source Notes

This plan is based on the repo’s current implementation and current Microsoft Learn guidance as of 2026-03-07:

- [Compute options in Azure Database for PostgreSQL](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-compute)
- [Networking overview with private access (virtual network)](https://learn.microsoft.com/en-us/azure/postgresql/network/concepts-networking-private)
- [Networking overview with Private Link connectivity](https://learn.microsoft.com/en-us/azure/postgresql/network/concepts-networking-private-link)
- [TLS in Azure Database for PostgreSQL](https://learn.microsoft.com/en-us/azure/postgresql/security/security-tls)
- [Quickstart: create a Flexible Server instance](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/quickstart-create-server)
- [Backup and restore in Azure Database for PostgreSQL](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-backup-restore)
