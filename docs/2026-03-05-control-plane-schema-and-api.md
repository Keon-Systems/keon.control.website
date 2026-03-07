# Keon Control Plane Schema and API Contracts

**Date:** 2026-03-05  
**Status:** Draft  
**Depends On:** [2026-03-05-control-plane-monetization-rfc.md](D:/Repos/keon-omega/keon.control.website/docs/2026-03-05-control-plane-monetization-rfc.md)

---

## 1. Summary

This document defines the initial data model and HTTP contracts for the Keon control plane.

It is intentionally biased toward MVP:

- multi-tenant by default
- one organization-level tenant model
- projects and environments included from day one
- Stripe-backed subscriptions
- gateway-issued usage events

---

## 2. Conventions

### 2.1 IDs

Use opaque string IDs with stable prefixes:

- `usr_`
- `ten_`
- `mem_`
- `prj_`
- `env_`
- `sub_`
- `plan_`
- `ent_`
- `key_`
- `uev_`
- `uag_`
- `rcpt_`
- `exp_`
- `wh_`

### 2.2 Timestamps

All timestamps are UTC ISO-8601 strings.

### 2.3 Soft Deletes

Use `deleted_at` for user-facing resources where audit history matters:

- tenants
- projects
- environments
- api_keys

### 2.4 Auth

User-facing control plane endpoints require a session token.

Gateway-facing ingestion endpoints require service authentication, not end-user auth.

---

## 3. Core Schema

### 3.1 users

Purpose: identity records for human users.

| Column | Type | Notes |
|---|---|---|
| id | string PK | `usr_*` |
| auth_provider | string | `clerk`, `auth0`, `entra`, etc. |
| auth_subject | string | provider subject id |
| email | string | normalized lowercase |
| email_verified_at | timestamp nullable | |
| display_name | string nullable | |
| created_at | timestamp | |
| updated_at | timestamp | |

Constraints:

- unique `(auth_provider, auth_subject)`
- unique `email`

### 3.2 tenants

Purpose: organization/account boundary for billing and ownership.

| Column | Type | Notes |
|---|---|---|
| id | string PK | `ten_*` |
| name | string | |
| slug | string | unique display slug |
| status | string | `active`, `suspended`, `deleted` |
| current_plan_id | string FK nullable | points to `plans.id` |
| billing_email | string nullable | |
| stripe_customer_id | string nullable | |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp nullable | |

### 3.3 memberships

Purpose: user-to-tenant access.

| Column | Type | Notes |
|---|---|---|
| id | string PK | `mem_*` |
| tenant_id | string FK | |
| user_id | string FK | |
| role | string | `owner`, `admin`, `developer`, `billing`, `viewer` |
| created_at | timestamp | |
| updated_at | timestamp | |

Constraints:

- unique `(tenant_id, user_id)`

### 3.4 projects

Purpose: separate application surfaces within a tenant.

| Column | Type | Notes |
|---|---|---|
| id | string PK | `prj_*` |
| tenant_id | string FK | |
| name | string | |
| slug | string | unique per tenant |
| status | string | `active`, `archived`, `deleted` |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp nullable | |

Constraints:

- unique `(tenant_id, slug)`

### 3.5 environments

Purpose: execution isolation and key scoping inside a project.

| Column | Type | Notes |
|---|---|---|
| id | string PK | `env_*` |
| tenant_id | string FK | denormalized for faster filtering |
| project_id | string FK | |
| name | string | `Development`, `Production` |
| slug | string | `dev`, `prod`, etc. |
| kind | string | `development`, `staging`, `production`, `custom` |
| status | string | `active`, `suspended`, `deleted` |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp nullable | |

Constraints:

- unique `(project_id, slug)`

### 3.6 plans

Purpose: commercial plans and defaults.

| Column | Type | Notes |
|---|---|---|
| id | string PK | `plan_*` |
| code | string unique | `builder`, `startup`, `growth`, `enterprise` |
| name | string | |
| monthly_price_cents | integer nullable | nullable for negotiated plans |
| included_executions | bigint nullable | |
| overage_price_micros | integer nullable | price per unit in micros of USD |
| burst_rps_limit | integer nullable | |
| is_self_serve | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

### 3.7 tenant_entitlements

Purpose: runtime-ready entitlement projection.

| Column | Type | Notes |
|---|---|---|
| id | string PK | `ent_*` |
| tenant_id | string FK unique | |
| plan_id | string FK | |
| monthly_execution_limit | bigint nullable | |
| burst_rps_limit | integer nullable | |
| projects_max | integer nullable | |
| api_keys_max | integer nullable | |
| receipt_retention_days | integer nullable | |
| evidence_export_enabled | boolean | |
| audit_timeline_enabled | boolean | |
| policy_configuration_enabled | boolean | |
| sso_enabled | boolean | |
| dedicated_runtime_enabled | boolean | |
| billing_state | string | `trialing`, `active`, `past_due`, `unpaid`, `canceled`, `suspended` |
| effective_at | timestamp | |
| version | integer | increment on projection updates |
| created_at | timestamp | |
| updated_at | timestamp | |

### 3.8 subscriptions

Purpose: internal subscription projection.

| Column | Type | Notes |
|---|---|---|
| id | string PK | `sub_*` |
| tenant_id | string FK | |
| plan_id | string FK | |
| stripe_subscription_id | string unique nullable | |
| stripe_price_id | string nullable | |
| status | string | normalized internal state |
| billing_period_start | timestamp nullable | |
| billing_period_end | timestamp nullable | |
| cancel_at_period_end | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

### 3.9 api_keys

Purpose: gateway credentials.

| Column | Type | Notes |
|---|---|---|
| id | string PK | `key_*` |
| tenant_id | string FK | |
| project_id | string FK | |
| environment_id | string FK | |
| name | string | user-defined label |
| prefix | string unique | public lookup prefix |
| secret_hash | string | salted hash only |
| mode | string | `live`, `test` |
| status | string | `active`, `revoked` |
| last_used_at | timestamp nullable | |
| last_used_ip | string nullable | |
| created_by_user_id | string FK nullable | |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp nullable | |

### 3.10 usage_events

Purpose: immutable usage ledger.

| Column | Type | Notes |
|---|---|---|
| id | string PK | `uev_*` |
| tenant_id | string FK | |
| project_id | string FK | |
| environment_id | string FK | |
| api_key_id | string FK nullable | |
| execution_id | string | runtime execution id |
| receipt_id | string nullable | `rcpt_*` if produced |
| idempotency_key | string nullable | |
| endpoint | string | |
| decision | string | `AUTHORIZED`, `DENIED`, `FAILED_SYSTEM` |
| billable_units | integer | usually `1` |
| billable | boolean | |
| occurred_at | timestamp | |
| ingested_at | timestamp | |

Constraints:

- unique `(environment_id, execution_id)`

### 3.11 usage_aggregates

Purpose: derived counters for dashboards and quota checks.

| Column | Type | Notes |
|---|---|---|
| id | string PK | `uag_*` |
| tenant_id | string FK | |
| project_id | string FK nullable | |
| environment_id | string FK nullable | |
| window_type | string | `billing_period`, `day`, `hour` |
| window_start | timestamp | |
| window_end | timestamp | |
| authorized_count | bigint | |
| denied_count | bigint | |
| failed_system_count | bigint | |
| billable_units | bigint | |
| updated_at | timestamp | |

### 3.12 receipts

Purpose: dashboard retrieval and verification metadata.

| Column | Type | Notes |
|---|---|---|
| id | string PK | `rcpt_*` |
| tenant_id | string FK | |
| project_id | string FK | |
| environment_id | string FK | |
| execution_id | string unique | |
| decision | string | |
| policy_ref | string nullable | |
| verification_status | string | |
| storage_uri | string | immutable blob/object location |
| created_at | timestamp | |

### 3.13 evidence_exports

Purpose: track export jobs and shareable verification artifacts.

| Column | Type | Notes |
|---|---|---|
| id | string PK | `exp_*` |
| tenant_id | string FK | |
| project_id | string FK nullable | |
| environment_id | string FK nullable | |
| requested_by_user_id | string FK | |
| status | string | `queued`, `ready`, `failed`, `revoked` |
| export_type | string | `bundle`, `public_link` |
| storage_uri | string nullable | |
| public_token_hash | string nullable | for share links |
| expires_at | timestamp nullable | |
| created_at | timestamp | |
| updated_at | timestamp | |

### 3.14 webhook_events

Purpose: exactly-once webhook processing.

| Column | Type | Notes |
|---|---|---|
| id | string PK | `wh_*` |
| provider | string | `stripe` |
| external_event_id | string | Stripe event id |
| event_type | string | |
| payload_json | json/blob | |
| received_at | timestamp | |
| processed_at | timestamp nullable | |
| processing_status | string | `received`, `processed`, `failed` |
| error_message | string nullable | |

Constraints:

- unique `(provider, external_event_id)`

### 3.15 audit_events

Purpose: control-plane auditability.

| Column | Type | Notes |
|---|---|---|
| id | string PK | |
| tenant_id | string FK | |
| actor_type | string | `user`, `service`, `system` |
| actor_id | string nullable | |
| action | string | |
| target_type | string | |
| target_id | string | |
| metadata_json | json/blob | |
| occurred_at | timestamp | |

---

## 4. HTTP API Contracts

Base path:

```text
/v1
```

### 4.1 Create Tenant

`POST /v1/tenants`

Creates a new tenant and makes the caller the owner.

Request:

```json
{
  "name": "Acme AI",
  "slug": "acme-ai"
}
```

Response `201`:

```json
{
  "tenant": {
    "id": "ten_123",
    "name": "Acme AI",
    "slug": "acme-ai",
    "status": "active"
  }
}
```

### 4.2 Create Checkout Session

`POST /v1/billing/checkout-session`

Request:

```json
{
  "tenant_id": "ten_123",
  "plan_code": "startup",
  "success_url": "https://control.keon.systems/billing/success",
  "cancel_url": "https://control.keon.systems/billing/cancel"
}
```

Response `200`:

```json
{
  "checkout_url": "https://checkout.stripe.com/..."
}
```

### 4.3 Complete Bootstrap

`POST /v1/bootstrap/complete`

Purpose:

- create default project
- create default environments
- issue first API key
- return quickstart payload

Request:

```json
{
  "tenant_id": "ten_123",
  "project_name": "Default Project",
  "create_test_key": true,
  "create_live_key": true
}
```

Response `201`:

```json
{
  "project": {
    "id": "prj_123",
    "name": "Default Project"
  },
  "environments": [
    { "id": "env_dev", "slug": "dev", "mode": "test" },
    { "id": "env_prod", "slug": "prod", "mode": "live" }
  ],
  "api_keys": [
    {
      "id": "key_123",
      "mode": "test",
      "secret": "keon_test_abcd_..."
    },
    {
      "id": "key_456",
      "mode": "live",
      "secret": "keon_live_abcd_..."
    }
  ],
  "quickstart": {
    "endpoint": "https://mcp.keon.systems/v1/execute",
    "curl_example": "curl ..."
  }
}
```

### 4.4 List Tenant Overview

`GET /v1/tenants/{tenantId}/overview`

Response `200`:

```json
{
  "tenant": {
    "id": "ten_123",
    "name": "Acme AI",
    "plan_code": "startup"
  },
  "usage": {
    "billing_period_start": "2026-03-01T00:00:00Z",
    "billing_period_end": "2026-04-01T00:00:00Z",
    "authorized_count": 4231,
    "denied_count": 317,
    "billable_units": 4231,
    "included_units": 100000
  },
  "recent_executions": [
    {
      "execution_id": "exec_123",
      "decision": "AUTHORIZED",
      "receipt_id": "rcpt_123",
      "occurred_at": "2026-03-05T18:00:00Z"
    }
  ]
}
```

### 4.5 Create API Key

`POST /v1/projects/{projectId}/environments/{environmentId}/api-keys`

Request:

```json
{
  "name": "Production Gateway Key",
  "mode": "live"
}
```

Response `201`:

```json
{
  "api_key": {
    "id": "key_123",
    "name": "Production Gateway Key",
    "prefix": "keon_live_abcd",
    "mode": "live",
    "secret": "keon_live_abcd_..."
  }
}
```

### 4.6 Revoke API Key

`POST /v1/api-keys/{apiKeyId}/revoke`

Response `200`:

```json
{
  "api_key": {
    "id": "key_123",
    "status": "revoked"
  }
}
```

### 4.7 List Usage

`GET /v1/tenants/{tenantId}/usage?window=billing_period`

Response `200`:

```json
{
  "window_type": "billing_period",
  "window_start": "2026-03-01T00:00:00Z",
  "window_end": "2026-04-01T00:00:00Z",
  "authorized_count": 4231,
  "denied_count": 317,
  "failed_system_count": 4,
  "billable_units": 4231
}
```

### 4.8 List Receipts

`GET /v1/tenants/{tenantId}/receipts?project_id=prj_123&environment_id=env_prod`

Response `200`:

```json
{
  "items": [
    {
      "id": "rcpt_123",
      "execution_id": "exec_123",
      "decision": "AUTHORIZED",
      "policy_ref": "keon://policy/v4.1.2#L47",
      "verification_status": "verified",
      "created_at": "2026-03-05T18:00:00Z"
    }
  ],
  "next_cursor": null
}
```

### 4.9 Create Evidence Export

`POST /v1/tenants/{tenantId}/evidence-exports`

Request:

```json
{
  "receipt_ids": ["rcpt_123", "rcpt_456"],
  "export_type": "bundle"
}
```

Response `202`:

```json
{
  "export": {
    "id": "exp_123",
    "status": "queued"
  }
}
```

### 4.10 Gateway Usage Ingestion

`POST /v1/internal/usage-events`

Auth: service-to-service

Request:

```json
{
  "tenant_id": "ten_123",
  "project_id": "prj_123",
  "environment_id": "env_prod",
  "api_key_id": "key_123",
  "execution_id": "exec_123",
  "receipt_id": "rcpt_123",
  "idempotency_key": "ik_123",
  "endpoint": "/v1/execute",
  "decision": "AUTHORIZED",
  "billable_units": 1,
  "billable": true,
  "occurred_at": "2026-03-05T18:00:00Z"
}
```

Response `202`:

```json
{
  "accepted": true,
  "usage_event_id": "uev_123"
}
```

---

## 5. Gateway Runtime Decision Cache

The gateway should resolve a compact entitlement object from cache.

Suggested cached object:

```json
{
  "tenant_id": "ten_123",
  "project_id": "prj_123",
  "environment_id": "env_prod",
  "api_key_id": "key_123",
  "key_status": "active",
  "billing_state": "active",
  "burst_rps_limit": 10,
  "monthly_execution_limit": 100000,
  "current_billing_period_usage": 4231,
  "policy_configuration_enabled": true,
  "version": 12
}
```

Behavior:

- cache miss should trigger a single control-plane lookup
- suspended or unknown state should fail closed
- aggregate usage can be slightly stale, but never by enough to materially exceed quota

---

## 6. Error Contract

Suggested error shape:

```json
{
  "error": {
    "code": "quota_exceeded",
    "message": "Monthly governed execution quota exceeded.",
    "request_id": "req_123"
  }
}
```

Recommended error codes:

- `unauthorized`
- `forbidden`
- `invalid_request`
- `tenant_suspended`
- `quota_exceeded`
- `rate_limited`
- `billing_state_invalid`
- `not_found`
- `conflict`
- `internal_error`

---

## 7. Operational Notes

- Start with a relational control-plane database.
- Keep usage events append-only.
- Use background workers for aggregate updates and export jobs.
- Do not expose Stripe object ids as primary public identifiers.
- Emit audit events for tenant creation, key issuance, key revocation, plan changes, and evidence exports.

---

## 8. Recommended Next Step

Once the schema and contracts are accepted, the next artifact should be:

- a migration plan
- endpoint ownership by service
- a backlog split into auth, billing, gateway, dashboard, and metering workstreams
