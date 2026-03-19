# Invocation Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only invocation preview surface that explains what it would take to form a governed execution request for a prepared effect — without enabling submission or execution.

**Architecture:** Invocation preview is a projection over already-resolved eligibility state (Option B threading). The detail rail orchestrates: it fetches eligibility, then passes it into the preview repository which derives readiness status, requirements, and authority context. New DTO (`InvocationPreviewView`), mock repository, UI panel, and compact chain-card status line.

**Tech Stack:** TypeScript, React, TanStack Query, Lucide icons, Tailwind CSS, existing Panel/Badge UI kit.

**Constitutional constraints:** No buttons, no links implying submission, no execution language. Preview ≠ invocation ≠ execution. Prepared effects remain inert.

---

### Task 1: Invocation Preview DTO

**Files:**
- Create: `src/lib/collective/invocation-preview.dto.ts`

- [ ] **Step 1: Create the DTO file with all types**

```typescript
// src/lib/collective/invocation-preview.dto.ts

import type { ExecutionEligibilityStatus } from "./eligibility.dto";
import type { PresentationTone } from "./dto";

// ──────────────────────────────────────────────
// Readiness status — derived from eligibility + requirements
// ──────────────────────────────────────────────

export type InvocationReadinessStatus =
  | "not_available"
  | "constrained"
  | "ready";

// ──────────────────────────────────────────────
// Requirement model — deterministic, always-present
// ──────────────────────────────────────────────

export type InvocationRequirementCode =
  | "activation_must_be_active"
  | "permission_must_be_valid"
  | "delegation_must_be_valid"
  | "scope_must_remain_within_bounds"
  | "prepared_effect_must_be_ready";

export interface InvocationRequirement {
  readonly code: InvocationRequirementCode;
  readonly message: string;
  readonly satisfied: boolean;
}

// ──────────────────────────────────────────────
// Authority context snapshot
// ──────────────────────────────────────────────

export interface InvocationAuthorityContext {
  readonly delegationId?: string;
  readonly permissionId?: string;
  readonly activationId?: string;
}

// ──────────────────────────────────────────────
// Invocation Preview View — the top-level projection
// ──────────────────────────────────────────────

export interface InvocationPreviewView {
  readonly preparedEffectId: string;
  readonly status: InvocationReadinessStatus;
  readonly summary: string;
  readonly requirements: readonly InvocationRequirement[];
  readonly authorityContext: InvocationAuthorityContext;
  readonly eligibilityStatus: ExecutionEligibilityStatus;
  readonly evaluatedAtUtc: string;
  readonly statusPresentation: {
    readonly label: string;
    readonly tone: PresentationTone;
  };
}

// ──────────────────────────────────────────────
// Presentation helpers
// ──────────────────────────────────────────────

const STATUS_PRESENTATION: Record<
  InvocationReadinessStatus,
  { label: string; tone: PresentationTone }
> = {
  not_available: { label: "Not Available", tone: "neutral" },
  constrained: { label: "Constrained", tone: "warning" },
  ready: { label: "Ready", tone: "success" },
};

export function buildInvocationPreviewPresentation(
  status: InvocationReadinessStatus,
): { label: string; tone: PresentationTone } {
  return STATUS_PRESENTATION[status];
}

const STATUS_SUMMARIES: Record<InvocationReadinessStatus, string> = {
  not_available:
    "Invocation cannot be formed under current authority conditions.",
  constrained:
    "Invocation can be formed but remains constrained by authority requirements.",
  ready:
    "All conditions to form a governed invocation are satisfied.",
};

export function buildInvocationPreviewSummary(
  status: InvocationReadinessStatus,
): string {
  return STATUS_SUMMARIES[status];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/collective/invocation-preview.dto.ts
git commit -m "feat(collective): add invocation preview DTO and presentation helpers"
```

---

### Task 2: Invocation Preview Repository

**Files:**
- Create: `src/lib/collective/invocation-preview.repositories.ts`

The repository accepts already-resolved eligibility data (Option B) and derives the preview projection. It does NOT fetch eligibility independently.

**Note on `constrained` reachability:** In the current eligibility model, `status === "eligible"` always means `reasons` is empty, so all requirements will be satisfied and the repository will produce `ready` (never `constrained`). The `constrained` state is defined in the DTO and mocks for UI completeness and future readiness — when richer eligibility signals (e.g. partial authority, time-bound constraints) are introduced, the `constrained` path will become reachable. A comment in the repository documents this.

- [ ] **Step 1: Create the repository file**

```typescript
// src/lib/collective/invocation-preview.repositories.ts

import type { ExecutionEligibilityView } from "./eligibility.dto";
import type {
  InvocationAuthorityContext,
  InvocationPreviewView,
  InvocationReadinessStatus,
  InvocationRequirement,
  InvocationRequirementCode,
} from "./invocation-preview.dto";
import {
  buildInvocationPreviewPresentation,
  buildInvocationPreviewSummary,
} from "./invocation-preview.dto";

// ──────────────────────────────────────────────
// Requirement derivation from eligibility reasons
// ──────────────────────────────────────────────

// Maps each requirement code to the eligibility reason codes that would
// indicate the requirement is NOT satisfied.
const REQUIREMENT_FAILURE_CODES: Record<
  InvocationRequirementCode,
  ReadonlySet<string>
> = {
  prepared_effect_must_be_ready: new Set(["prepared_effect_not_ready"]),
  activation_must_be_active: new Set([
    "activation_not_active",
    "activation_missing",
  ]),
  permission_must_be_valid: new Set([
    "permission_invalid",
    "permission_expired",
  ]),
  delegation_must_be_valid: new Set([
    "delegation_invalid",
    "delegation_revoked",
    "upstream_revoked",
  ]),
  scope_must_remain_within_bounds: new Set(["scope_mismatch"]),
};

const REQUIREMENT_MESSAGES: Record<InvocationRequirementCode, string> = {
  prepared_effect_must_be_ready: "Prepared effect must be ready",
  activation_must_be_active: "Activation must be active",
  permission_must_be_valid: "Permission must be valid",
  delegation_must_be_valid: "Delegation must be valid",
  scope_must_remain_within_bounds: "Scope must remain within bounds",
};

// Deterministic order per spec
const REQUIREMENT_ORDER: readonly InvocationRequirementCode[] = [
  "prepared_effect_must_be_ready",
  "activation_must_be_active",
  "permission_must_be_valid",
  "delegation_must_be_valid",
  "scope_must_remain_within_bounds",
];

function deriveRequirements(
  eligibility: ExecutionEligibilityView,
): readonly InvocationRequirement[] {
  const failedCodes = new Set(eligibility.reasons.map((r) => r.code));

  return REQUIREMENT_ORDER.map((code) => {
    const failureCodes = REQUIREMENT_FAILURE_CODES[code];
    const satisfied = ![...failureCodes].some((fc) => failedCodes.has(fc));

    return {
      code,
      message: REQUIREMENT_MESSAGES[code],
      satisfied,
    };
  });
}

// ──────────────────────────────────────────────
// Status resolution
//
// Current eligibility model: eligible → empty reasons → all satisfied → ready.
// The "constrained" path exists for future eligibility models that surface
// partial authority or time-bound constraints where eligibility is met but
// requirements remain unsatisfied. Until then, only "not_available" and
// "ready" are reachable from live data.
// ──────────────────────────────────────────────

function resolveReadinessStatus(
  eligibility: ExecutionEligibilityView,
  requirements: readonly InvocationRequirement[],
): InvocationReadinessStatus {
  if (eligibility.status === "not_eligible") return "not_available";
  const allSatisfied = requirements.every((r) => r.satisfied);
  return allSatisfied ? "ready" : "constrained";
}

// ──────────────────────────────────────────────
// Repository interface and factory
// ──────────────────────────────────────────────

export interface InvocationPreviewRepository {
  preview(
    preparedEffectId: string,
    eligibility: ExecutionEligibilityView,
    authorityContext?: InvocationAuthorityContext,
  ): Promise<InvocationPreviewView>;
}

export function createInvocationPreviewRepository(): InvocationPreviewRepository {
  return {
    async preview(
      preparedEffectId: string,
      eligibility: ExecutionEligibilityView,
      authorityContext: InvocationAuthorityContext = {},
    ): Promise<InvocationPreviewView> {
      const requirements = deriveRequirements(eligibility);
      const status = resolveReadinessStatus(eligibility, requirements);

      return {
        preparedEffectId,
        status,
        summary: buildInvocationPreviewSummary(status),
        requirements,
        authorityContext,
        eligibilityStatus: eligibility.status,
        evaluatedAtUtc: eligibility.evaluatedAtUtc,
        statusPresentation: buildInvocationPreviewPresentation(status),
      };
    },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/collective/invocation-preview.repositories.ts
git commit -m "feat(collective): add invocation preview repository with eligibility-derived projection"
```

---

### Task 3: Invocation Preview Mocks

**Files:**
- Create: `src/lib/collective/invocation-preview.mocks.ts`

Three named fixtures per spec: not_available, constrained, ready.

- [ ] **Step 1: Create mock fixtures**

```typescript
// src/lib/collective/invocation-preview.mocks.ts

import type { InvocationPreviewView } from "./invocation-preview.dto";
import {
  buildInvocationPreviewPresentation,
  buildInvocationPreviewSummary,
} from "./invocation-preview.dto";

// ──────────────────────────────────────────────
// Fixture 1: not_available — missing activation
// ──────────────────────────────────────────────

export const mockInvocationPreviewNotAvailable: InvocationPreviewView = {
  preparedEffectId: "prepared-effect-no-activation",
  status: "not_available",
  summary: buildInvocationPreviewSummary("not_available"),
  requirements: [
    { code: "prepared_effect_must_be_ready", message: "Prepared effect must be ready", satisfied: true },
    { code: "activation_must_be_active", message: "Activation must be active", satisfied: false },
    { code: "permission_must_be_valid", message: "Permission must be valid", satisfied: true },
    { code: "delegation_must_be_valid", message: "Delegation must be valid", satisfied: true },
    { code: "scope_must_remain_within_bounds", message: "Scope must remain within bounds", satisfied: true },
  ],
  authorityContext: {
    delegationId: "deleg-001",
    permissionId: "perm-001",
  },
  eligibilityStatus: "not_eligible",
  evaluatedAtUtc: "2026-03-18T10:01:00Z",
  statusPresentation: buildInvocationPreviewPresentation("not_available"),
};

// ──────────────────────────────────────────────
// Fixture 2: constrained — eligible but one requirement unsatisfied
// ──────────────────────────────────────────────

export const mockInvocationPreviewConstrained: InvocationPreviewView = {
  preparedEffectId: "prepared-effect-constrained",
  status: "constrained",
  summary: buildInvocationPreviewSummary("constrained"),
  requirements: [
    { code: "prepared_effect_must_be_ready", message: "Prepared effect must be ready", satisfied: true },
    { code: "activation_must_be_active", message: "Activation must be active", satisfied: true },
    { code: "permission_must_be_valid", message: "Permission must be valid", satisfied: false },
    { code: "delegation_must_be_valid", message: "Delegation must be valid", satisfied: true },
    { code: "scope_must_remain_within_bounds", message: "Scope must remain within bounds", satisfied: true },
  ],
  authorityContext: {
    delegationId: "deleg-001",
    permissionId: "perm-002",
    activationId: "act-001",
  },
  eligibilityStatus: "eligible",
  evaluatedAtUtc: "2026-03-18T10:02:00Z",
  statusPresentation: buildInvocationPreviewPresentation("constrained"),
};

// ──────────────────────────────────────────────
// Fixture 3: ready — all requirements satisfied
// ──────────────────────────────────────────────

export const mockInvocationPreviewReady: InvocationPreviewView = {
  preparedEffectId: "prepared-effect-001",
  status: "ready",
  summary: buildInvocationPreviewSummary("ready"),
  requirements: [
    { code: "prepared_effect_must_be_ready", message: "Prepared effect must be ready", satisfied: true },
    { code: "activation_must_be_active", message: "Activation must be active", satisfied: true },
    { code: "permission_must_be_valid", message: "Permission must be valid", satisfied: true },
    { code: "delegation_must_be_valid", message: "Delegation must be valid", satisfied: true },
    { code: "scope_must_remain_within_bounds", message: "Scope must remain within bounds", satisfied: true },
  ],
  authorityContext: {
    delegationId: "deleg-001",
    permissionId: "perm-001",
    activationId: "act-001",
  },
  eligibilityStatus: "eligible",
  evaluatedAtUtc: "2026-03-18T10:00:00Z",
  statusPresentation: buildInvocationPreviewPresentation("ready"),
};

// ──────────────────────────────────────────────
// Fixture lookup by preparedEffectId
// ──────────────────────────────────────────────

const invocationPreviewFixtures = new Map<string, InvocationPreviewView>([
  [mockInvocationPreviewNotAvailable.preparedEffectId, mockInvocationPreviewNotAvailable],
  [mockInvocationPreviewConstrained.preparedEffectId, mockInvocationPreviewConstrained],
  [mockInvocationPreviewReady.preparedEffectId, mockInvocationPreviewReady],
]);

export function getMockInvocationPreviewView(
  preparedEffectId: string,
): InvocationPreviewView | null {
  return invocationPreviewFixtures.get(preparedEffectId) ?? null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/collective/invocation-preview.mocks.ts
git commit -m "feat(collective): add invocation preview mock fixtures for all three states"
```

---

### Task 4: Query Keys

**Files:**
- Modify: `src/lib/collective/queryKeys.ts`

- [ ] **Step 1: Add invocationPreview query key namespace**

Add the following inside `collectiveObservabilityQueryKeys`, after the `executionEligibility` block and before the closing `} as const;` (between lines 61 and 62) in `src/lib/collective/queryKeys.ts`:

```typescript
  invocationPreview: {
    all: ["collective", "invocation-preview"] as const,
    detail: (preparedEffectId: string) =>
      ["collective", "invocation-preview", "detail", preparedEffectId] as const,
  },
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/collective/queryKeys.ts
git commit -m "feat(collective): add invocation preview query keys"
```

---

### Task 5: Barrel Exports

**Files:**
- Modify: `src/lib/collective/index.ts`

- [ ] **Step 1: Add invocation preview exports**

Append to `src/lib/collective/index.ts`:

```typescript
export * from "./invocation-preview.dto";
export * from "./invocation-preview.mocks";
export * from "./invocation-preview.repositories";
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/collective/index.ts
git commit -m "feat(collective): add invocation preview barrel exports"
```

---

### Task 6: Invocation Preview Panel Component

**Files:**
- Create: `src/components/collective/invocation-preview-panel.tsx`

- [ ] **Step 1: Create the panel component**

```tsx
// src/components/collective/invocation-preview-panel.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import type { InvocationPreviewView } from "@/lib/collective/invocation-preview.dto";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";
import { TONE_BADGE_VARIANT } from "./collective-chain-stage-card";

interface InvocationPreviewPanelProps {
  readonly preview: InvocationPreviewView;
}

export function InvocationPreviewPanel({ preview }: InvocationPreviewPanelProps) {
  const tone = preview.statusPresentation.tone;

  return (
    <Panel className={cn(
      "w-full",
      tone === "success" && "border-[--reactor-blue]/30",
      tone === "warning" && "border-[--safety-orange]/30",
      tone === "neutral" && "border-[--tungsten]/30",
    )}>
      <PanelHeader>
        <div className="flex items-center gap-2">
          <Eye className={cn(
            "h-4 w-4",
            tone === "success" && "text-[--reactor-glow]",
            tone === "warning" && "text-[--safety-orange]",
            tone === "neutral" && "text-[--tungsten]",
          )} />
          <PanelTitle>Invocation Preview</PanelTitle>
        </div>
        <Badge variant={TONE_BADGE_VARIANT[tone]}>
          {preview.statusPresentation.label}
        </Badge>
      </PanelHeader>

      <PanelContent className="p-3 space-y-3">
        {/* Summary */}
        <p className={cn(
          "text-xs font-mono leading-relaxed",
          tone === "success" && "text-[--flash]",
          tone === "warning" && "text-[--safety-orange]",
          tone === "neutral" && "text-[--steel]",
        )}>
          {preview.summary}
        </p>

        {/* Requirements list */}
        <div>
          <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-[--steel]">
            Requirements
          </p>
          <ul className="space-y-1">
            {preview.requirements.map((req) => (
              <li
                key={req.code}
                className="flex items-start gap-2 text-xs font-mono text-[--flash] leading-relaxed"
              >
                <span
                  className={cn(
                    "shrink-0 select-none",
                    req.satisfied ? "text-[--reactor-glow]" : "text-[--ballistic-red]",
                  )}
                  aria-hidden
                >
                  {req.satisfied ? "\u2713" : "\u2717"}
                </span>
                <span>{req.message}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer — constitutional constraint notice */}
        <p className="text-[10px] font-mono text-[--safety-orange]/80 leading-relaxed">
          Invocation preview does not submit or execute this effect.
          Execution requires governed invocation.
        </p>

        {/* Timestamp */}
        <p className="text-[9px] font-mono text-[--tungsten] tabular-nums">
          Evaluated {new Date(preview.evaluatedAtUtc).toLocaleString()}
        </p>
      </PanelContent>
    </Panel>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/collective/invocation-preview-panel.tsx
git commit -m "feat(collective): add invocation preview panel component"
```

---

### Task 7: Component Barrel Export

**Files:**
- Modify: `src/components/collective/index.ts`

- [ ] **Step 1: Add InvocationPreviewPanel export**

Add after the first `ExecutionEligibilityPanel` export (line 12). There is a duplicate `ExecutionEligibilityPanel` export on line 16 — remove line 16 (keep line 12 to maintain alphabetical ordering):

```typescript
export { InvocationPreviewPanel } from "./invocation-preview-panel";
```

- [ ] **Step 2: Commit**

```bash
git add src/components/collective/index.ts
git commit -m "fix(collective): add invocation preview panel export and remove duplicate eligibility export"
```

---

### Task 8: Integrate Preview into Detail Rail

**Files:**
- Modify: `src/components/collective/collective-chain-detail-rail.tsx`

The detail rail already fetches eligibility. We add: (1) import preview repository, (2) derive preview from eligibility using `useQuery`, (3) render `InvocationPreviewPanel` between eligibility and record ID sections.

- [ ] **Step 1: Add imports**

Add to existing imports in `collective-chain-detail-rail.tsx`:

```typescript
import { InvocationPreviewPanel } from "@/components/collective/invocation-preview-panel";
import { createInvocationPreviewRepository } from "@/lib/collective";
```

- [ ] **Step 2: Add invocation preview query**

After the existing `eligibility` useQuery block (line 64), add:

```typescript
  const invocationPreview = useQuery({
    queryKey: preparedEffectId
      ? collectiveObservabilityQueryKeys.invocationPreview.detail(preparedEffectId)
      : ["collective", "invocation-preview", "detail", "absent"] as const,
    queryFn: () =>
      createInvocationPreviewRepository().preview(
        preparedEffectId!,
        eligibility.data!,
      ),
    enabled: Boolean(preparedEffectId) && Boolean(eligibility.data),
    staleTime: 0,
  });
```

- [ ] **Step 3: Render InvocationPreviewPanel after eligibility panel**

After the eligibility error block (after line 148), insert:

```tsx
          {preparedEffectId && invocationPreview.data && (
            <div className="border-t border-[--tungsten]/30 pt-3">
              <InvocationPreviewPanel preview={invocationPreview.data} />
            </div>
          )}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/collective/collective-chain-detail-rail.tsx
git commit -m "feat(collective): integrate invocation preview panel into detail rail"
```

---

### Task 9: Compact Status Line in Stage Card

**Files:**
- Modify: `src/components/collective/collective-chain-stage-card.tsx`

Add a new optional prop `invocationReadiness` and render a compact line below the eligibility status.

- [ ] **Step 1: Add prop and import**

Add to the imports:

```typescript
import type { InvocationReadinessStatus } from "@/lib/collective/invocation-preview.dto";
```

Add to `CollectiveChainStageCardProps`:

```typescript
  readonly invocationReadiness?: InvocationReadinessStatus;
```

- [ ] **Step 2: Add compact rendering**

After the existing eligibility status block (after line 160), add:

```tsx
        {isPreparedEffect && invocationReadiness && (
          <p className={cn(
            "mt-1 text-[9px] font-mono leading-tight",
            invocationReadiness === "ready"
              ? "text-[--reactor-glow]/80"
              : invocationReadiness === "constrained"
                ? "text-[--safety-orange]/80"
                : "text-[--tungsten]/80",
          )}>
            Invocation: {invocationReadiness === "ready"
              ? "READY"
              : invocationReadiness === "constrained"
                ? "CONSTRAINED"
                : "NOT AVAILABLE"}
          </p>
        )}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/collective/collective-chain-stage-card.tsx
git commit -m "feat(collective): add compact invocation readiness line to prepared effect stage card"
```

---

### Task 10: Thread Invocation Readiness into Chain View

**Files:**
- Modify: The parent component that renders `CollectiveChainStageCard` for preparedEffect stages. This is likely `src/components/collective/collective-chain-view.tsx`. The invocation readiness needs to be passed down from wherever the eligibility query result is available.

- [ ] **Step 1: Read `collective-chain-view.tsx` to understand how eligibility status is threaded**

Identify where `eligibilityStatus` is passed to `CollectiveChainStageCard` and follow the same pattern for `invocationReadiness`.

- [ ] **Step 2: Thread invocationReadiness through the same path as eligibilityStatus**

Pass the `invocationPreview.data?.status` as `invocationReadiness` to `CollectiveChainStageCard` for preparedEffect nodes, following the same conditional pattern used for `eligibilityStatus`.

- [ ] **Step 3: Commit**

```bash
git add src/components/collective/collective-chain-view.tsx
git commit -m "feat(collective): thread invocation readiness into chain stage cards"
```

---

### Task 11: Verification

- [ ] **Step 1: Run TypeScript type check**

```bash
pnpm tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 2: Run linter**

```bash
pnpm lint
```

Expected: No lint errors in new/modified files.

- [ ] **Step 3: Run build**

```bash
pnpm build
```

Expected: Successful build with no errors.

- [ ] **Step 4: Verify constitutional constraints**

Manual check of `invocation-preview-panel.tsx`:
- No `<button>`, `<a>`, or `onClick` handlers
- No words: "Submit", "Execute", "Trigger", "Run", "Apply", "Invoke" (as action verb)
- Footer disclaimer is always present
- Checkmarks indicate satisfaction only, not permission

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(collective): address verification findings"
```
