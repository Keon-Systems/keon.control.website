# Activation Foundation — `/activate` experience, provisioning state machine, canonical first-run routing

## Summary

Adds the activation foundation for Keon Control, including a dedicated `/activate` experience, provisioning state machine, API contract, orchestration UI, controlled error handling, and a passive Collective Replay designed to introduce Keon's decision model during workspace preparation.

Current provisioning is **simulated** behind the API boundary to establish the product and test foundation. Real tenant provisioning and final onboarding handoff integration are follow-on steps.

---

## What ships in this PR

### Route
- `/activate` — magic-link landing page, no-index, Suspense-wrapped

### API (simulated contract)
- `POST /api/activation/provision` — start a provisioning session, returns `provisioningId`
- `GET /api/activation/provision?id=...` — poll simulated state based on elapsed time

Both endpoints expose the real API contract. Provisioning is currently backed by an in-memory session store with a time-based state simulation. **This is a placeholder until real tenant provisioning is wired.** The API shape will not change; only the backing implementation needs to be replaced.

### Components
| Component | Purpose |
|---|---|
| `ActivationFlow` | Orchestrator: start → poll → complete → redirect |
| `ProvisioningPanel` | Left panel: checklist, progress bar, step messages |
| `CollectiveReplay` | Right panel: 9-phase animated scenario loop |
| `ActivationError` | 6 error kinds, retry where applicable, escalation path |

### State machine
- 7 internal states → 5 user-facing steps
- `SIMULATION_TIMELINE`: `invite_validating` → `tenant_resolving` → `tenant_creating` → `membership_binding` → `workspace_bootstrapping` → `provisioning_complete` over ~6.8 s
- Designed for drop-in replacement: swap `resolveSimulatedState` with a real backend call

### Canonical first-run routing (new in this revision)

```
/activate      ← magic-link entry (provisioning not complete)
  ↓ provisioning_complete
/welcome       ← OnboardingGate, START_SETUP
  ↓ START_SETUP
/setup?step=   ← OnboardingGate, multi-step config
  ↓ FINISH_ONBOARDING
/control       ← ControlGate, product shell
```

`EntryRedirect` at `/` now reads both the activation completion flag and the onboarding state:
- `activationCompleted === false` → `/activate`
- `state.completed === true` → `/control`
- `state.currentStep === "WELCOME"` → `/welcome`
- otherwise → `/setup?step=...`

Routing to `/activate` without a `?token` shows the `token_missing` error state — there is no silent dead-end.

---

## Persistence model

| State | Where stored | Survives |
|---|---|---|
| `provisioningId` (in-flight) | `sessionStorage` key `keon.activation.provisioningId` | Page refresh, not tab close |
| Provisioning session record | In-memory `Map` in API route module | Process lifetime only |
| `activationCompleted` flag | `localStorage` key `keon.activation.completed` | Tab close, browser restart |
| Onboarding state | `localStorage` key `keon.onboarding.state` | Tab close, browser restart |

**What changes when real provisioning exists:**
- The in-memory `Map` is replaced by a durable record (database, cache, or session cookie)
- `resolveSimulatedState` is replaced by a real status query to the provisioning service
- The `activationCompleted` localStorage flag becomes a server-side session attribute
- `sessionStorage` retry key remains valid as a UX resilience mechanism

---

## Collective Replay trust requirements

- Disclaimer `"Example scenario — not from your environment"` is rendered **outside** the animation state machine — always visible regardless of animation phase
- `data-testid="replay-disclaimer"` + `aria-label="Example scenario disclaimer"` for test and accessibility targeting
- No interaction controls — passive loop only
- Labeled `SCHEMA MIGRATION` and `ACCESS EXPANSION` — product-authentic scenario types, not lorem ipsum

---

## Test coverage

| Suite | Tests | Status |
|---|---|---|
| `state-machine.test.ts` | 36 | ✓ |
| `ProvisioningPanel.test.tsx` | 16 | ✓ |
| `CollectiveReplay.test.tsx` | 7 | ✓ |
| `ActivationError.test.tsx` | 17 | ✓ |
| `activation-flag.test.ts` | 8 | ✓ (new) |
| `entry-routing.test.ts` | 7 | ✓ (new) |

**91 activation-layer tests.** 5 pre-existing failures unrelated to this work.

---

## What is NOT in this PR (explicit non-claims)

- ❌ Real tenant provisioning (simulated behind API contract)
- ❌ Magic-link token validation against a real auth service (token is accepted as-is for simulation)
- ❌ Durable provisioning persistence beyond process lifetime
- ❌ Real workspace bootstrapping
- ❌ Integration with a real backend onboarding handoff

These are the documented immediate next steps, not oversights.

---

## Next immediate step

Replace `resolveSimulatedState` in `route.ts` with a real provisioning status query, and replace the in-memory session store with a durable record. The API contract and orchestration layer are ready to receive it.
