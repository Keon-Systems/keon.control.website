# Keon Control Plane and Monetization RFC

**Date:** 2026-03-05  
**Status:** Draft  
**Audience:** Product, Platform, Billing, Gateway, Dashboard  
**Scope:** Self-serve SaaS monetization, tenant control plane, gateway enforcement, usage metering

---

## 1. Summary

Keon should monetize the unit it actually governs: the **governed execution**. The product shape is:

1. A shared, multi-tenant execution platform by default.
2. A universal control plane UI for all tenants.
3. Plan-based entitlements with usage-based overages.
4. Gateway-level enforcement for keys, quotas, and rate limits.
5. Immutable usage events as the billing ledger.

This RFC defines the minimum architecture required to make that work without coupling runtime correctness to Stripe or the dashboard.

---

## 2. Goals

- Support self-serve signup and plan selection.
- Provision tenants, projects, environments, and API keys automatically.
- Meter usage on billable governed executions.
- Enforce plan limits at the gateway with low latency.
- Keep Stripe as the billing processor, not the runtime source of truth.
- Give every tenant a dashboard that demonstrates governance value quickly.
- Preserve a path to enterprise isolation, compliance, and dedicated deployments.

## 3. Non-Goals

- Dedicated Azure tenancy per customer in MVP.
- Full ERP/revenue-recognition workflows.
- Complex marketplace billing or reseller billing.
- Per-token or per-model passthrough billing.
- Cross-region tenant mobility in MVP.

---

## 4. Product Model

### 4.1 Billable Unit

The billable unit is a **governed execution**.

Definition:

- A governed execution is one request that reaches Keon's authorization boundary and produces a terminal decision.
- Terminal decisions are `AUTHORIZED`, `DENIED`, or `FAILED_SYSTEM`.
- A governed execution may emit a receipt even if it is denied.

Rules:

- Count one unit per terminal authorization attempt.
- Retries with the same idempotency key do not create additional billable units.
- Requests rejected before authorization begins do not count as billable units.
  Examples: invalid API key, malformed request, plan suspended, payload too large.
- Batched requests are out of scope for MVP. One request maps to one governed execution.

Open decision:

- Whether denied executions are billable on all plans or only paid plans. My recommendation is:
  denied executions count toward quota, but only authorized executions are eligible for overage billing in MVP to reduce pricing friction.

### 4.2 Plans

Suggested initial plans:

| Plan | Monthly Price | Included Governed Executions | Overage | Burst Limit |
|---|---:|---:|---:|---:|
| Builder | $0 | 10,000 | none | 2 rps |
| Startup | $49 | 100,000 | $0.001 / execution | 10 rps |
| Growth | $299 | 1,000,000 | $0.0007 / execution | 50 rps |
| Enterprise | Contract | Negotiated | Negotiated | Negotiated |

Notes:

- The free tier should be generous enough for an actual proof-of-value loop.
- Retention and export limits should vary by plan even if core execution access is universal.
- Enterprise is not "everything unlimited"; it is contract-backed capacity plus infra and compliance controls.

### 4.3 Entitlements

Stripe plans are not runtime permissions. Runtime should enforce **entitlements** derived from plans.

Examples:

- `monthly_execution_limit`
- `burst_rps_limit`
- `projects_max`
- `api_keys_max`
- `receipt_retention_days`
- `evidence_export_enabled`
- `audit_timeline_enabled`
- `custom_policy_bundles_enabled`
- `sso_enabled`
- `private_networking_enabled`
- `dedicated_runtime_enabled`

---

## 5. Architecture

### 5.1 Planes

Keon should be explained and built as three planes:

- **Control Plane**
  Accounts, tenants, auth, roles, projects, environments, API keys, plans, entitlements, dashboard, provisioning.
- **Metering Plane**
  Usage event ingestion, aggregation, quota state, billing exports, invoicing support, anomaly detection.
- **Execution Plane**
  MCP gateway, runtime authorization, receipt generation, policy evaluation, evidence storage.

### 5.2 Source of Truth

Use explicit ownership boundaries:

- Stripe is the source of truth for payment collection and invoice state.
- Keon control data is the source of truth for tenant state, entitlements, API keys, and enforcement.
- Usage events are the source of truth for metered consumption.
- Aggregates are derived state for dashboard performance and quota checks.

### 5.3 Shared Infrastructure

Default deployment model:

```text
Keon Azure Tenant
├── Control API
├── Dashboard
├── Metering Workers
├── MCP Gateway
├── Runtime Services
├── Receipt / Evidence Storage
└── Shared Datastores
```

Tenant isolation is logical by default:

- `tenant_id` is required on all persisted control and usage records.
- `project_id` and `environment_id` should exist in MVP to support dev/staging/prod.
- Storage partitioning should include tenant and project where appropriate.

Enterprise options can add:

- dedicated resource group
- dedicated runtime cluster
- private endpoint
- customer-managed retention
- region pinning

---

## 6. Identity and Tenant Model

### 6.1 Core Entities

- `users`
- `tenants`
- `memberships`
- `projects`
- `environments`
- `service_accounts`
- `api_keys`
- `plans`
- `tenant_entitlements`
- `subscriptions`

### 6.2 Recommended Hierarchy

```text
User
  -> Membership
  -> Tenant / Organization
       -> Project
            -> Environment
                 -> API Keys
                 -> Usage
                 -> Receipts
```

Rationale:

- Most teams need more than one API key.
- Most teams need at least dev and prod separation.
- Putting all usage directly on the tenant makes future control and reporting harder.

### 6.3 Roles

Minimum roles:

- `owner`
- `admin`
- `developer`
- `billing`
- `viewer`

MVP auth options:

- Clerk or Auth0 for self-serve velocity.
- Azure Entra SSO reserved for Growth/Enterprise or Phase 2.

---

## 7. Provisioning Flow

### 7.1 Signup Flow

Target experience:

```text
Sign up
-> Create tenant
-> Choose plan
-> Complete checkout if paid
-> Create default project + default environment
-> Issue first API key
-> Show quickstart + first request
```

### 7.2 Provisioning API

Suggested internal endpoints:

- `POST /v1/tenants`
- `POST /v1/billing/checkout-session`
- `POST /v1/projects`
- `POST /v1/environments`
- `POST /v1/api-keys`
- `POST /v1/bootstrap/complete`

Avoid one giant provisioning endpoint as the long-term interface. Internally, a bootstrap workflow can orchestrate these steps.

### 7.3 Idempotency

The following operations must be idempotent:

- tenant creation
- subscription attach/update
- default project/environment creation
- initial API key issuance
- Stripe webhook processing
- usage export to Stripe

Use:

- request idempotency keys on external-facing POSTs
- persisted webhook event receipts
- unique constraints on business identifiers

---

## 8. API Keys and Service Identity

### 8.1 API Key Shape

Suggested format:

```text
keon_live_<prefix>_<secret>
keon_test_<prefix>_<secret>
```

Recommendations:

- Store only a salted hash of the secret.
- Persist a public key identifier/prefix for lookup.
- Show the full secret only once.
- Support rotation and revocation.
- Record `last_used_at`, `last_used_ip`, and `environment_id`.

### 8.2 Gateway Resolution

For each request:

1. Validate key format.
2. Resolve key by prefix.
3. Verify secret hash.
4. Load cached entitlement and environment state.
5. Attach `tenant_id`, `project_id`, and `environment_id`.
6. Enforce rate limits and quota.
7. Forward to execution plane.

### 8.3 Future Hardening

Phase 2+:

- IP allowlists
- scoped keys
- service accounts
- signed requests
- mTLS for enterprise

---

## 9. Gateway Enforcement

### 9.1 Enforcement Order

Recommended order:

1. Authentication
2. Tenant/project/environment resolution
3. Suspension and plan status checks
4. Burst rate limit
5. Payload and guardrail validation
6. Quota check
7. Authorization execution
8. Usage event write
9. Response

### 9.2 Limit Types

Three layers should exist from day one:

1. **Burst rate limit**
   requests per second per environment or key
2. **Monthly included quota**
   governed executions per billing cycle
3. **Hard guardrails**
   payload size, execution depth, tool calls, timeout ceilings

### 9.3 Enforcement Data Path

The gateway should not hit Stripe or the primary control database for every request.

Use:

- local or distributed cache for entitlements
- fast counters for burst limits
- near-real-time aggregate/quota state
- fallback-deny behavior when tenant state cannot be resolved safely

Fail-open is not acceptable for enforcement.

---

## 10. Metering and Billing

### 10.1 Usage Ledger

Every completed governed execution should emit an immutable usage event.

Suggested event shape:

```json
{
  "usage_event_id": "uuid",
  "tenant_id": "t_123",
  "project_id": "p_123",
  "environment_id": "env_prod",
  "execution_id": "exec_123",
  "idempotency_key": "ik_123",
  "decision": "AUTHORIZED",
  "endpoint": "/v1/execute",
  "units": 1,
  "occurred_at": "2026-03-05T17:00:00Z"
}
```

Properties:

- append-only
- immutable
- deduplicated by execution id and idempotency semantics
- sufficient to reconstruct invoices

### 10.2 Aggregation

Maintain derived aggregates for:

- current billing-period usage by tenant
- daily usage by project/environment
- dashboard summaries
- anomaly detection

Aggregation is not the billing ledger. It is acceleration state.

### 10.3 Stripe Integration

Recommended model:

- Subscription product and price live in Stripe.
- Keon stores `stripe_customer_id`, `stripe_subscription_id`, and billing state references.
- Overage is posted as metered usage or invoice items, depending on Stripe product setup.

Do not run billing off a once-a-month batch only.

Recommended flow:

1. Continuous usage ledger ingestion.
2. Daily reconciliation job validates aggregate consistency.
3. End-of-period invoice finalization posts any remaining usage and locks the period.

### 10.4 Billing State Machine

Tenant subscription states should be normalized internally:

- `trialing`
- `active`
- `past_due`
- `unpaid`
- `canceled`
- `suspended`

Runtime should enforce internal billing state, not raw Stripe status text.

---

## 11. Stripe Webhook Flows

### 11.1 Events to Support

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

### 11.2 Processing Rules

- Persist every webhook event receipt before side effects.
- Reject duplicate processing using Stripe event id uniqueness.
- Apply changes to an internal billing projection.
- Trigger entitlement recalculation after relevant events.

### 11.3 Entitlement Recalculation

Inputs:

- current plan
- add-ons
- trial state
- account flags
- suspension state

Output:

- single tenant entitlement record used by gateway and dashboard

---

## 12. Dashboard Requirements

### 12.1 Every Tenant Gets a Dashboard

The dashboard is part of the product, not an enterprise-only admin console.

Universal capabilities:

- usage overview
- recent executions
- receipt viewer
- API key management
- quickstart
- plan and billing summary

Plan-gated capabilities:

- policy configuration
- evidence export
- audit timeline
- multi-project teams
- custom policies
- SSO
- private networking

### 12.2 First-Run Experience

The north-star flow is:

```text
signup
-> copy API key
-> run curl
-> see governed decision
-> inspect receipt
```

Target: under 60 seconds.

### 12.3 Core Dashboard Views

- Home
- API Keys
- Projects and Environments
- Usage and Billing
- Executions
- Receipts
- Evidence Exports
- Settings

---

## 13. Public Verification Links

Public verification links are a strong distribution loop, but they require explicit privacy controls.

### 13.1 Requirements

- links must be signed and unguessable
- links must be revocable
- default public view must not expose raw payloads
- public view should focus on attestation:
  decision, time, receipt id, policy reference, verification status

### 13.2 Plan Fit

- Builder/Startup: manual share links
- Growth: branded verification pages
- Enterprise: private verification mode or custom domain

---

## 14. Data Model

Minimum tables or collections:

- `users`
- `tenants`
- `memberships`
- `projects`
- `environments`
- `plans`
- `subscriptions`
- `tenant_entitlements`
- `api_keys`
- `usage_events`
- `usage_aggregates`
- `receipts`
- `evidence_exports`
- `webhook_events`
- `rate_limit_buckets`
- `audit_events`

Critical indexes:

- unique on Stripe event id
- unique on API key prefix
- unique on tenant + external subscription id
- unique or dedupe index on usage event business key
- billing period aggregate indexes by tenant and environment

---

## 15. Security and Abuse Controls

Minimum controls for self-serve:

- verified email before live key issuance
- CAPTCHA or bot mitigation on signup
- disposable email filtering
- WAF and IP throttling on public endpoints
- account-level suspension flag
- environment-level key revocation
- anomaly detection for free-tier abuse

Free tier abuse will be immediate. Budget for operational controls in MVP.

---

## 16. MVP Scope

### 16.1 Include in MVP

- shared multi-tenant infrastructure
- self-serve signup
- Builder, Startup, Growth plans
- one default tenant, project, and environment per signup
- live/test API keys
- dashboard with quickstart, usage, recent executions, receipts
- gateway enforcement for auth, burst limits, and monthly quota
- immutable usage events
- Stripe checkout and subscription sync
- evidence/receipt viewer

### 16.2 Explicitly Defer

- enterprise dedicated deployments
- SAML/SSO
- private networking
- customer-managed keys
- advanced anomaly scoring
- branded verification domains
- multi-region failover
- granular key scopes
- reseller billing

---

## 17. Phase 2

Phase 2 should add:

- service accounts and scoped keys
- multi-project teams
- policy editing in dashboard
- evidence export workflows
- public verification links
- SSO and SCIM for enterprise
- contract usage commitments
- dedicated runtime options

---

## 18. Open Decisions

The following require explicit decisions before implementation starts:

1. Are denied executions billable, quota-only, or free?
2. Do free-tier tenants need a payment method to unlock higher monthly thresholds?
3. Is quota enforced at tenant level, environment level, or both?
4. What retention window is included per plan for receipts and evidence?
5. Will public verification links reveal policy version identifiers?
6. Which auth provider is the fastest path for MVP: Clerk, Auth0, or another provider already in use?
7. Will metered overage be Stripe metered billing or invoice items posted at period close?

---

## 19. Recommended Implementation Order

1. Define plan and entitlement schema.
2. Build tenant, project, environment, and API key models.
3. Implement gateway auth and enforcement cache.
4. Emit immutable usage events from the execution boundary.
5. Add aggregates and dashboard usage views.
6. Integrate Stripe checkout and webhook projection.
7. Add first-run quickstart and receipt viewer.
8. Add overage reconciliation and invoice finalization.

---

## 20. Recommendation

Keon should launch as a shared-infrastructure, self-serve governance platform where the **gateway is the billable edge**, the **usage event ledger is the monetization backbone**, and the **dashboard is the trust surface**.

The key design constraint is simple:

**runtime authorization must continue to function correctly even if Stripe, the dashboard, or the control UI is degraded.**

That means:

- entitlements must be projected into Keon-owned state
- usage must be captured as immutable events
- gateway enforcement must be low-latency and fail-closed

If those three rules hold, the monetization layer can scale without weakening the governance product.
