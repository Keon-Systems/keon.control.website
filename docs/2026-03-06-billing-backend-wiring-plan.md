# Keon Control Billing Backend Wiring Plan

**Date:** 2026-03-06  
**Status:** Draft  
**Owner:** Platform Coordination / Billing Backend  
**Depends On:** [2026-03-05-control-plane-schema-and-api.md](D:/Repos/keon-omega/keon.control.website/docs/2026-03-05-control-plane-schema-and-api.md), [2026-03-05-control-plane-sequences.md](D:/Repos/keon-omega/keon.control.website/docs/2026-03-05-control-plane-sequences.md), [2026-03-06-customer-vs-operator-app-split.md](D:/Repos/keon-omega/keon.control.website/docs/2026-03-06-customer-vs-operator-app-split.md)

---

## 1. Objective

Wire the new `Admin > Subscription` control-plane UI to real backend billing flows so that:

- checkout starts from `control.keon.systems`
- billing portal starts from `control.keon.systems`
- Stripe remains the payment processor, not the runtime source of truth
- internal billing projection and tenant entitlements remain authoritative
- webhook-driven state changes reconcile deterministically back into the UI

This plan is intentionally limited to self-serve billing and the backend contracts needed by the newly-added customer control surfaces.

---

## 2. Deliverables

### 2.1 HTTP endpoints

Implement and document:

- `POST /v1/billing/checkout-session`
- `POST /v1/billing/portal-session`
- `POST /v1/webhooks/stripe`
- `GET /v1/billing/summary`
- `GET /v1/usage/summary`

### 2.2 Internal billing capabilities

Implement:

- Stripe customer creation and lookup model
- Stripe subscription mapping to internal subscription projection
- internal billing state normalization
- entitlement refresh pipeline after billing changes
- webhook idempotency and replay handling
- audit event emission for billing mutations and webhook-driven transitions

### 2.3 UI wiring

Replace placeholder buttons in:

- [src/app/admin/subscription/page.tsx](D:/Repos/keon-omega/keon.control.website/src/app/admin/subscription/page.tsx)

With real calls that:

- request checkout session URL
- request portal session URL
- redirect safely to Stripe
- refresh billing summary after return or webhook completion

---

## 3. Architecture Decisions

### 3.1 Authoritative state

- Stripe is authoritative for payment collection and invoice events.
- Keon is authoritative for tenant billing state, product entitlements, and runtime enforcement.
- Gateway and runtime must consume internal normalized billing state only.

### 3.2 Normalized billing states

Use a constrained internal state set:

- `trialing`
- `active`
- `past_due`
- `unpaid`
- `canceled`
- `suspended`

Stripe event text should be translated into one of these values in the billing projection layer.

### 3.3 Ownership boundaries

- Control API owns authenticated session validation and role checks.
- Billing service/module owns Stripe calls, projection updates, and reconciliation.
- Webhook processor owns signature verification, dedupe, replay safety, and projection triggers.
- Entitlement projection updater owns recalculating tenant limits after subscription change.

---

## 4. Endpoint Plan

### 4.1 `POST /v1/billing/checkout-session`

Purpose:

- create or reuse Stripe customer
- create checkout session for a requested paid plan or add-on
- attach tenant metadata needed for projection reconciliation

Request shape:

```json
{
  "tenant_id": "ten_123",
  "plan_code": "startup",
  "success_url": "https://control.keon.systems/billing/success",
  "cancel_url": "https://control.keon.systems/billing/cancel"
}
```

Validation:

- caller must belong to `tenant_id`
- caller role must be `owner`, `admin`, or `billing`
- `plan_code` must map to an enabled sellable plan
- plan transitions must follow supported rules

Response:

```json
{
  "checkout_url": "https://checkout.stripe.com/..."
}
```

### 4.2 `POST /v1/billing/portal-session`

Purpose:

- create Stripe billing portal session for invoice history and payment method updates

Request shape:

```json
{
  "tenant_id": "ten_123",
  "return_url": "https://control.keon.systems/admin/subscription"
}
```

Validation:

- same tenant membership and role checks as checkout
- tenant must already have a Stripe customer

Response:

```json
{
  "portal_url": "https://billing.stripe.com/..."
}
```

### 4.3 `POST /v1/webhooks/stripe`

Purpose:

- receive Stripe events
- persist raw event
- dedupe by Stripe event id
- project changes into internal subscription and entitlement state

Initial event set:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Processing rules:

- verify Stripe signature before parsing
- insert raw event into webhook event store before mutation
- ignore duplicate event ids safely
- emit audit events after successful state transition

### 4.4 `GET /v1/billing/summary`

Purpose:

- power `Admin > Subscription`
- return current plan, normalized state, billing period, included usage, current usage, and overage estimate

### 4.5 `GET /v1/usage/summary`

Purpose:

- return tenant usage aggregate for the active billing period
- keep UI reads separate from raw usage ledger writes

---

## 5. Data and Persistence Work

### 5.1 Schema tasks

Confirm or add:

- `stripe_customer_id` on tenant or billing account model
- `stripe_subscription_id` on internal subscriptions
- `stripe_price_id` and product mapping
- webhook event table with unique `(provider, external_event_id)`
- audit event rows for billing state changes

### 5.2 Plan mapping table

Define one canonical mapping from internal plan code to Stripe price identifiers:

- `builder`
- `startup`
- `growth`
- `enterprise`

Rules:

- mapping must be environment-aware
- no UI code should contain Stripe price ids
- unsupported plan ids fail closed

### 5.3 Projection update logic

On any accepted billing event:

1. upsert internal subscription projection
2. normalize billing state
3. compute billing period boundaries
4. refresh tenant entitlement projection
5. emit cache invalidation event
6. write audit event

---

## 6. UI Wiring Tasks

### 6.1 Subscription page actions

Update [src/app/admin/subscription/page.tsx](D:/Repos/keon-omega/keon.control.website/src/app/admin/subscription/page.tsx) so that:

- `Upgrade plan` calls `POST /v1/billing/checkout-session`
- `Open billing portal` calls `POST /v1/billing/portal-session`
- plan cards call checkout with the selected `plan_code`
- enterprise card routes to contact/sales instead of Stripe

### 6.2 Loading and failure behavior

Add:

- pending state during session creation
- user-safe error banner when session creation fails
- disabled actions for unauthorized roles
- refresh trigger after return from Stripe success/cancel pages

### 6.3 Success/cancel routes

Add control-plane pages for:

- `/billing/success`
- `/billing/cancel`

Rules:

- these pages must not assume payment succeeded until the billing summary reflects webhook-processed state
- success page should poll or refetch billing summary briefly
- cancel page should clearly return user to subscription management

---

## 7. Security and Role Enforcement

### 7.1 Role checks

Allowed mutation roles:

- `owner`
- `admin`
- `billing`

Read-only roles:

- `developer`
- `viewer`

### 7.2 Security requirements

- verify tenant membership server-side on every billing call
- never trust client-provided tenant or plan transitions without validation
- verify Stripe webhook signatures
- reject portal creation for tenants without Stripe customer linkage
- avoid leaking raw Stripe object ids in client-visible responses

---

## 8. Implementation Phases

### Phase 1: Contract and config

- finalize request/response contracts
- define plan-to-Stripe mapping config
- define success/cancel URLs for each environment

### Phase 2: Billing service primitives

- implement Stripe client wrapper
- implement customer lookup/create
- implement checkout session creator
- implement portal session creator

### Phase 3: Webhook ingestion

- create webhook endpoint
- add signature verification
- persist dedupe records
- process initial Stripe event set

### Phase 4: Projection and entitlements

- upsert subscription projection
- normalize internal billing state
- refresh entitlement projection
- publish cache invalidation

### Phase 5: Summary endpoints

- implement billing summary read model
- implement usage summary read model
- ensure subscription page can render entirely from backend responses

### Phase 6: UI wiring

- connect subscription buttons to session endpoints
- add success/cancel routes
- add pending/error states

### Phase 7: QA and replay testing

- verify checkout happy path
- verify checkout cancel path
- verify payment failure behavior
- verify webhook replay safety
- verify unauthorized-role behavior

---

## 9. Testing Matrix

### 9.1 Automated coverage

- unit tests for plan mapping and normalized billing state translation
- integration tests for checkout session creation
- integration tests for portal session creation
- webhook signature validation tests
- webhook idempotency tests
- entitlement refresh tests after plan change

### 9.2 End-to-end coverage

- free-tier tenant upgrades to Startup
- Startup tenant opens billing portal
- checkout canceled, no internal plan mutation
- webhook replay does not duplicate subscription updates
- invoice payment failure moves tenant to `past_due`
- unauthorized user cannot create checkout or portal session

---

## 10. Acceptance Criteria

- `Admin > Subscription` launches real checkout and portal flows from control
- billing summary reflects internal projection rather than raw Stripe payloads
- webhook replay is safe and deterministic
- entitlement projection updates after plan changes are auditable
- runtime enforcement can continue to rely on internal normalized billing state
- no billing mutation requires or depends on the marketing site

---

## 11. Immediate Next Tasks

1. Add a billing service module under the control-plane API layer with Stripe config and plan mapping.
2. Implement `POST /v1/billing/checkout-session` with tenant membership and role enforcement.
3. Implement `POST /v1/billing/portal-session` with existing Stripe customer lookup.
4. Implement `POST /v1/webhooks/stripe` with signature verification and event dedupe persistence.
5. Expose `GET /v1/billing/summary` and confirm it matches the subscription page data needs.
6. Replace placeholder button handlers in [src/app/admin/subscription/page.tsx](D:/Repos/keon-omega/keon.control.website/src/app/admin/subscription/page.tsx).
