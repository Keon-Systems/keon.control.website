# Customer vs Operator App Split

Date: 2026-03-06

## Decision

Create separate web applications:

- `Keon Control Operator`: internal-only console for Keon owners/operators. Local repo: "D:\Repos\keon-omega\keon.control.website"
- `Keon Command Center`: customer-facing tenant application. Local repo: "D:\Repos\keon-omega\keon.command"

Do not ship a single application with deep RBAC-driven branching for both audiences.

## Why Separate Apps

Operator and customer workflows are fundamentally different:

- Operators need cross-tenant visibility, incident tooling, overrides, platform health, and support/debug workflows.
- Customers need confidence, clarity, trust signals, tenant administration, billing, and guided problem resolution.

Keeping both in one app would create:

- route-level RBAC sprawl
- component-level branching
- mixed navigation models
- harder security review
- more brittle testing
- weaker UX for both audiences

The right reuse boundary is shared packages, not a shared application shell.

## Target Topology

### App 1: Customer App

Name:

- `Keon Command`

Purpose:

- tenant-scoped operational visibility
- issue detection and guided remediation
- administrative self-service

Primary user roles:

- tenant admin
- security/compliance lead
- engineering manager
- operator within a customer org
- finance/admin for billing access

Core experience:

- The dashboard is the home and dominant working surface.
- Customers should rarely need to leave the dashboard except for administrative tasks.
- The dashboard should function as an operational cockpit, not a report index.

### App 2: Operator App

Name:

- `Keon Control`

Purpose:

- platform operations
- fleet-wide health
- support and troubleshooting across tenants
- internal override and investigation tools
- rollout, maintenance, and incident response

Primary user roles:

- keon operator
- keon owner
- support engineer
- site reliability / platform engineer

Core experience:

- multi-tenant by nature
- optimized for breadth, escalation, and control

## Customer App UX Direction

### Primary principle

The customer should be able to answer these questions from the dashboard without hunting:

- Is my tenant healthy?
- Is anything blocked or degraded right now?
- What changed recently?
- What needs my attention?
- What can I do next?

### Dashboard-first product model

The customer dashboard should contain:

- current trust score and trend
- subsystem health
- live activity
- open alerts and recommended actions
- pending decisions or blocked executions
- recent policy-impacting changes
- evidence/export status
- billing state summary
- AI assistant entry point

Every card should do one of three things:

- reassure
- explain
- direct action

### Navigation model

Top-level customer nav should stay tight:

- Dashboard
- Activity
- Policies
- Evidence
- Reports
- Admin

Where:

- `Dashboard` is the working home
- `Activity` covers receipts, executions, traces, alerts in one coherent timeline-oriented area
- `Policies` handles policy viewing/editing/approval
- `Evidence` handles packs, verification, exports
- `Reports` handles compliance, usage, retention, downloadable summaries
- `Admin` contains users, API keys, webhooks, billing, tenant settings

Avoid top-level sprawl like separate nav items for every backend entity.

## Customer Information Architecture

### Dashboard

Contains:

- trust vector
- subsystem health
- live activity feed
- active alerts
- pending decisions
- policy overrides
- quorum health
- last irreversible action
- usage snapshot
- billing status summary
- assistant panel

### Activity

Combines operational detail views:

- receipts
- executions
- traces
- alerts

This area should be timeline-first and correlation-friendly rather than four disconnected CRUD tables.

### Policies

Contains:

- active policies
- history
- drafts
- approvals
- templates
- editor

### Evidence

Contains:

- evidence packs
- manifests
- verification status
- exports
- trust bundles

### Reports

Contains:

- compliance summaries
- usage and quota
- latency/performance summaries
- retention reports
- scheduled export/report surfaces later

### Admin

Contains:

- members and roles
- SSO/SAML
- API keys
- webhooks
- billing
- tenant profile
- retention settings

This is where customers leave the dashboard for administrative tasks.

## Billing UX

Billing should be visible but not intrusive.

### On-dashboard

Show:

- current plan
- billing state
- usage vs included limits
- renewal date
- overage risk if applicable

### In Admin > Billing

Allow:

- view current plan
- view invoice history
- update payment method
- open Stripe customer portal
- review usage and projected overage
- request plan upgrade
- contact sales for enterprise changes

The goal is to remove uncertainty before it becomes a support ticket.

## AI Assistant

The customer app should include an AI assistant, but it must be tightly scoped.

### Assistant purpose

Help customers:

- understand alerts
- diagnose degraded health
- explain blocked or challenged decisions
- trace recent changes
- recommend next actions
- generate safe remediation steps
- prepare evidence/report bundles
- answer product-specific “how do I…” questions

### Assistant placement

Primary placement:

- docked panel or slide-over from the dashboard

Secondary placement:

- contextual invocation from alerts, executions, policies, and evidence details

Examples:

- `Explain why trust score dropped`
- `Summarize what changed in the last 2 hours`
- `Why was this execution blocked?`
- `Show me which policy caused this challenge`
- `Create a remediation checklist`
- `Prepare an evidence pack for this incident`

### Assistant boundaries

The assistant should not have unrestricted mutation powers.

Initial capabilities:

- read tenant-scoped operational state
- summarize
- explain
- propose fixes
- draft actions

Later gated capabilities:

- create draft policy changes
- prepare webhook or API key changes for review
- trigger evidence export
- open support/escalation workflows

Anything mutating should be:

- plan-gated
- role-gated
- explicit and reviewable
- backed by receipts where relevant

## Shared vs Separate Code

### Shared packages

Create shared packages for:

- design tokens
- primitives and UI kit
- typed API contracts
- generated API clients
- auth helpers
- telemetry utilities
- plan-gating helpers
- markdown/report rendering

### Separate per app

Keep these separate:

- route trees
- layouts and shells
- navigation
- page components
- role models
- analytics
- search/command systems
- assistant prompts and tools

Do not share app-level state containers unless the use case is truly identical.

## API Boundary

Both apps can talk to `keon-control-api`, but through clearly separated endpoint groups:

- customer endpoints: tenant-scoped by default
- operator endpoints: platform-wide and explicitly privileged

The API should enforce the boundary. The websites should reflect it, not create it.

## Suggested Repo Structure

Option A: monorepo apps

- `apps/keon-command-center`
- `apps/keon-control-operator`
- `packages/ui`
- `packages/tokens`
- `packages/api-contracts`
- `packages/api-client`
- `packages/auth`
- `packages/telemetry`

Option B: separate repos

- customer app repo
- operator app repo
- shared package repo or internal package registry

Recommendation:

- use a monorepo if the team is small and the release cadence is still tightly coupled
- split repos only when deploy cadence, access control, or ownership diverges materially

## Delivery Plan

### Phase 1

- Keep current repo as operator app
- Stand up a new customer app
- Reuse shared tokens and low-level components only
- Implement customer dashboard, activity, policies, evidence, admin shell

### Phase 2

- Move tenant-facing routes out of the current repo
- Keep internal-only routes in `Keon Control`
- Add billing and member administration
- Add assistant read-only troubleshooting mode

### Phase 3

- Add assistant action workflows with approval
- Add reports and scheduled exports
- Add richer onboarding and in-product guidance

## Non-Negotiables

- tenant-scoped by default in customer app
- no operator-only concepts in customer navigation
- dashboard-first UX
- admin tasks grouped under one area
- billing self-service available
- assistant is contextual, not gimmicky
- API enforces customer/operator boundary

## Bottom Line

Build two products:

- one for operating Keon
- one for operating on Keon

That distinction is the cleanest way to keep maintenance, security, and UX under control while making the customer-facing experience genuinely polished.
