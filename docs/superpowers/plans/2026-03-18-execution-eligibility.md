# Execution Eligibility Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only, deterministic execution eligibility evaluation layer that answers whether a prepared effect can be executed under current authority conditions — without implying, enabling, or authorizing execution.

**Architecture:** New DTOs define the eligibility view model. A repository interface wraps an internal evaluation context that checks activation, permission, delegation, scope, and prepared effect readiness. Mock fixtures cover all 5 named scenarios. A single UI panel renders the result with strict non-interactive affordances.

**Tech Stack:** TypeScript, React, Next.js, Tailwind CSS, lucide-react icons, existing Panel/Badge/Tooltip components from `@/components/ui`.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lib/collective/eligibility.dto.ts` | DTOs: `ExecutionEligibilityView`, `ExecutionEligibilityReason`, status/reason types |
| Create | `src/lib/collective/eligibility.mocks.ts` | 5 named mock fixtures + mock provider factory |
| Create | `src/lib/collective/eligibility.repositories.ts` | Repository interface, evaluation context, mock + future API provider |
| Modify | `src/lib/collective/queryKeys.ts` | Add `executionEligibility` namespace to existing query keys |
| Modify | `src/lib/collective/index.ts` | Add 3 new barrel exports |
| Create | `src/components/collective/execution-eligibility-panel.tsx` | Read-only eligibility panel component |
| Modify | `src/components/collective/collective-chain-stage-card.tsx` | Compact eligibility line in preparedEffect step 8 card |

---

### Task 1: Eligibility DTOs

**Files:**
- Create: `src/lib/collective/eligibility.dto.ts`

- [ ] **Step 1: Create the eligibility DTO file with all types**

```typescript
// src/lib/collective/eligibility.dto.ts
import type { PresentationTone } from "./dto";

export type ExecutionEligibilityStatus = "eligible" | "not_eligible";

export type ExecutionEligibilityReasonCode =
  | "activation_not_active"
  | "activation_missing"
  | "permission_invalid"
  | "permission_expired"
  | "delegation_invalid"
  | "delegation_revoked"
  | "scope_mismatch"
  | "prepared_effect_not_ready"
  | "upstream_revoked";

export interface ExecutionEligibilityReason {
  readonly code: ExecutionEligibilityReasonCode;
  readonly message: string;
}

export interface ExecutionEligibilityView {
  readonly preparedEffectId: string;
  readonly status: ExecutionEligibilityStatus;
  readonly reasons: readonly ExecutionEligibilityReason[];
  readonly evaluatedAtUtc: string;
  readonly statusPresentation: {
    readonly label: string;
    readonly tone: PresentationTone;
  };
}
```

Key design notes:
- `statusPresentation.tone` maps: `"eligible"` → `"success"`, `"not_eligible"` with hard failures (revoked, invalid) → `"danger"`, `"not_eligible"` with incomplete conditions (missing, not ready) → `"warning"`.
- All fields are `readonly` to match the project convention.
- No execution-implying language in any type name or field.

- [ ] **Step 2: Verify the file compiles**

Run: `cd D:/Repos/keon-omega/keon.control.website/.claude/worktrees/suspicious-kirch && npx tsc --noEmit src/lib/collective/eligibility.dto.ts 2>&1 | head -20`
Expected: No errors (or only unrelated upstream errors)

- [ ] **Step 3: Commit**

```bash
git add src/lib/collective/eligibility.dto.ts
git commit -m "feat(collective): add execution eligibility DTOs

Introduces ExecutionEligibilityView, ExecutionEligibilityReason,
and associated status/reason code types for the read-only
eligibility evaluation surface."
```

---

### Task 2: Eligibility Query Keys

**Files:**
- Modify: `src/lib/collective/queryKeys.ts`

- [ ] **Step 1: Add eligibility query keys to the existing `collectiveObservabilityQueryKeys` in `queryKeys.ts`**

Instead of creating a separate file, add the `executionEligibility` namespace to the existing `collectiveObservabilityQueryKeys` object in `src/lib/collective/queryKeys.ts`:

```typescript
// Add to collectiveObservabilityQueryKeys in queryKeys.ts, after preparedEffects:
  executionEligibility: {
    all: ["collective", "execution-eligibility"] as const,
    detail: (preparedEffectId: string) =>
      ["collective", "execution-eligibility", "detail", preparedEffectId] as const,
  },
```

This keeps all collective query keys in one namespace, consistent with the existing pattern. No separate file needed.

- [ ] **Step 2: Commit**

```bash
git add src/lib/collective/queryKeys.ts
git commit -m "feat(collective): add execution eligibility query keys to collective namespace"
```

---

### Task 3: Eligibility Mock Fixtures

**Files:**
- Create: `src/lib/collective/eligibility.mocks.ts`

- [ ] **Step 1: Create the mock fixtures file with all 5 named scenarios**

```typescript
// src/lib/collective/eligibility.mocks.ts
import type {
  ExecutionEligibilityView,
  ExecutionEligibilityReasonCode,
} from "./eligibility.dto";
import type { PresentationTone } from "./dto";

// ──────────────────────────────────────────────
// Tone classification
// ──────────────────────────────────────────────

// Hard failures: active violations of authority constraints.
// Scope mismatch is a boundary violation, not an incomplete condition.
const HARD_FAILURE_CODES: ReadonlySet<ExecutionEligibilityReasonCode> = new Set([
  "delegation_invalid",
  "delegation_revoked",
  "permission_invalid",
  "permission_expired",
  "scope_mismatch",
  "upstream_revoked",
]);

export function resolveEligibilityTone(
  status: "eligible" | "not_eligible",
  reasons: readonly { code: ExecutionEligibilityReasonCode }[],
): PresentationTone {
  if (status === "eligible") return "success";
  const hasHardFailure = reasons.some((r) => HARD_FAILURE_CODES.has(r.code));
  return hasHardFailure ? "danger" : "warning";
}

export function buildEligibilityPresentation(
  status: "eligible" | "not_eligible",
  reasons: readonly { code: ExecutionEligibilityReasonCode }[],
): { label: string; tone: PresentationTone } {
  return {
    label: status === "eligible" ? "Eligible" : "Not Eligible",
    tone: resolveEligibilityTone(status, reasons),
  };
}

// ──────────────────────────────────────────────
// Named fixtures
// ──────────────────────────────────────────────

export const mockEligibilityFullyEligible: ExecutionEligibilityView = {
  preparedEffectId: "prepared-effect-001",
  status: "eligible",
  reasons: [],
  evaluatedAtUtc: "2026-03-18T10:00:00Z",
  statusPresentation: buildEligibilityPresentation("eligible", []),
};

export const mockEligibilityMissingActivation: ExecutionEligibilityView = {
  preparedEffectId: "prepared-effect-no-activation",
  status: "not_eligible",
  reasons: [
    { code: "activation_missing", message: "No activation is linked to this prepared effect." },
  ],
  evaluatedAtUtc: "2026-03-18T10:01:00Z",
  statusPresentation: buildEligibilityPresentation("not_eligible", [
    { code: "activation_missing" },
  ]),
};

export const mockEligibilityExpiredPermission: ExecutionEligibilityView = {
  preparedEffectId: "prepared-effect-expired-perm",
  status: "not_eligible",
  reasons: [
    { code: "permission_expired", message: "The permission grant has expired." },
  ],
  evaluatedAtUtc: "2026-03-18T10:02:00Z",
  statusPresentation: buildEligibilityPresentation("not_eligible", [
    { code: "permission_expired" },
  ]),
};

export const mockEligibilityRevokedDelegation: ExecutionEligibilityView = {
  preparedEffectId: "prepared-effect-revoked-deleg",
  status: "not_eligible",
  reasons: [
    { code: "delegation_revoked", message: "The delegation grant has been revoked." },
    { code: "upstream_revoked", message: "Upstream authority chain is no longer valid." },
  ],
  evaluatedAtUtc: "2026-03-18T10:03:00Z",
  statusPresentation: buildEligibilityPresentation("not_eligible", [
    { code: "delegation_revoked" },
    { code: "upstream_revoked" },
  ]),
};

export const mockEligibilityScopeMismatch: ExecutionEligibilityView = {
  preparedEffectId: "prepared-effect-scope-fail",
  status: "not_eligible",
  reasons: [
    { code: "scope_mismatch", message: "Effect scope exceeds delegated bounds." },
  ],
  evaluatedAtUtc: "2026-03-18T10:04:00Z",
  statusPresentation: buildEligibilityPresentation("not_eligible", [
    { code: "scope_mismatch" },
  ]),
};

// ──────────────────────────────────────────────
// Fixture lookup by preparedEffectId
// ──────────────────────────────────────────────

const eligibilityFixtures = new Map<string, ExecutionEligibilityView>([
  [mockEligibilityFullyEligible.preparedEffectId, mockEligibilityFullyEligible],
  [mockEligibilityMissingActivation.preparedEffectId, mockEligibilityMissingActivation],
  [mockEligibilityExpiredPermission.preparedEffectId, mockEligibilityExpiredPermission],
  [mockEligibilityRevokedDelegation.preparedEffectId, mockEligibilityRevokedDelegation],
  [mockEligibilityScopeMismatch.preparedEffectId, mockEligibilityScopeMismatch],
]);

export function getMockEligibilityView(preparedEffectId: string): ExecutionEligibilityView | null {
  return eligibilityFixtures.get(preparedEffectId) ?? null;
}
```

Tone mapping rules:
- `"eligible"` → `"success"` (green)
- `"not_eligible"` with any of `delegation_invalid`, `delegation_revoked`, `permission_invalid`, `permission_expired`, `scope_mismatch`, `upstream_revoked` → `"danger"` (red — hard failures / boundary violations)
- `"not_eligible"` with only `activation_missing`, `activation_not_active`, `prepared_effect_not_ready` → `"warning"` (amber — incomplete conditions)

- [ ] **Step 2: Commit**

```bash
git add src/lib/collective/eligibility.mocks.ts
git commit -m "feat(collective): add 5 named execution eligibility mock fixtures

Covers: fully eligible, missing activation, expired permission,
revoked delegation, and scope mismatch scenarios."
```

---

### Task 4: Eligibility Repository

**Files:**
- Create: `src/lib/collective/eligibility.repositories.ts`

- [ ] **Step 1: Create repository with evaluation context**

```typescript
// src/lib/collective/eligibility.repositories.ts
import type {
  ExecutionEligibilityReason,
  ExecutionEligibilityReasonCode,
  ExecutionEligibilityView,
} from "./eligibility.dto";
import { buildEligibilityPresentation, getMockEligibilityView } from "./eligibility.mocks";

// ──────────────────────────────────────────────
// Evaluation context — internal, explicit, extensible
// ──────────────────────────────────────────────

export interface EligibilityEvaluationContext {
  readonly preparedEffectId: string;
  readonly activation: {
    readonly exists: boolean;
    readonly lifecycleActive: boolean;
  };
  readonly permission: {
    readonly exists: boolean;
    readonly lifecycleValid: boolean;
    readonly expired: boolean;
  };
  readonly delegation: {
    readonly exists: boolean;
    readonly lifecycleValid: boolean;
    readonly revoked: boolean;
  };
  readonly scopeAligned: boolean;
  readonly preparedEffectReady: boolean;
}

function evaluateContext(ctx: EligibilityEvaluationContext): ExecutionEligibilityView {
  const reasons: ExecutionEligibilityReason[] = [];

  // Activation checks
  if (!ctx.activation.exists) {
    reasons.push({ code: "activation_missing", message: "No activation is linked to this prepared effect." });
  } else if (!ctx.activation.lifecycleActive) {
    reasons.push({ code: "activation_not_active", message: "Activation is not active." });
  }

  // Permission checks — expired is only meaningful if the permission exists
  if (!ctx.permission.exists || !ctx.permission.lifecycleValid) {
    reasons.push({ code: "permission_invalid", message: "The permission grant is not valid." });
  } else if (ctx.permission.expired) {
    reasons.push({ code: "permission_expired", message: "The permission grant has expired." });
  }

  // Delegation checks
  if (!ctx.delegation.exists || !ctx.delegation.lifecycleValid) {
    reasons.push({ code: "delegation_invalid", message: "The delegation grant is not valid." });
  }
  if (ctx.delegation.revoked) {
    reasons.push({ code: "delegation_revoked", message: "The delegation grant has been revoked." });
  }

  // Scope alignment (deferred — simulated via mock)
  if (!ctx.scopeAligned) {
    reasons.push({ code: "scope_mismatch", message: "Effect scope exceeds delegated bounds." });
  }

  // Prepared effect readiness
  if (!ctx.preparedEffectReady) {
    reasons.push({ code: "prepared_effect_not_ready", message: "The prepared effect is not in a ready state." });
  }

  // Upstream revocation is a derived condition: when a delegation is revoked
  // and an activation exists that depends on it, the entire upstream authority
  // chain is invalidated. This is separate from delegation_revoked because it
  // signals cascading impact, not just the delegation's own state.
  // The mock fixture for "revoked delegation" includes both delegation_revoked
  // AND upstream_revoked to mirror this derivation.
  if (ctx.delegation.revoked && ctx.activation.exists) {
    reasons.push({ code: "upstream_revoked", message: "Upstream authority chain is no longer valid." });
  }

  const status = reasons.length === 0 ? "eligible" : "not_eligible";

  return {
    preparedEffectId: ctx.preparedEffectId,
    status,
    reasons,
    evaluatedAtUtc: new Date().toISOString(),
    statusPresentation: buildEligibilityPresentation(status, reasons),
  };
}

// ──────────────────────────────────────────────
// Repository interface
// ──────────────────────────────────────────────

export interface ExecutionEligibilityRepository {
  evaluate(preparedEffectId: string): Promise<ExecutionEligibilityView>;
}

// ──────────────────────────────────────────────
// Mock repository — returns fixture data directly
// No caching. Recomputed on every call.
//
// Unlike other collective repositories (which use a Provider → Adapter
// two-layer architecture for contract-to-view-model transformation),
// eligibility is computed from existing view models, not fetched from
// an external API contract. There is no contract schema to adapt from,
// so the provider layer is intentionally omitted.
// ──────────────────────────────────────────────

export function createMockExecutionEligibilityRepository(): ExecutionEligibilityRepository {
  return {
    async evaluate(preparedEffectId: string): Promise<ExecutionEligibilityView> {
      const fixture = getMockEligibilityView(preparedEffectId);
      if (fixture) {
        // Return a fresh copy with updated timestamp to prove recomputation
        return {
          ...fixture,
          evaluatedAtUtc: new Date().toISOString(),
        };
      }

      // Default: if the preparedEffectId is "prepared-effect-001" (full chain),
      // return eligible. Otherwise, return a generic not-ready result.
      return evaluateContext({
        preparedEffectId,
        activation: { exists: false, lifecycleActive: false },
        permission: { exists: false, lifecycleValid: false, expired: false },
        delegation: { exists: false, lifecycleValid: false, revoked: false },
        scopeAligned: false,
        preparedEffectReady: false,
      });
    },
  };
}

// ──────────────────────────────────────────────
// Factory (default: mock)
// ──────────────────────────────────────────────

export function createExecutionEligibilityRepository(): ExecutionEligibilityRepository {
  return createMockExecutionEligibilityRepository();
}

// Re-export evaluateContext for future use when real providers exist
export { evaluateContext as evaluateEligibilityContext };
```

Key constraints enforced:
1. **No caching** — every `evaluate()` call produces a fresh result with a new `evaluatedAtUtc`.
2. **No early exit** — all checks run; all failing reasons are collected.
3. **Deterministic ordering** — reasons are added in the canonical order: activation → permission → delegation → scope → prepared effect → upstream.
4. **Evaluation context is explicit** — the `EligibilityEvaluationContext` interface makes every input visible and extensible.

- [ ] **Step 2: Commit**

```bash
git add src/lib/collective/eligibility.repositories.ts
git commit -m "feat(collective): add execution eligibility repository with evaluation context

Repository evaluates all authority conditions without caching.
Exports evaluateEligibilityContext for future real-provider use."
```

---

### Task 5: Barrel Exports

**Files:**
- Modify: `src/lib/collective/index.ts`

- [ ] **Step 1: Add 3 new exports to the barrel file**

Add these lines to `src/lib/collective/index.ts` (after the existing exports):

```typescript
export * from "./eligibility.dto";
export * from "./eligibility.mocks";
export * from "./eligibility.repositories";
```

Note: Query keys are already exported via `./queryKeys` (added in Task 2).

- [ ] **Step 2: Verify the barrel compiles**

Run: `cd D:/Repos/keon-omega/keon.control.website/.claude/worktrees/suspicious-kirch && npx tsc --noEmit src/lib/collective/index.ts 2>&1 | head -20`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/collective/index.ts
git commit -m "feat(collective): re-export eligibility surface from barrel"
```

---

### Task 6: Execution Eligibility Panel Component

**Files:**
- Create: `src/components/collective/execution-eligibility-panel.tsx`

- [ ] **Step 1: Create the panel component**

First, export `TONE_BADGE_VARIANT` from `collective-chain-stage-card.tsx` by adding the `export` keyword to the existing declaration:

```typescript
// In collective-chain-stage-card.tsx, change:
const TONE_BADGE_VARIANT: Record<...> = { ... };
// To:
export const TONE_BADGE_VARIANT: Record<...> = { ... };
```

Then create the panel component importing it:

```tsx
// src/components/collective/execution-eligibility-panel.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import type { ExecutionEligibilityView } from "@/lib/collective/eligibility.dto";
import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { TONE_BADGE_VARIANT } from "./collective-chain-stage-card";

interface ExecutionEligibilityPanelProps {
  readonly eligibility: ExecutionEligibilityView;
}

export function ExecutionEligibilityPanel({ eligibility }: ExecutionEligibilityPanelProps) {
  const isEligible = eligibility.status === "eligible";
  const Icon = isEligible ? ShieldCheck : ShieldAlert;
  const tone = eligibility.statusPresentation.tone;

  return (
    <Panel className={cn(
      "w-full",
      tone === "success" && "border-[--reactor-blue]/30",
      tone === "warning" && "border-[--safety-orange]/30",
      tone === "danger" && "border-[--ballistic-red]/30",
    )}>
      <PanelHeader>
        <div className="flex items-center gap-2">
          <Icon className={cn(
            "h-4 w-4",
            tone === "success" && "text-[--reactor-glow]",
            tone === "warning" && "text-[--safety-orange]",
            tone === "danger" && "text-[--ballistic-red]",
          )} />
          <PanelTitle>Execution Eligibility</PanelTitle>
        </div>
        <Badge variant={TONE_BADGE_VARIANT[tone]}>
          {eligibility.statusPresentation.label}
        </Badge>
      </PanelHeader>

      <PanelContent className="p-3 space-y-3">
        {isEligible ? (
          <>
            <p className="text-xs font-mono text-[--flash] leading-relaxed">
              All authority conditions are satisfied.
            </p>
            <p className="text-[10px] font-mono text-[--safety-orange]/80 leading-relaxed">
              Execution still requires governed invocation.
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-mono text-[--steel] leading-relaxed">
              Execution is not eligible under current authority conditions.
            </p>

            {eligibility.reasons.length > 0 && (
              <ul className="space-y-1">
                {eligibility.reasons.map((reason) => (
                  <li
                    key={reason.code}
                    className="flex items-start gap-2 text-xs font-mono text-[--flash] leading-relaxed"
                  >
                    <span className="text-[--tungsten] select-none shrink-0" aria-hidden>&#8226;</span>
                    <span>{reason.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <p className="text-[9px] font-mono text-[--tungsten] tabular-nums">
          Evaluated {new Date(eligibility.evaluatedAtUtc).toLocaleString()}
        </p>
      </PanelContent>
    </Panel>
  );
}
```

Visual rules enforced:
- **No glow** that implies clickability
- **No buttons** — zero interactive affordances
- **No links** — no "Execute", "Run", "Trigger", "Apply", "Start"
- **No cursor-pointer** — purely informational
- Language uses only: Eligible, Not Eligible, conditions satisfied, requires governed invocation

- [ ] **Step 2: Verify the component compiles**

Run: `cd D:/Repos/keon-omega/keon.control.website/.claude/worktrees/suspicious-kirch && npx tsc --noEmit src/components/collective/execution-eligibility-panel.tsx 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/collective/execution-eligibility-panel.tsx
git commit -m "feat(collective): add execution eligibility panel component

Read-only panel with zero interactive affordances. Renders
eligibility status, failure reasons, and tone-mapped badges."
```

---

### Task 7: Chain Stage Card — Compact Eligibility Line

**Files:**
- Modify: `src/components/collective/collective-chain-stage-card.tsx`

- [ ] **Step 1: Export `TONE_BADGE_VARIANT` and add optional eligibility prop**

In `collective-chain-stage-card.tsx`, export the existing `TONE_BADGE_VARIANT` constant (so `execution-eligibility-panel.tsx` can import it), add an import for the eligibility status type, and add a compact eligibility line inside the preparedEffect section.

Change `const TONE_BADGE_VARIANT` to `export const TONE_BADGE_VARIANT` (line 47).

Add import at top:
```typescript
import type { ExecutionEligibilityStatus } from "@/lib/collective/eligibility.dto";
```

Add to the `CollectiveChainStageCardProps` interface:
```typescript
readonly eligibilityStatus?: ExecutionEligibilityStatus;
```

Add to the props destructuring:
```typescript
export function CollectiveChainStageCard({ node, isFocused, isDimmed, isGuidedMissing, onSelect, eligibilityStatus }: CollectiveChainStageCardProps) {
```

Add after the existing `isPreparedEffect && "No execution authority"` block (after line ~147, before the timestamp block):

```tsx
{isPreparedEffect && eligibilityStatus && (
  <p className={cn(
    "text-[9px] font-mono leading-tight",
    eligibilityStatus === "eligible"
      ? "text-[--reactor-glow]/80"
      : "text-[--ballistic-red]/80",
  )}>
    Execution Eligibility: {eligibilityStatus === "eligible" ? "ELIGIBLE" : "NOT ELIGIBLE"}
  </p>
)}
```

This is compact, informational, and uses no interactive affordances.

- [ ] **Step 2: Verify the component compiles**

Run: `cd D:/Repos/keon-omega/keon.control.website/.claude/worktrees/suspicious-kirch && npx tsc --noEmit src/components/collective/collective-chain-stage-card.tsx 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/collective/collective-chain-stage-card.tsx
git commit -m "feat(collective): add compact eligibility status to prepared effect stage card

Optional prop; renders a single read-only line in the step 8 card."
```

---

### Task 8: Build Verification

- [ ] **Step 1: Run full TypeScript check**

Run: `cd D:/Repos/keon-omega/keon.control.website/.claude/worktrees/suspicious-kirch && npx tsc --noEmit 2>&1 | tail -20`
Expected: No new errors introduced

- [ ] **Step 2: Run Next.js build**

Run: `cd D:/Repos/keon-omega/keon.control.website/.claude/worktrees/suspicious-kirch && pnpm build 2>&1 | tail -30`
Expected: Build succeeds

- [ ] **Step 3: Fix any issues and commit if needed**

If build errors occur, fix them and commit with:
```bash
git commit -m "fix(collective): resolve build errors in eligibility surface"
```

---

## Verification Checklist

After all tasks complete, verify:

- [ ] `ExecutionEligibilityPanel` appears when given eligibility data
- [ ] Correct status badge across all 5 mock fixtures
- [ ] Multiple failure reasons display as a bulleted list
- [ ] No interactive affordances exist (no buttons, links, glow-on-hover)
- [ ] Tone mapping: eligible=green, hard failure=red, incomplete=amber
- [ ] `evaluatedAtUtc` is fresh on every call (no caching)
- [ ] Compact line renders in step 8 stage card when `eligibilityStatus` is provided
- [ ] No state mutation occurs anywhere in the eligibility surface
- [ ] All new files are re-exported from `src/lib/collective/index.ts`

## Deferred (Not In Scope)

- **Page wiring**: The `ExecutionEligibilityPanel` is created as a component but is not wired into a specific page layout in this plan. Wiring into the prepared effect detail page is a follow-up task that depends on how the detail pages are structured.
- **Scope model**: Real scope containment checking (`preparedEffect.scope ⊆ activation.scope ⊆ ...`) is deferred. The `scope_mismatch` reason code exists and is simulated via mocks, but the actual scope comparison logic will arrive with the governed invocation surface.
