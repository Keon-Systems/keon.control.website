# Tenant Command Center Implementation Plan

Date: 2026-03-05

## Recommendation

Do not turn the existing internal `Keon.Control` shell directly into the long-term customer SaaS surface.

Use a split-surface model:

- `Keon.Control` remains the operator console for platform-wide monitoring, incident response, and platform administration.
- A separate customer-facing app or route group becomes the Tenant Command Center and only exposes tenant-scoped data, plan-gated actions, and customer-safe navigation.

Short-term optimization:

- Reuse the current website repo, design system, and API client foundation.
- Introduce a tenant-scoped control-plane contract now.
- Keep operator-only pages hidden behind explicit operator role checks.
- Move to a separate website repo only if branding, auth, release cadence, or shell divergence becomes material.

This sequence avoids a second greenfield build while preventing the internal operator shell from becoming the permanent public IA.

## Current State Review

### Website

- The dashboard at `src/app/page.tsx` is still mock-driven.
- The top bar assumes an internal operator persona and does not show tenant or plan.
- API wrappers target mixed legacy admin endpoints such as `/runtime/executions` and `/governance/receipts`.
- Several clients are explicitly stubbed (`tenants`, `alerts`).
- Realtime polling hooks already exist and can support dashboard live updates with minimal new plumbing.

### API

- `Keon.Control.API` already contains a `ControlPlane` area under `/v1`, but it is monetization/bootstrap oriented.
- Responses are not using the required standard envelope.
- Tenant scoping is caller-supplied instead of auth-resolved.
- The requested dashboard/customer endpoints do not exist yet.
- The in-memory store is a workable seed layer for contract-first delivery and UI wiring.

## Delivery Strategy

### Agent 1: API Contracts

- Introduce a standard response envelope for success and error responses.
- Add tenant identity endpoints: `GET /v1/me`, `GET /v1/tenant`, `GET /v1/plans`.
- Normalize plan identifiers to the requested customer-facing plan set: `free`, `startup`, `growth`, `enterprise`.
- Add tenant-safe dashboard endpoints:
  - `GET /v1/dashboard/scorecard`
  - `GET /v1/dashboard/summary`
  - `GET /v1/dashboard/health`
  - `GET /v1/dashboard/trust-vector`
  - `GET /v1/dashboard/activity`
  - `GET /v1/dashboard/last-irreversible`
- Return `meta.request_id`, `meta.tenant_id`, `meta.plan_id`, and cursor where applicable.
- Add rate-limit headers centrally, even if values are static or mocked in phase 1.

### Agent 2: Data Model Alignment

- Reshape store records toward the authoritative tenant entities:
  - `Tenant`
  - `Subscription`
  - `ApiKey`
  - `Execution`
  - `Receipt`
  - `SpineEvent`
  - `EvidencePack`
  - `Policy`
  - `Alert`
  - `UsageCounter`
  - `TrustVector`
- Keep storage DB-agnostic.
- Maintain seed/sample data so the UI can be fully wired before persistence is finalized.
- Treat `tenant_id` as required on every entity and resolve it from auth context in the endpoint layer.

### Agent 3: Website Integration

- Add typed support for the standard API envelope.
- Add a tenant context/provider that loads `/v1/me`.
- Update the top bar to display `Tenant: <name>` and `Plan: <plan>`.
- Preserve operator mode as a separate role-gated path or shell affordance.
- Rewire the dashboard to the new scorecard/summary endpoints.
- Use the existing polling/realtime hooks for live refresh until SSE is finalized.

### Agent 4: Page Migration

- Migrate pages in this order:
  1. Dashboard
  2. Receipts
  3. Executions
  4. Traces
  5. Evidence
  6. Policies
  7. Alerts
  8. Settings
  9. Tenants
- Each page reads only tenant-scoped endpoints.
- Each page renders locked states for plan-gated actions rather than hiding discoverability entirely.

### Agent 5: Auth, Roles, and Gating

- Resolve `tenant_id`, `plan_id`, and `roles` from JWT or API key.
- Add a thin auth context abstraction now, even if backed by sample headers in local development.
- Gate operator mode on `role=operator`.
- Gate feature actions by plan:
  - `free`: read-only dashboard, executions, receipts, short retention
  - `startup`: evidence export, policy view, template policies
  - `growth`: policy editing, alerts, webhooks, longer retention
  - `enterprise`: SSO/SAML, private networking, dedicated runtime, multi-tenant org features, advanced exports

## Execution Order

Phase 1: Shared contract foundation

- Standard response envelope
- Tenant identity endpoints
- Dashboard scorecard and summary endpoints
- Website tenant header wiring

Phase 2: Tenant-safe navigation and data pages

- Receipts, executions, traces, evidence lists and detail routes
- Locked-state components for gated actions

Phase 3: Authoring and lifecycle workflows

- Policy editing
- Alerts ack/close
- API key rotate/revoke
- Billing portal

Phase 4: Live transport and org features

- SSE or WebSocket stream
- Enterprise tenant switching
- Operator shell separation hardening

## Accuracy Review

### Confirmed good assumptions

- The website already has a reusable HUD and polling layer, so a full dashboard rewrite is unnecessary.
- The API store is currently in-memory and can safely serve as a phase-1 control-plane backing store.
- A scorecard endpoint is the correct optimization because the current dashboard otherwise requires several network round trips.

### Corrections to avoid drift

- The existing API plan name `builder` does not match the requested customer plan taxonomy and should not leak into the UI contract.
- The current `/v1/me/tenants` shape is not a substitute for `GET /v1/me`.
- The current website route structure is still operator-centric; exposing it directly to customers without a tenant-safe shell would mix internal and customer concerns.
- Auth-resolved tenant scoping must happen in the API contract even if local development initially emulates auth with headers.

## Optimization Review

- Implement `GET /v1/dashboard/scorecard` immediately; it will populate most of the dashboard with one request.
- Keep dashboard auxiliary endpoints for composability and future page-level refresh granularity.
- Add a single typed envelope parser in the website client instead of teaching every feature client its own response shape.
- Use a tenant context hydrated from `/v1/me` so header, gating, and page clients share the same identity data.
- Avoid SSE in the first slice if it delays delivery; the existing polling hook already gives acceptable live refresh behavior for local and staging use.

## Immediate Implementation Slice

The first execution slice should deliver:

- API envelope support
- `GET /v1/me`
- `GET /v1/tenant`
- `GET /v1/plans`
- `GET /v1/dashboard/scorecard`
- `GET /v1/dashboard/summary`
- `GET /v1/dashboard/health`
- `GET /v1/dashboard/trust-vector`
- `GET /v1/dashboard/activity`
- `GET /v1/dashboard/last-irreversible`
- Website tenant/plan header wiring
- Dashboard data wiring to the new endpoints

That gives a tenant-safe foundation with visible product movement while preserving room for the larger page migration.
