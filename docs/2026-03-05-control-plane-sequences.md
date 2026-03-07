# Keon Control Plane Sequence Flows

**Date:** 2026-03-05  
**Status:** Draft  
**Depends On:** [2026-03-05-control-plane-monetization-rfc.md](D:/Repos/keon-omega/keon.control.website/docs/2026-03-05-control-plane-monetization-rfc.md), [2026-03-05-control-plane-schema-and-api.md](D:/Repos/keon-omega/keon.control.website/docs/2026-03-05-control-plane-schema-and-api.md)

---

## 1. Summary

This document describes the primary system flows required for Keon self-serve monetization:

1. Signup and tenant bootstrap
2. Paid plan checkout and subscription activation
3. Governed execution request handling
4. Usage ingestion and aggregation
5. End-of-period billing finalization
6. Public verification link generation

These are written as text sequence diagrams so engineering can identify ownership, state transitions, and failure behavior.

---

## 2. Actors

- User
- Dashboard
- Control API
- Auth Provider
- Stripe
- Provisioning Worker
- Gateway
- Runtime
- Metering Service
- Aggregation Worker
- Billing Worker
- Verification Service

---

## 3. Signup and Tenant Bootstrap

### 3.1 Happy Path

```text
User -> Dashboard: Sign up
Dashboard -> Auth Provider: Create user/session
Auth Provider -> Dashboard: Authenticated session

User -> Dashboard: Create tenant
Dashboard -> Control API: POST /v1/tenants
Control API -> Control DB: Insert tenant
Control API -> Control DB: Insert owner membership
Control API -> Dashboard: tenant_id

User -> Dashboard: Complete bootstrap
Dashboard -> Control API: POST /v1/bootstrap/complete
Control API -> Provisioning Worker: Bootstrap tenant job
Provisioning Worker -> Control DB: Create default project
Provisioning Worker -> Control DB: Create dev/prod environments
Provisioning Worker -> Control DB: Create API keys
Provisioning Worker -> Control DB: Create default entitlement projection
Provisioning Worker -> Control API: Bootstrap complete
Control API -> Dashboard: project, environments, first keys, quickstart
Dashboard -> User: Show curl and receipt walkthrough
```

### 3.2 Failure Rules

- If tenant creation succeeds but bootstrap fails, the tenant remains valid and bootstrap is retryable.
- API key secrets are only returned once after creation.
- Bootstrap must be idempotent for the same tenant.

---

## 4. Paid Checkout and Subscription Activation

### 4.1 Happy Path

```text
User -> Dashboard: Select Startup plan
Dashboard -> Control API: POST /v1/billing/checkout-session
Control API -> Stripe: Create checkout session with tenant metadata
Stripe -> Control API: Session created
Control API -> Dashboard: checkout_url
Dashboard -> User: Redirect to Stripe Checkout

User -> Stripe: Complete payment
Stripe -> Control API: webhook checkout.session.completed
Control API -> Control DB: Persist webhook receipt
Control API -> Control DB: Upsert subscription projection
Control API -> Control DB: Recalculate tenant entitlements
Control API -> Control DB: Mark webhook processed
Control API -> Dashboard: plan active on next fetch
```

### 4.2 Failure Rules

- Webhooks must be processed exactly once by Stripe event id.
- Runtime plan enforcement should not depend on the user returning from Stripe.
- Dashboard success pages are informational, not authoritative.

---

## 5. Governed Execution Request

### 5.1 Happy Path

```text
Client -> Gateway: POST /v1/execute with API key
Gateway -> Gateway Cache: Resolve key + entitlement projection
Gateway Cache -> Gateway: key valid, billing active, quota available
Gateway -> Rate Limiter: Check burst allowance
Rate Limiter -> Gateway: allowed
Gateway -> Runtime: Execute authorization request
Runtime -> Runtime Store: Persist receipt/evidence metadata
Runtime -> Gateway: terminal decision + execution_id + receipt_id
Gateway -> Metering Service: Emit usage event
Metering Service -> Usage Ledger: Append immutable event
Metering Service -> Gateway: accepted
Gateway -> Client: response with decision and receipt reference
```

### 5.2 Denied Request

```text
Client -> Gateway: POST /v1/execute
Gateway -> Runtime: authorize request
Runtime -> Gateway: DENIED + execution_id + receipt_id
Gateway -> Metering Service: Append denied usage event
Gateway -> Client: denied response
```

### 5.3 Non-Billable Rejection

```text
Client -> Gateway: POST /v1/execute with invalid key
Gateway -> Gateway Cache: key lookup fails
Gateway -> Client: 401 unauthorized
```

This does not create a governed execution and does not emit a billable usage event.

### 5.4 Failure Rules

- Unknown tenant state fails closed.
- If runtime returns a terminal decision but metering is temporarily unavailable, the system must preserve the event for retry.
- Usage loss is unacceptable once a terminal runtime decision has been returned.

Recommended approach:

- gateway writes to durable async queue or outbox before returning success

---

## 6. Usage Aggregation

### 6.1 Continuous Aggregation

```text
Metering Service -> Usage Ledger: New event appended
Aggregation Worker -> Usage Ledger: Read unprocessed events
Aggregation Worker -> Aggregate Store: Update billing-period aggregate
Aggregation Worker -> Aggregate Store: Update daily aggregate
Aggregation Worker -> Aggregate Store: Update environment aggregate
Aggregation Worker -> Usage Ledger: Mark offset/checkpoint advanced
```

### 6.2 Failure Rules

- Aggregates can be recomputed from the immutable ledger.
- Dashboard reads may briefly lag.
- Quota enforcement may use a conservative cached aggregate plus headroom buffer.

---

## 7. End-of-Period Billing Finalization

### 7.1 Happy Path

```text
Billing Worker -> Control DB: Find active paid subscriptions nearing period close
Billing Worker -> Aggregate Store: Read final billing-period usage
Billing Worker -> Stripe: Post metered usage or invoice items
Stripe -> Billing Worker: usage accepted
Billing Worker -> Control DB: Mark billing export checkpoint
Billing Worker -> Control DB: Lock billing period record
Stripe -> Control API: invoice.paid webhook
Control API -> Control DB: Persist webhook receipt
Control API -> Control DB: Confirm subscription remains active
Control API -> Control DB: Mark webhook processed
```

### 7.2 Payment Failure

```text
Stripe -> Control API: invoice.payment_failed webhook
Control API -> Control DB: Persist webhook receipt
Control API -> Control DB: Set subscription state = past_due
Control API -> Control DB: Recalculate tenant entitlements
Control API -> Gateway Cache: Invalidate tenant entitlement cache
```

Recommended behavior:

- do not immediately hard-stop on first payment failure
- apply a grace policy for paid tiers
- downgrade or suspend only after explicit grace rules expire

---

## 8. Public Verification Link Generation

### 8.1 Happy Path

```text
User -> Dashboard: Export public verification link for receipt
Dashboard -> Control API: POST /v1/tenants/{tenantId}/evidence-exports
Control API -> Control DB: Validate entitlement
Control API -> Control DB: Create export job
Control API -> User: queued

Provisioning Worker -> Control DB: Read queued export job
Provisioning Worker -> Receipt Store: Load receipt metadata
Provisioning Worker -> Verification Service: Generate signed public token
Provisioning Worker -> Control DB: Store token hash and status=ready
Dashboard -> Control API: GET export status
Control API -> Dashboard: ready + verification URL
User -> Verification Service: Open link
Verification Service -> Control DB: Validate token hash and status
Verification Service -> User: Public verification view
```

### 8.2 Failure Rules

- public tokens must be revocable
- public pages must not expose full payload data by default
- access logs for public verification pages should be retained

---

## 9. Cache Invalidation Flow

Runtime enforcement relies on fast entitlement caches. Cache invalidation needs a defined path.

```text
Control API -> Control DB: Update entitlement projection
Control API -> Cache Bus: Publish tenant entitlement changed event
Gateway Cache -> Cache Bus: Consume invalidation event
Gateway Cache -> Gateway Node: Evict local tenant cache entry
Next request -> Gateway: reload entitlement projection
```

Triggers:

- plan change
- suspension
- key revoke
- quota exhaustion
- grace-period transition

---

## 10. Operational Alerts

Alerts should exist for:

- webhook processing backlog
- usage ingestion failure rate
- aggregate lag beyond threshold
- gateway entitlement cache miss storm
- Stripe reconciliation mismatch
- repeated free-tier abuse by tenant or IP block

---

## 11. Recommended Next Step

Once these flows are accepted, engineering should produce:

1. service ownership map
2. queue/topic definitions
3. retry policy matrix
4. failure injection test plan
