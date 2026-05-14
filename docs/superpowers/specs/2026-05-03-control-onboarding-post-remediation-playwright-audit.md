# Keon Control Onboarding Post-Remediation Playwright Audit

## Executive Summary

- Overall verdict: Needs fixes before PR.
- End-to-end flow verdict: Activation through ready state works in a clean Playwright context when the local app is correctly served. The remediation branch does route Step 3 to the lifecycle preview interlude, keeps the setup rail at 4 required steps, and routes the ready CTA to `/integrations`.
- Provisioning reality verdict: Provisioning is simulated. Activation validates an env-backed token, creates an in-process provisioning session, stores activation/onboarding flags in browser storage, and binds the browser to an existing/test or env-described workspace context. No durable tenant/workspace is created by the inspected app code.
- Highest-risk remaining issue: The activation/provisioning UI says "Workspace created" and "Workspace prepared" even though the route comments and implementation show simulation/local binding, not durable backend provisioning.
- Recommended next action: Clarify the provisioning architecture before PR, then either wire real tenant/workspace provisioning or change the activation/onboarding language to "access verified / workspace binding prepared" for non-real provisioning modes.

## Browser Walkthrough Results

| Step | Route | Expected | Actual | Status | Screenshot | Notes |
|---|---|---|---|---|---|---|
| Activation | `/activate?token=internal-test-token` | Fresh user activates successfully | POST `/api/activation/provision` returned 201 with `mode: test`, `tenantId: ten_keon_internal_test`; polling progressed to `provisioning_complete` | PASS with caveat | `test-results/onboarding-remediation-audit/01-activation.png` | API labels include `tenant_creating`, `Workspace created`, and `provisioning_complete`, but code shows simulated progression. |
| Welcome | `/welcome` | User lands on Welcome | Welcome page loaded with "0/4 required steps complete" and above-fold setup CTA | PASS | `test-results/onboarding-remediation-audit/02-welcome.png` | LocalStorage after activation had provisioning complete plus activation session. |
| Goals | `/setup?step=goals` | Step 1 goal selection works | Selected "Govern AI actions"; continued to access | PASS | `test-results/onboarding-remediation-audit/03-goals.png` | Required rail still counts 4 steps. |
| Access | `/setup?step=access` | Step 2 resolves deterministically | Internal test mode showed sandbox workspace and disabled production | PASS with caveat | `test-results/onboarding-remediation-audit/04-access.png` | Screen honestly says internal test mode is not a real provisioning run. |
| Integration | `/setup?step=integration` | Step 3 operating model selection works | BYO AI selection advanced only after selecting a model | PASS | `test-results/onboarding-remediation-audit/05-integration.png` | Rail shows 2/4 required steps complete. |
| Lifecycle preview | `/setup?step=lifecycle-preview` | Required interlude appears before guardrails | Lifecycle page loaded with "Every governed action follows the same lifecycle" | PASS | `test-results/onboarding-remediation-audit/06-lifecycle-preview.png` | Required rail still shows 3/4, not 4/5 or 5 steps. |
| Guardrails | `/setup?step=guardrails` | Continue routes to guardrails | Guardrails page loaded; selected Balanced | PASS | `test-results/onboarding-remediation-audit/07-guardrails.png` | CTA label is "Review workspace", not "Review ready state". |
| Ready | `/setup?step=ready` | Ready summary shows workspace, goal, model, guardrails | Summary showed Keon Internal Test Workspace, Governance Runtime, BYO AI, Balanced | PASS with caveat | `test-results/onboarding-remediation-audit/08-ready.png` | Heading is "Workspace prepared."; still a local setup state, not proven server provisioning. |
| Integrations | `/integrations` | Ready CTA routes to integrations | "Connect your first integration" routed to `/integrations` | PASS | `test-results/onboarding-remediation-audit/09-integrations.png` | Shows sandbox preview plan and billing state in test mode. |
| Natural post-setup hard navigation | `/receipts`, `/collective`, `/cortex`, `/control`, `/settings`, `/api-keys` | Post-setup app navigation remains available | Natural hard navigations redirected to `/activate` in the audit run for most app routes | FAIL | `test-results/onboarding-remediation-audit/post-_receipts.png` etc. | The ready-state click reaches `/integrations`; direct route reloads need completion state to be durable. Seeded pass below proves screens render when local state is complete. |

## Provisioning Trace

| Area | File/function | Client/server | Reads/creates/confirms | Durable? | Finding |
|---|---|---|---|---|---|
| Activation page | `src/app/activate/page.tsx` / `ActivationGate` | Client page shell | Renders activation flow behind first-run gate | Local browser only | Comments describe real future provisioning, but this page delegates all behavior to `ActivationFlow`. |
| Activation orchestrator | `src/components/activation/ActivationFlow.tsx` / `startProvisioning`, `pollProvisioningStatus` | Client | POSTs token, polls provisioning ID, writes activation session and provisioning-complete flag | Browser local/session storage | On completion, writes `keon.activation.provisioning-complete=true` and redirects to `/welcome`; no tenant creation call exists here. |
| Provision API | `src/app/api/activation/provision/route.ts` / `POST` | Server | Validates env-backed test/invite tokens; creates `prov_*` in module-level `Map` | In-process only | No database call, no tenant insert, no workspace insert. Comments explicitly say replace with Redis/Postgres later. |
| Provision polling | `src/app/api/activation/provision/route.ts` / `GET` | Server | Reads provisioning session from `Map`; derives simulated state | In-process only | Returns states like `tenant_creating` and `workspace_bootstrapping` from elapsed time via `resolveSimulatedState`. |
| Simulated state | `src/lib/activation/state-machine.ts` / `resolveSimulatedState` | Shared | Maps elapsed milliseconds to provisioning states | No | "Workspace created" is a UI checklist label derived from simulated internal states. |
| Test activation context | `src/lib/activation/test-mode.ts` | Shared | Defines `INTERNAL_TEST_TENANT_ID`, workspace name, test `me`, usage summary | Static mock/test constants | Internal test token binds to pre-seeded constant `ten_keon_internal_test`. |
| Invite activation context | `buildInviteActivationContext` in provision route | Server | Reads `KEON_INVITE_*` env vars | No | A valid invite token can return no tenant/workspace IDs if env vars are empty. Browser API evidence showed 201 with only `mode`, `source`, `environment`, `uiLabel`. |
| Activation session persistence | `src/lib/activation/session.ts` | Client | Stores `keon.activation.session` in localStorage | Browser localStorage | Local state drives later test-mode UI and tenant binding behavior. |
| Tenant binding | `src/lib/control-plane/tenant-binding.tsx` / `useTenantBinding`, `confirmBinding` | Client | Reads `/v1/me/tenants` unless test mode; writes selected/confirmed tenant and environment to localStorage | Browser localStorage | `confirmBinding()` confirms selected tenant in browser state only. Test mode bypasses live tenant list with `INTERNAL_TEST_TENANT`. |
| Tenant context | `src/lib/control-plane/tenant-context.tsx` | Client | Reads `/v1/me`; test mode returns `INTERNAL_TEST_ME` | Static/test or remote API | No server-side binding happens in the provider. |
| Step 2 access | `src/components/onboarding/steps/scope-confirmation-step.tsx` / `confirmAccess` | Client | Calls `confirmBinding()` then onboarding `confirmAccess(selectedTenant.id)` | Browser localStorage | Step 2 confirms existing access or sandbox fallback; it does not create workspace access. |
| Local onboarding store | `src/lib/onboarding/store.tsx` | Client | Rehydrates/writes `keon.onboarding.state` | Browser localStorage | Goals, workspace ID, integration mode, lifecycle seen, guardrails, and completion are browser-local. |
| Onboarding state machine | `src/lib/onboarding/state-machine.ts` | Shared | Advances through goals, access, integration, lifecycle, guardrails, ready | Local reducer | `ADVANCE_INTEGRATION` now routes to lifecycle preview; `COMPLETE` sets `completed: true`. |
| Routing/readiness | `src/lib/first-run/state.tsx` and `src/lib/onboarding/experience.ts` | Client | Derives first-run stage and next route from localStorage-backed state | Browser localStorage | App access depends on `keon.activation.provisioning-complete` and `keon.onboarding.state.completed`. |
| Ready CTA | `src/components/onboarding/steps/complete-step.tsx` | Client | Calls `finishOnboarding()` and `router.replace("/integrations")` | Browser localStorage after effect | Natural audit reached `/integrations`, but hard-navigation evidence showed state durability is fragile enough to fall back to activation if completion is not present. |

## State Persistence Findings

Browser-local state observed after activation:

- `keon.activation.session`: activation context with test mode and `ten_keon_internal_test`.
- `keon.activation.provisioning-complete`: `"true"`.
- `keon.onboarding.state`: current step `WELCOME`, no selected goals, no workspace, no integration, no guardrails.
- `keon.selected-tenant-id`, `keon.confirmed-tenant-id`: `ten_keon_internal_test`.
- `keon.selected-environment`, `keon.confirmed-environment`: `sandbox`.

Browser-local state observed at ready before clicking integrations:

- `keon.onboarding.state.currentStep`: `READY`.
- `selectedGoals`: `["govern-ai-actions"]`.
- `workspaceId`: `ten_keon_internal_test`.
- `selectedIntegrationMode`: `BYO_AI`.
- `lifecyclePreviewSeen`: `true`.
- `guardrailPreset`: `balanced`.
- `completed`: `false` at the moment the ready screenshot was captured; `finishOnboarding()` is only called by the ready CTA.

Server/API state observed:

- `/api/activation/provision` creates an in-memory `prov_*` record in a module-level `Map`.
- Direct API evidence:
  - Internal test token returned 200/201 with static test tenant/workspace context.
  - Env invite token with no attached workspace IDs returned 201 and an activation object with no tenant/workspace IDs.
  - Invalid token returned 401.
- No inspected route writes tenant, workspace, membership, guardrail, billing, API key, or onboarding state to a database.

Plain answers:

- Does activation create a tenant/workspace? No. It creates an in-process provisioning session and returns either static test context or env invite context.
- Does activation only bind the browser session to an existing tenant/workspace? Yes for test mode and env-configured invite mode. In the no-workspace invite case, it binds to no tenant/workspace at all.
- Does Step 2 create workspace access? No.
- Does Step 2 only confirm existing access? Yes. It confirms a tenant returned by tenant lookup, the internal test tenant, or the sandbox fallback path in local state.
- Does "Workspace prepared" mean actual provisioning completed? No. It means local onboarding choices are complete enough to proceed; real backend provisioning was not proven and is not implemented in the traced route.
- Required backend/API calls for real provisioning: signed invite validation, durable provisioning record, tenant/workspace creation or lookup, membership binding, governance baseline/guardrail persistence, activation session/auth binding, and server-side onboarding completion.
- What breaks if localStorage is cleared after activation? The app loses activation session, provisioning-complete, tenant binding, environment binding, and onboarding progress; app routes gate back to `/activate` with token missing.
- Valid invite token with no attached workspace: API accepts it and returns no tenant/workspace IDs. Step 2 would depend on tenant lookup; if none are available it shows "No workspace is prepared..." and offers sandbox fallback.
- External sandbox invite vs internal test token: internal test token uses static `INTERNAL_TEST_*` constants and labels test mode; sandbox invite uses env token validation and optional env tenant/workspace metadata.

## Post-Selection Screen Audit

Natural post-setup route pass: `/integrations` loaded from the ready CTA, but hard-navigation checks to most other app routes redirected to `/activate` in the captured audit. A second seeded pass set the completed local state explicitly to inspect screen content.

| Route | Loads? | Data state | Honest labeling? | Selected workspace reflected? | Next action clear? | Issues |
|---|---|---|---|---|---|---|
| `/integrations` | Yes | Sandbox/test preview, no API keys | Mostly yes: `Sandbox Preview`, `Included during preview` | Yes | Yes: manage API keys, review guardrails, review receipts | Live API calls target `http://localhost:3000/v1/...` and fail CORS in local audit. |
| `/receipts` | Yes in seeded pass | Sample receipts | Yes: "sample data for preview purposes" and sample outcome labels | Shell shows selected workspace | Yes: inspect/view cases | It is a sample proof moment, not first live proof from this workspace. |
| `/collective` | Yes in seeded pass | Review endpoints unavailable; sample/projection caveat present | Partial | Shell shows selected workspace | Partial | Hero restored as "Collaborative review", but endpoint 503s make the primary state unavailable. |
| `/cortex` | Yes in seeded pass | Static/product capability page | Mostly yes; says requires API integration and workspace configuration | Shell shows selected workspace | Yes: go to integrations | Exists under Platform. Claims are conceptual, not live tenant state. |
| `/workspace` | No | 404 | N/A | No | No | Sidebar calls this "Workspace" but route is missing; `/control` is the real operational overview. |
| `/control` | Yes in seeded pass | Empty/no activity state | Yes | Shell shows selected workspace | Yes: open integrations | Good empty state: no activity, no receipts, no integration signal. |
| `/guardrails` | No | 404 | N/A | No | No | Sidebar links to missing route. Setup guardrails are only at `/setup?step=guardrails`. |
| `/diagnostics` | No | 404 | N/A | No | No | Sidebar links to missing route. |
| `/settings` | Yes in seeded pass | Local/test settings with billing unavailable | Mostly yes | Yes | Partial | Billing fetch fails; state displays `unavailable` rather than hanging. |
| `/api-keys` | Yes in seeded pass | Empty keys list | Mostly yes | Yes | Partial | Credential API fetch fails CORS; UI shows zero keys without an explicit API-unavailable warning. |

## Findings

| Screen/Area | Lens | Severity | Evidence | Observation | Why it matters | Likely source | Proposed fix | Effort |
|---|---|---|---|---|---|---|---|---|
| Activation provisioning | Provisioning truth | CRITICAL | `src/app/api/activation/provision/route.ts`; `audit-events.json` API responses; `01-activation.png` | UI/API says "Workspace created" and reaches `tenant_creating`/`workspace_bootstrapping`, but implementation only validates env tokens and simulates state in memory. | First-run trust breaks if users believe durable workspace provisioning happened when it did not. | Simulated activation route plus production-intent copy/checklist labels. | Either wire durable provisioning or rename labels to access/session binding until real provisioning exists. | M |
| Invite activation | Missing workspace handling | CRITICAL | Direct API check in `audit-events.json`: env invite token returned 201 without tenant/workspace IDs | Valid invite token can be accepted without attached workspace metadata. | A real external invite could reach onboarding with no prepared workspace, forcing fallback ambiguity. | `buildInviteActivationContext()` accepts optional env values. | Fail closed for invite tokens missing tenant/workspace IDs unless explicitly marked sandbox fallback. | S |
| Post-setup route durability | First-run navigation | MAJOR | Natural post-route screenshots `post-_receipts.png`, `post-_collective.png`, etc. | After reaching `/integrations`, hard navigation to several app routes redirected to `/activate` in the natural audit. | A user refresh/deep link after setup may look deactivated or broken. | LocalStorage-driven first-run gate and completion timing around `finishOnboarding()`. | Persist completion before route replace and add regression coverage for hard reload to `/receipts`, `/control`, `/cortex`, `/settings`, `/api-keys`. | M |
| Sidebar app routes | Navigation integrity | MAJOR | Seeded screenshots `seeded-_workspace.png`, `seeded-_guardrails.png`, `seeded-_diagnostics.png` | `/workspace`, `/guardrails`, and `/diagnostics` are linked in shell but 404. | First-run navigation offers routes that do not exist. | Sidebar/nav routes ahead of implemented pages. | Point Workspace to `/control`; add or remove Guardrails/Diagnostics routes until implemented. | S |
| API base configuration | Local API correctness | MAJOR | Console/network failures in both JSON evidence files | Client calls `http://localhost:3000/v1/...` from `127.0.0.1:3100`, causing CORS failures. | Screen state depends on failed remote calls while user sees local test mode. | `src/lib/api/config.ts` default base URL and env. | Use same-origin `/api/control` or set correct local API origin for this app during audit/dev. | S |
| `/api-keys` | Error honesty | MAJOR | `seeded-_api-keys.png`; `post-screens-seeded.json` | API keys fetch fails, but UI shows `Keys in scope: 0` without an unavailable/fetch-failed state. | "Zero keys" and "could not load keys" mean different operator states. | `src/app/api-keys/page.tsx` catches by setting empty list. | Track load/error state and show unavailable when credential API fails. | S |
| `/integrations` | Error honesty | MINOR | `seeded-_integrations.png`; CORS failures | Billing/API key calls fail but test mode fallback shows Sandbox Preview and 0 keys. | Fallback is useful, but it can hide failed live API access. | `src/app/integrations/page.tsx` catch fallback. | Add explicit "live API unavailable; showing preview context" notice in non-production/test mode. | S |
| `/collective` | First-run destination | MINOR | `seeded-_collective.png` | Restored hero appears, but primary state is review workspace unavailable due 503 endpoints. | It is honest enough, but not yet a useful first next action beyond the unavailable state. | Collective APIs unavailable in local standalone. | Keep unavailable state, add clear next action or dependency note. | S |

## Screenshots

- `test-results/onboarding-remediation-audit/01-activation.png`
- `test-results/onboarding-remediation-audit/02-welcome.png`
- `test-results/onboarding-remediation-audit/03-goals.png`
- `test-results/onboarding-remediation-audit/04-access.png`
- `test-results/onboarding-remediation-audit/05-integration.png`
- `test-results/onboarding-remediation-audit/06-lifecycle-preview.png`
- `test-results/onboarding-remediation-audit/07-guardrails.png`
- `test-results/onboarding-remediation-audit/08-ready.png`
- `test-results/onboarding-remediation-audit/09-integrations.png`
- `test-results/onboarding-remediation-audit/post-_receipts.png`
- `test-results/onboarding-remediation-audit/post-_collective.png`
- `test-results/onboarding-remediation-audit/post-_cortex.png`
- `test-results/onboarding-remediation-audit/post-_workspace.png`
- `test-results/onboarding-remediation-audit/post-_control.png`
- `test-results/onboarding-remediation-audit/post-_guardrails.png`
- `test-results/onboarding-remediation-audit/post-_diagnostics.png`
- `test-results/onboarding-remediation-audit/post-_settings.png`
- `test-results/onboarding-remediation-audit/post-_api-keys.png`
- `test-results/onboarding-remediation-audit/seeded-_integrations.png`
- `test-results/onboarding-remediation-audit/seeded-_receipts.png`
- `test-results/onboarding-remediation-audit/seeded-_collective.png`
- `test-results/onboarding-remediation-audit/seeded-_cortex.png`
- `test-results/onboarding-remediation-audit/seeded-_workspace.png`
- `test-results/onboarding-remediation-audit/seeded-_control.png`
- `test-results/onboarding-remediation-audit/seeded-_guardrails.png`
- `test-results/onboarding-remediation-audit/seeded-_diagnostics.png`
- `test-results/onboarding-remediation-audit/seeded-_settings.png`
- `test-results/onboarding-remediation-audit/seeded-_api-keys.png`

Additional evidence files:

- `test-results/onboarding-remediation-audit/audit-events.json`
- `test-results/onboarding-remediation-audit/post-screens-seeded.json`

## Final Recommendation

Needs fixes before PR, or provisioning architecture clarification first.

The remediation branch is directionally correct for the guided setup sequence: activation reaches Welcome, the 4-step rail is preserved, lifecycle preview is required, ready summary is coherent, `/integrations` reflects sandbox preview state, `/receipts` labels sample data, Collective has a restored first-run hero, and `/cortex` exists under Platform.

The branch is not ready to present provisioning as real. Activation currently simulates provisioning and binds local browser state to static/env workspace context. Before PR, either implement durable server-side provisioning or explicitly narrow the UI language so "workspace prepared" and "Workspace created" cannot be mistaken for tenant/workspace creation.
