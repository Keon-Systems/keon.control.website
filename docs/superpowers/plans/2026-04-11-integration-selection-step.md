# Integration Selection Step — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new "Integration Selection" onboarding step between Access Confirmation and Guardrails that frames the BYO AI vs Keon Collective operating-model choice, with a Collective micro-preview and a new-tab showcase page.

**Architecture:** The state machine gains a `SELECT_INTEGRATION` step, `integrationStepCompleted` tracking flag, and optional `selectedIntegrationMode` capture. A new `IntegrationSelectionStep` component renders the two-card layout with CSS-only animated micro-preview. A separate `CollectiveShowcasePage` serves as the new-tab destination using a topbar-only (no sidebar) layout.

**Tech Stack:** Next.js 14 App Router, React, TypeScript, Tailwind CSS, Vitest + Testing Library, no additional dependencies.

**Spec:** `docs/superpowers/specs/2026-04-11-integration-selection-step-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/onboarding/state-machine.ts` | Modify | Add step, event, two new state fields, update transitions |
| `src/lib/onboarding/experience.ts` | Modify | Add route key, maps, label, blocker message |
| `src/components/onboarding/OnboardingFlow.tsx` | Modify | Add `SELECT_INTEGRATION` case |
| `src/components/onboarding/steps/integration-selection-step.tsx` | **Create** | Full step component, cards, micro-preview |
| `src/app/collective/showcase/page.tsx` | **Create** | Collective showcase (topbar-only layout, new-tab destination) |
| `src/lib/onboarding/state-machine.test.ts` | Modify | Update happy-path test, add integration step tests |
| `tests/unit/onboarding/experience.test.ts` | Modify | Add integration route/label/blocker tests |
| `tests/unit/onboarding/integration-selection-step.test.tsx` | **Create** | Component tests |

---

## Task 1: Extend the state machine

**Files:**
- Modify: `src/lib/onboarding/state-machine.ts`
- Modify: `src/lib/onboarding/state-machine.test.ts`

- [ ] **Step 1.1 — Write failing tests**

Open `src/lib/onboarding/state-machine.test.ts`. Add a new `describe` block after the existing tests:

```ts
describe("SELECT_INTEGRATION step", () => {
  // Build state that has just completed CONFIRM_ACCESS
  const afterAccess = (() => {
    const started = transitionOnboardingState(defaultOnboardingState, { type: "START_SETUP" });
    const withGoals = transitionOnboardingState(started, {
      type: "SAVE_GOALS",
      payload: { selectedGoals: ["govern-ai-actions"] },
    });
    return transitionOnboardingState(withGoals, {
      type: "CONFIRM_ACCESS",
      payload: { workspaceId: "tenant_123" },
    });
  })();

  it("CONFIRM_ACCESS transitions to SELECT_INTEGRATION, not SET_GUARDRAILS", () => {
    expect(afterAccess.currentStep).toBe("SELECT_INTEGRATION");
  });

  it("ADVANCE_INTEGRATION without a mode transitions to SET_GUARDRAILS", () => {
    const next = transitionOnboardingState(afterAccess, { type: "ADVANCE_INTEGRATION" });
    expect(next.currentStep).toBe("SET_GUARDRAILS");
    expect(next.integrationStepCompleted).toBe(true);
    expect(next.selectedIntegrationMode).toBeUndefined();
  });

  it("ADVANCE_INTEGRATION with BYO_AI captures mode", () => {
    const next = transitionOnboardingState(afterAccess, {
      type: "ADVANCE_INTEGRATION",
      payload: { selectedMode: "BYO_AI" },
    });
    expect(next.selectedIntegrationMode).toBe("BYO_AI");
    expect(next.currentStep).toBe("SET_GUARDRAILS");
  });

  it("ADVANCE_INTEGRATION with COLLECTIVE captures mode", () => {
    const next = transitionOnboardingState(afterAccess, {
      type: "ADVANCE_INTEGRATION",
      payload: { selectedMode: "COLLECTIVE" },
    });
    expect(next.selectedIntegrationMode).toBe("COLLECTIVE");
  });

  it("ADVANCE_INTEGRATION is a no-op when workspaceId is missing", () => {
    const noAccess = { ...defaultOnboardingState, currentStep: "SELECT_INTEGRATION" as const };
    const unchanged = transitionOnboardingState(noAccess, { type: "ADVANCE_INTEGRATION" });
    expect(unchanged.currentStep).toBe("SELECT_INTEGRATION");
  });

  it("sanitizeOnboardingState preserves valid integrationStepCompleted and mode", () => {
    const result = sanitizeOnboardingState({
      integrationStepCompleted: true,
      selectedIntegrationMode: "COLLECTIVE",
    });
    expect(result.integrationStepCompleted).toBe(true);
    expect(result.selectedIntegrationMode).toBe("COLLECTIVE");
  });

  it("sanitizeOnboardingState rejects invalid selectedIntegrationMode", () => {
    const result = sanitizeOnboardingState({
      selectedIntegrationMode: "INVALID" as never,
    });
    expect(result.selectedIntegrationMode).toBeUndefined();
  });
});
```

Also update the existing happy-path test to thread through `ADVANCE_INTEGRATION`:

```ts
// In the existing "moves through the happy path in order" test,
// replace the direct CONFIRM_ACCESS → APPLY_GUARDRAILS chain with:
const withAccess = transitionOnboardingState(withGoals, {
  type: "CONFIRM_ACCESS",
  payload: { workspaceId: "tenant_123" },
});
const withIntegration = transitionOnboardingState(withAccess, {
  type: "ADVANCE_INTEGRATION",
  payload: { selectedMode: "BYO_AI" },
});
const readyToFinish = transitionOnboardingState(withIntegration, {
  type: "APPLY_GUARDRAILS",
  payload: { guardrailPreset: "balanced" },
});
// rest of test unchanged
```

Also add `sanitizeOnboardingState` to the import at the top of the test file:
```ts
import { defaultOnboardingState, sanitizeOnboardingState, transitionOnboardingState } from "./state-machine";
```

- [ ] **Step 1.2 — Run tests, confirm they fail**

```bash
cd /d/Repos/keon-omega/keon.control.website
pnpm test:unit -- --reporter=verbose 2>&1 | grep -E "FAIL|PASS|✓|✗|×|Error" | head -40
```

Expected: multiple failures including `SELECT_INTEGRATION` not found, `ADVANCE_INTEGRATION` not handled.

- [ ] **Step 1.3 — Implement state machine changes**

Replace the full contents of `src/lib/onboarding/state-machine.ts`:

```ts
export const onboardingSteps = [
  "WELCOME",
  "DEFINE_GOALS",
  "CONFIRM_ACCESS",
  "SELECT_INTEGRATION",
  "SET_GUARDRAILS",
  "READY",
] as const;

export type OnboardingStep = (typeof onboardingSteps)[number];

export const onboardingGoalOptions = [
  "govern-ai-actions",
  "memory-and-context",
  "oversight-and-collaboration",
] as const;

export type OnboardingGoal = (typeof onboardingGoalOptions)[number];

export const guardrailPresetOptions = ["strict", "balanced", "flexible"] as const;

export type GuardrailPreset = (typeof guardrailPresetOptions)[number];

export type IntegrationMode = "BYO_AI" | "COLLECTIVE";

export interface OnboardingState {
  currentStep: OnboardingStep;
  selectedGoals: OnboardingGoal[];
  workspaceId: string | null;
  integrationStepCompleted: boolean;
  selectedIntegrationMode: IntegrationMode | undefined;
  guardrailPreset: GuardrailPreset | null;
  completed: boolean;
}

export type OnboardingEvent =
  | { type: "HYDRATE"; payload: Partial<OnboardingState> }
  | { type: "START_SETUP" }
  | { type: "SAVE_GOALS"; payload: { selectedGoals: OnboardingGoal[] } }
  | { type: "CONFIRM_ACCESS"; payload: { workspaceId: string } }
  | { type: "ADVANCE_INTEGRATION"; payload?: { selectedMode?: IntegrationMode } }
  | { type: "APPLY_GUARDRAILS"; payload: { guardrailPreset: GuardrailPreset } }
  | { type: "FINISH_ONBOARDING" }
  | { type: "RESET" };

export const defaultOnboardingState: OnboardingState = {
  currentStep: "WELCOME",
  selectedGoals: [],
  workspaceId: null,
  integrationStepCompleted: false,
  selectedIntegrationMode: undefined,
  guardrailPreset: null,
  completed: false,
};

export function isOnboardingStep(value: unknown): value is OnboardingStep {
  return typeof value === "string" && onboardingSteps.includes(value as OnboardingStep);
}

export function isOnboardingGoal(value: unknown): value is OnboardingGoal {
  return typeof value === "string" && onboardingGoalOptions.includes(value as OnboardingGoal);
}

export function isGuardrailPreset(value: unknown): value is GuardrailPreset {
  return typeof value === "string" && guardrailPresetOptions.includes(value as GuardrailPreset);
}

export function isIntegrationMode(value: unknown): value is IntegrationMode {
  return value === "BYO_AI" || value === "COLLECTIVE";
}

export function sanitizeOnboardingState(input: Partial<OnboardingState> | null | undefined): OnboardingState {
  const selectedGoals = Array.isArray(input?.selectedGoals) ? input.selectedGoals.filter(isOnboardingGoal) : [];
  const workspaceId = typeof input?.workspaceId === "string" && input.workspaceId.length > 0 ? input.workspaceId : null;
  const integrationStepCompleted = input?.integrationStepCompleted === true;
  const selectedIntegrationMode = isIntegrationMode(input?.selectedIntegrationMode)
    ? input.selectedIntegrationMode
    : undefined;
  const guardrailPreset = isGuardrailPreset(input?.guardrailPreset) ? input.guardrailPreset : null;
  const completed = input?.completed === true;
  const currentStep = completed
    ? "READY"
    : isOnboardingStep(input?.currentStep)
      ? input.currentStep
      : defaultOnboardingState.currentStep;

  return {
    currentStep,
    selectedGoals,
    workspaceId,
    integrationStepCompleted,
    selectedIntegrationMode,
    guardrailPreset,
    completed,
  };
}

export function getCurrentStepIndex(step: OnboardingStep) {
  return onboardingSteps.indexOf(step);
}

export function transitionOnboardingState(state: OnboardingState, event: OnboardingEvent): OnboardingState {
  switch (event.type) {
    case "HYDRATE": {
      return sanitizeOnboardingState({
        ...state,
        ...event.payload,
      });
    }
    case "START_SETUP": {
      if (state.currentStep !== "WELCOME" || state.completed) {
        return state;
      }
      return { ...state, currentStep: "DEFINE_GOALS" };
    }
    case "SAVE_GOALS": {
      if (state.currentStep === "WELCOME" || event.payload.selectedGoals.length === 0) {
        return state;
      }
      return {
        ...state,
        selectedGoals: event.payload.selectedGoals,
        currentStep: "CONFIRM_ACCESS",
      };
    }
    case "CONFIRM_ACCESS": {
      if (state.selectedGoals.length === 0) {
        return state;
      }
      return {
        ...state,
        workspaceId: event.payload.workspaceId,
        currentStep: "SELECT_INTEGRATION",
      };
    }
    case "ADVANCE_INTEGRATION": {
      if (!state.workspaceId) {
        return state;
      }
      return {
        ...state,
        integrationStepCompleted: true,
        selectedIntegrationMode: event.payload?.selectedMode ?? state.selectedIntegrationMode,
        currentStep: "SET_GUARDRAILS",
      };
    }
    case "APPLY_GUARDRAILS": {
      if (!state.workspaceId) {
        return state;
      }
      return {
        ...state,
        guardrailPreset: event.payload.guardrailPreset,
        currentStep: "READY",
      };
    }
    case "FINISH_ONBOARDING": {
      if (state.currentStep !== "READY" || !state.guardrailPreset) {
        return state;
      }
      return { ...state, completed: true, currentStep: "READY" };
    }
    case "RESET": {
      return defaultOnboardingState;
    }
    default: {
      return state;
    }
  }
}
```

- [ ] **Step 1.4 — Run tests, confirm they pass**

```bash
cd /d/Repos/keon-omega/keon.control.website
pnpm test:unit -- --reporter=verbose 2>&1 | grep -E "FAIL|PASS|✓|✗|×" | head -40
```

Expected: all state-machine tests pass. The `experience.test.ts` tests may fail — that's fine; they'll be fixed in Task 2.

- [ ] **Step 1.5 — Commit**

```bash
git add src/lib/onboarding/state-machine.ts src/lib/onboarding/state-machine.test.ts
git commit -m "feat(onboarding): add SELECT_INTEGRATION step to state machine"
```

---

## Task 2: Update experience.ts routing helpers

**Files:**
- Modify: `src/lib/onboarding/experience.ts`
- Modify: `tests/unit/onboarding/experience.test.ts`
- Modify: `tests/unit/onboarding/entry-routing.test.ts`

- [ ] **Step 2.1 — Write failing tests**

Add to `tests/unit/onboarding/experience.test.ts`:

```ts
import { clampVisibleStep, getCurrentBlocker, getChecklistItems, getReadinessLabel, getNextRequiredStep } from "@/lib/onboarding/experience";
import { defaultOnboardingState, type OnboardingState } from "@/lib/onboarding/state-machine";

// Add these test cases to the existing describe block, or in a new one:

describe("SELECT_INTEGRATION routing", () => {
  const afterAccess: OnboardingState = {
    ...defaultOnboardingState,
    currentStep: "SELECT_INTEGRATION",
    selectedGoals: ["govern-ai-actions"],
    workspaceId: "tenant_123",
    integrationStepCompleted: false,
    selectedIntegrationMode: undefined,
  };

  it("getNextRequiredStep returns SELECT_INTEGRATION when step not completed", () => {
    expect(getNextRequiredStep(afterAccess)).toBe("SELECT_INTEGRATION");
  });

  it("getNextRequiredStep returns SET_GUARDRAILS once step completed", () => {
    const advanced: OnboardingState = {
      ...afterAccess,
      integrationStepCompleted: true,
      currentStep: "SET_GUARDRAILS",
    };
    expect(getNextRequiredStep(advanced)).toBe("SET_GUARDRAILS");
  });

  it("getCurrentBlocker returns integration message for SELECT_INTEGRATION", () => {
    expect(getCurrentBlocker(afterAccess)).toMatch(/review how keon governs decisions/i);
  });

  it("clampVisibleStep maps 'integration' query param to SELECT_INTEGRATION", () => {
    expect(clampVisibleStep("integration", afterAccess)).toBe("SELECT_INTEGRATION");
  });

  it("clampVisibleStep prevents skipping SELECT_INTEGRATION by navigating to guardrails", () => {
    // User at SELECT_INTEGRATION tries to go to guardrails — should be clamped back
    expect(clampVisibleStep("guardrails", afterAccess)).toBe("SELECT_INTEGRATION");
  });

  it("checklist completion count stays at 3 required items", () => {
    const complete: OnboardingState = {
      ...defaultOnboardingState,
      currentStep: "READY",
      selectedGoals: ["govern-ai-actions"],
      workspaceId: "tenant_123",
      integrationStepCompleted: true,
      guardrailPreset: "balanced",
    };
    const { required } = getChecklistItems(complete);
    expect(required).toHaveLength(3);
    expect(required.every((item) => item.status === "complete")).toBe(true);
  });
});
```

Also update the `midSetupState` fixture in `tests/unit/onboarding/entry-routing.test.ts` to include the new required fields (so TypeScript is happy — the test logic itself doesn't need to change):

```ts
// Update the midSetupState fixture:
const midSetupState: OnboardingState = {
  ...defaultOnboardingState,
  currentStep: "CONFIRM_ACCESS" as const,
  selectedGoals: ["govern-ai-actions"] as const,
};
// (defaultOnboardingState already has integrationStepCompleted: false — spreading it is sufficient)
```

And update `completedState` in the same file:

```ts
const completedState: OnboardingState = {
  ...defaultOnboardingState,
  currentStep: "READY" as const,
  selectedGoals: ["govern-ai-actions"] as const,
  workspaceId: "tenant_abc",
  integrationStepCompleted: true,
  guardrailPreset: "balanced" as const,
  completed: true,
};
```

Add the `OnboardingState` import to `entry-routing.test.ts`:
```ts
import { defaultOnboardingState, type OnboardingState } from "@/lib/onboarding/state-machine";
```

- [ ] **Step 2.2 — Run tests, confirm they fail**

```bash
pnpm test:unit -- --reporter=verbose 2>&1 | grep -E "FAIL|PASS|Error|✗|×" | head -30
```

Expected: failures on `SELECT_INTEGRATION` not in `routeStepMap`, `getNextRequiredStep` not returning integration step, etc.

- [ ] **Step 2.3 — Implement experience.ts changes**

In `src/lib/onboarding/experience.ts`, make the following changes:

**1. Update `SetupRouteKey`:**
```ts
export type SetupRouteKey = "welcome" | "goals" | "access" | "integration" | "guardrails" | "ready";
```

**2. Update `REQUIRED_ITEMS` — no change needed.**

**3. Update `stepRouteMap`:**
```ts
export const stepRouteMap: Record<OnboardingStep, SetupRouteKey> = {
  WELCOME: "welcome",
  DEFINE_GOALS: "goals",
  CONFIRM_ACCESS: "access",
  SELECT_INTEGRATION: "integration",
  SET_GUARDRAILS: "guardrails",
  READY: "ready",
};
```

**4. Update `routeStepMap` — insertion order between `access` and `guardrails` is required:**
```ts
export const routeStepMap: Record<SetupRouteKey, OnboardingStep> = {
  welcome: "WELCOME",
  goals: "DEFINE_GOALS",
  access: "CONFIRM_ACCESS",
  integration: "SELECT_INTEGRATION",
  guardrails: "SET_GUARDRAILS",
  ready: "READY",
};
```

**5. Update `stepLabels`:**
```ts
export const stepLabels: Record<OnboardingStep, string> = {
  WELCOME: "Welcome",
  DEFINE_GOALS: "Define your goal",
  CONFIRM_ACCESS: "Confirm workspace access",
  SELECT_INTEGRATION: "Choose operating model",
  SET_GUARDRAILS: "Set starter guardrails",
  READY: "Ready to use",
};
```

**6. Update `getNextRequiredStep`:**
```ts
export function getNextRequiredStep(state: OnboardingState): OnboardingStep {
  if (state.selectedGoals.length === 0) {
    return "DEFINE_GOALS";
  }

  if (!state.workspaceId) {
    return "CONFIRM_ACCESS";
  }

  if (!state.integrationStepCompleted) {
    return "SELECT_INTEGRATION";
  }

  if (!state.guardrailPreset) {
    return "SET_GUARDRAILS";
  }

  return "READY";
}
```

**7. Update `getRequiredCompletionCount`** — stays counting 3 items, no change:
```ts
// No change — counts selectedGoals, workspaceId, guardrailPreset (3 items)
```

**8. Update `getCurrentBlocker`:**
```ts
export function getCurrentBlocker(state: OnboardingState) {
  switch (getNextRequiredStep(state)) {
    case "DEFINE_GOALS":
      return "Choose what you want Keon to manage first.";
    case "CONFIRM_ACCESS":
      return "Confirm the workspace and environment you want to prepare.";
    case "SELECT_INTEGRATION":
      return "Review how Keon governs decisions before continuing.";
    case "SET_GUARDRAILS":
      return "Choose the starter guardrails Keon should apply.";
    case "READY":
      return state.completed ? "Your workspace is ready." : "Review your ready state and enter the workspace overview.";
    default:
      return "Start setup.";
  }
}
```

**9. Add `import { type OnboardingState }` update** — `OnboardingState` already has the new fields from Task 1, no import change needed.

- [ ] **Step 2.4 — Run tests, confirm they pass**

```bash
pnpm test:unit -- --reporter=verbose 2>&1 | grep -E "FAIL|PASS|✓|✗|×" | head -40
```

Expected: all tests pass.

- [ ] **Step 2.5 — Commit**

```bash
git add src/lib/onboarding/experience.ts tests/unit/onboarding/experience.test.ts tests/unit/onboarding/entry-routing.test.ts
git commit -m "feat(onboarding): add integration step to routing and experience helpers"
```

---

## Task 3: Wire `SELECT_INTEGRATION` into `OnboardingFlow`

**Files:**
- Modify: `src/components/onboarding/OnboardingFlow.tsx`

- [ ] **Step 3.1 — Update OnboardingFlow**

In `src/components/onboarding/OnboardingFlow.tsx`, add the import and case:

```tsx
import { IntegrationSelectionStep } from "./steps/integration-selection-step";

// Inside the switch:
case "SELECT_INTEGRATION":
  return <IntegrationSelectionStep />;
```

The full file after changes:

```tsx
"use client";

import { clampVisibleStep } from "@/lib/onboarding/experience";
import { useOnboardingState } from "@/lib/onboarding/store";
import { useSearchParams } from "next/navigation";
import { CompleteStep } from "./steps/complete-step";
import { IntegrationSelectionStep } from "./steps/integration-selection-step";
import { IntentSelectionStep } from "./steps/intent-selection-step";
import { PolicyBaselineStep } from "./steps/policy-baseline-step";
import { ScopeConfirmationStep } from "./steps/scope-confirmation-step";

export function OnboardingFlow() {
  const searchParams = useSearchParams();
  const { state } = useOnboardingState();
  const visibleStep = clampVisibleStep(searchParams.get("step"), state);

  switch (visibleStep) {
    case "DEFINE_GOALS":
      return <IntentSelectionStep />;
    case "CONFIRM_ACCESS":
      return <ScopeConfirmationStep />;
    case "SELECT_INTEGRATION":
      return <IntegrationSelectionStep />;
    case "SET_GUARDRAILS":
      return <PolicyBaselineStep />;
    case "READY":
      return <CompleteStep />;
    default:
      return <IntentSelectionStep />;
  }
}
```

- [ ] **Step 3.2 — Verify TypeScript compiles**

```bash
cd /d/Repos/keon-omega/keon.control.website
pnpm tsc --noEmit 2>&1 | head -30
```

Expected: errors only about the missing `IntegrationSelectionStep` module (file doesn't exist yet). No other errors.

- [ ] **Step 3.3 — Commit**

```bash
git add src/components/onboarding/OnboardingFlow.tsx
git commit -m "feat(onboarding): wire SELECT_INTEGRATION into OnboardingFlow"
```

---

## Task 4: Build `IntegrationSelectionStep` component

**Files:**
- Create: `src/components/onboarding/steps/integration-selection-step.tsx`
- Create: `tests/unit/onboarding/integration-selection-step.test.tsx`

- [ ] **Step 4.1 — Write failing component tests**

Create `tests/unit/onboarding/integration-selection-step.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

// Mock onboarding store
const mockDispatch = vi.fn();
vi.mock("@/lib/onboarding/store", () => ({
  useOnboardingState: () => ({
    state: {
      currentStep: "SELECT_INTEGRATION",
      selectedGoals: ["govern-ai-actions"],
      workspaceId: "tenant_123",
      integrationStepCompleted: false,
      selectedIntegrationMode: undefined,
      guardrailPreset: null,
      completed: false,
    },
    dispatch: mockDispatch,
  }),
}));

import { IntegrationSelectionStep } from "@/components/onboarding/steps/integration-selection-step";

describe("IntegrationSelectionStep", () => {
  it("renders the step title", () => {
    render(<IntegrationSelectionStep />);
    expect(screen.getByText(/how do you want governed decisions to happen/i)).toBeInTheDocument();
  });

  it("renders both option cards", () => {
    render(<IntegrationSelectionStep />);
    expect(screen.getByText("BYO AI")).toBeInTheDocument();
    expect(screen.getByText("Keon Collective")).toBeInTheDocument();
  });

  it("renders the continue button enabled with no selection", () => {
    render(<IntegrationSelectionStep />);
    const btn = screen.getByRole("button", { name: /continue/i });
    expect(btn).not.toBeDisabled();
  });

  it("clicking BYO AI card marks it as selected (aria-pressed)", () => {
    render(<IntegrationSelectionStep />);
    const byoCard = screen.getByRole("button", { name: /byo ai/i });
    fireEvent.click(byoCard);
    expect(byoCard).toHaveAttribute("aria-pressed", "true");
  });

  it("clicking BYO AI then again deselects it", () => {
    render(<IntegrationSelectionStep />);
    const byoCard = screen.getByRole("button", { name: /byo ai/i });
    fireEvent.click(byoCard);
    fireEvent.click(byoCard);
    expect(byoCard).toHaveAttribute("aria-pressed", "false");
  });

  it("clicking Continue dispatches ADVANCE_INTEGRATION", () => {
    render(<IntegrationSelectionStep />);
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "ADVANCE_INTEGRATION" })
    );
  });

  it("dispatches selected mode when a card is clicked before Continue", () => {
    render(<IntegrationSelectionStep />);
    fireEvent.click(screen.getByRole("button", { name: /keon collective/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "ADVANCE_INTEGRATION",
      payload: { selectedMode: "COLLECTIVE" },
    });
  });

  it("renders the 'Watch a decision unfold' CTA", () => {
    render(<IntegrationSelectionStep />);
    expect(screen.getByText(/watch a decision unfold/i)).toBeInTheDocument();
  });

  it("renders the footer reassurance hint", () => {
    render(<IntegrationSelectionStep />);
    expect(screen.getByText(/start with byo ai and upgrade later/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 4.2 — Run tests, confirm they fail**

```bash
pnpm test:unit -- --reporter=verbose tests/unit/onboarding/integration-selection-step.test.tsx 2>&1 | head -30
```

Expected: FAIL — module `@/components/onboarding/steps/integration-selection-step` not found.

- [ ] **Step 4.3 — Implement the component**

Create `src/components/onboarding/steps/integration-selection-step.tsx`:

```tsx
"use client";

import { StepShell } from "@/components/onboarding/step-shell";
import { Button } from "@/components/ui/button";
import { useOnboardingState } from "@/lib/onboarding/store";
import type { IntegrationMode } from "@/lib/onboarding/state-machine";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import * as React from "react";

const COLLECTIVE_SHOWCASE_URL = "/collective/showcase";

export function IntegrationSelectionStep() {
  const router = useRouter();
  const { dispatch } = useOnboardingState();
  const [selected, setSelected] = React.useState<IntegrationMode | undefined>(undefined);

  const toggleCard = (mode: IntegrationMode) => {
    setSelected((prev) => (prev === mode ? undefined : mode));
  };

  const handleContinue = () => {
    dispatch({
      type: "ADVANCE_INTEGRATION",
      ...(selected ? { payload: { selectedMode: selected } } : {}),
    });
    router.replace("/setup?step=guardrails");
  };

  return (
    <StepShell
      eyebrow="Step 3 of 5"
      title="How do you want governed decisions to happen?"
      description="This is not a vendor choice. It determines how Keon evaluates, challenges, and seals every decision."
      footer={
        <div className="flex items-center gap-4">
          <Button size="lg" onClick={handleContinue}>
            Continue
          </Button>
          <p className="font-mono text-xs text-white/32">
            You can start with BYO AI and upgrade later.
          </p>
        </div>
      }
    >
      {/* Super-labels */}
      <div className="grid grid-cols-[1fr_auto_1fr] mb-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/28 pl-0.5">
          Governance Layer
        </span>
        <span />
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/28 pl-0.5">
          Decision System
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
        {/* BYO AI */}
        <button
          type="button"
          role="button"
          aria-pressed={selected === "BYO_AI"}
          aria-label="BYO AI"
          onClick={() => toggleCard("BYO_AI")}
          className={cn(
            "rounded-[24px] border p-7 text-left flex flex-col transition-all duration-200",
            selected === "BYO_AI"
              ? "border-[#B6F09C]/50 bg-[linear-gradient(175deg,rgba(182,240,156,0.08)_0%,rgba(182,240,156,0.03)_100%)]"
              : "border-white/10 bg-white/[0.03] hover:border-white/20"
          )}
        >
          <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[#B6F09C] mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B6F09C]" />
            BYO AI
          </div>
          <div className="font-display text-[22px] font-bold text-white leading-tight mb-2">
            Govern the AI you already use
          </div>
          <div className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#B6F09C]/55 mb-3">
            Best for existing AI stacks
          </div>
          <p className="text-sm leading-[1.72] text-white/62 mb-5 flex-1">
            Route your existing models and providers through Keon&apos;s governance layer via MCP
            Gateway. Every action is intercepted, policy-evaluated, and receipted — without
            replacing your stack.
          </p>
          <ul className="space-y-1.5">
            {[
              "Connect existing providers via MCP Gateway",
              "Fastest path to governed execution",
              "No changes to your model setup",
              "Policy-bound, receipt-verified output",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-[12px] text-white/65 leading-[1.5]">
                <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-white/25" />
                {item}
              </li>
            ))}
          </ul>
        </button>

        {/* Divider */}
        <div className="flex flex-col items-center justify-center gap-1.5 px-4 font-mono text-[9px] uppercase tracking-[0.12em] text-white/20">
          <div className="w-px flex-1 bg-white/8" />
          <span>or</span>
          <div className="w-px flex-1 bg-white/8" />
        </div>

        {/* Collective */}
        <button
          type="button"
          role="button"
          aria-pressed={selected === "COLLECTIVE"}
          aria-label="Keon Collective"
          onClick={() => toggleCard("COLLECTIVE")}
          className={cn(
            "rounded-[24px] border p-7 text-left flex flex-col transition-all duration-200",
            selected === "COLLECTIVE"
              ? "border-[#7EE8E0]/50 bg-[linear-gradient(175deg,rgba(126,232,224,0.12)_0%,rgba(126,232,224,0.04)_60%)]"
              : "border-[#7EE8E0]/28 bg-[linear-gradient(175deg,rgba(126,232,224,0.07)_0%,rgba(126,232,224,0.02)_60%,rgba(6,17,23,0.2)_100%)]"
          )}
        >
          <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[#7EE8E0] mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7EE8E0]" />
            Keon Collective
          </div>
          <div className="font-display text-[22px] font-bold text-white leading-tight mb-2">
            Deliberation, not generation
          </div>
          <div className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#7EE8E0]/45 mb-3">
            For high-stakes decisions that demand more than one output
          </div>
          <p className="text-sm leading-[1.72] text-white/62 mb-5 flex-1">
            Replace single-model output with a governed deliberation process. Proposals branch,
            face adversarial challenge, converge through voting, and collapse into a
            cryptographically sealed outcome.
          </p>
          <ul className="space-y-1.5 mb-5">
            {[
              "Branching analysis across multiple agents",
              "Built-in adversarial challenge phase",
              "Convergence via weighted vote",
              "Cryptographically sealed, append-only outcome",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-[12px] text-white/65 leading-[1.5]">
                <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-[#7EE8E0]/45" />
                {item}
              </li>
            ))}
          </ul>

          {/* Micro-preview */}
          <MicroPreview />

          {/* CTA */}
          <a
            href={COLLECTIVE_SHOWCASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-auto inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#7EE8E0] border border-[#7EE8E0]/28 rounded-[6px] px-4 py-2 bg-[#7EE8E0]/05 hover:bg-[#7EE8E0]/11 hover:border-[#7EE8E0]/48 transition-colors"
          >
            Watch a decision unfold{" "}
            <span className="text-[11px]" aria-hidden>↗</span>
          </a>
        </button>
      </div>
    </StepShell>
  );
}

function MicroPreview() {
  return (
    <div className="rounded-[14px] border border-[#7EE8E0]/14 bg-[#040c12]/70 px-3.5 py-3.5 mb-5">
      <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#7EE8E0]/38 mb-3">
        Deliberation lifecycle
      </div>
      <div className="flex flex-col items-center gap-0">
        {/* Intent node */}
        <div className="rounded-[6px] border border-[#7EE8E0]/30 bg-[#7EE8E0]/10 px-3.5 py-1 font-mono text-[8.5px] uppercase tracking-[0.1em] text-[#7EE8E0]/75 z-10">
          Intent submitted
        </div>

        {/* Travel line */}
        <div className="w-px h-2.5 bg-[#7EE8E0]/18" />

        {/* Horizontal spread */}
        <div className="w-44 h-px bg-gradient-to-r from-transparent via-[#7EE8E0]/20 to-transparent" />

        {/* Branches */}
        <div className="flex w-full justify-center gap-1.5">
          {(
            [
              { label: "Branch A\nProceed", variant: "default" },
              { label: "Adversarial\nChallenge", variant: "adversarial" },
              { label: "Branch C\nSynthesize", variant: "default" },
            ] as const
          ).map(({ label, variant }) => (
            <div key={label} className="flex flex-col items-center flex-1 max-w-[78px]">
              <div className="w-px h-2 bg-[#7EE8E0]/15" />
              <div
                className={cn(
                  "rounded-[5px] px-1.5 py-1 font-mono text-[7.5px] uppercase tracking-[0.06em] text-center whitespace-pre-line border leading-[1.4]",
                  variant === "adversarial"
                    ? "border-[#F4D35E]/45 text-[#F4D35E]/85 bg-[#F4D35E]/07 animate-[adv-pulse_2.8s_ease-in-out_infinite]"
                    : "border-white/10 text-white/45"
                )}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Converge bar */}
        <div className="w-44 h-px bg-gradient-to-r from-transparent via-[#7EE8E0]/18 to-transparent mt-1" />
        <div className="w-px h-2 bg-[#7EE8E0]/18" />

        {/* Sealed node */}
        <div className="flex items-center gap-1.5 rounded-[6px] border border-[#7EE8E0]/38 bg-[#7EE8E0]/09 px-3 py-1 font-mono text-[8.5px] uppercase tracking-[0.12em] text-[#7EE8E0]/88 animate-[seal-snap_3.6s_ease-in-out_infinite]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7EE8E0] animate-[dot-snap_3.6s_ease-in-out_infinite]" />
          Sealed · Receipt issued
        </div>
      </div>
    </div>
  );
}
```

Add the CSS keyframes to `src/app/globals.css` (or wherever the project's global styles live — check for an existing globals file):

```css
@keyframes adv-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(244,211,94,0); }
  45%  { box-shadow: 0 0 0 3px rgba(244,211,94,0.10); }
  55%  { box-shadow: 0 0 5px 2px rgba(244,211,94,0.14); }
}

@keyframes seal-snap {
  0%, 60% { box-shadow: 0 0 0 0 rgba(126,232,224,0); opacity: 0.4; }
  72%  { box-shadow: 0 0 0 4px rgba(126,232,224,0.12); opacity: 1; transform: scale(1.02); }
  80%  { box-shadow: 0 0 8px 2px rgba(126,232,224,0.16); opacity: 1; transform: scale(1); }
  95%, 100% { box-shadow: 0 0 0 0 rgba(126,232,224,0); opacity: 0.8; }
}

@keyframes dot-snap {
  0%, 65% { opacity: 0.3; transform: scale(0.7); }
  73%  { opacity: 1; transform: scale(1.3); }
  80%, 100% { opacity: 1; transform: scale(1); }
}
```

- [ ] **Step 4.4 — Check where globals.css lives, add keyframes**

```bash
find /d/Repos/keon-omega/keon.control.website/src/app -name "globals.css" | head -3
```

Open the file found and append the three keyframes above at the end.

- [ ] **Step 4.5 — Run component tests**

```bash
pnpm test:unit -- --reporter=verbose tests/unit/onboarding/integration-selection-step.test.tsx 2>&1 | head -40
```

Expected: all 9 tests pass.

- [ ] **Step 4.6 — Run full test suite**

```bash
pnpm test:unit 2>&1 | tail -20
```

Expected: all tests pass with no regressions.

- [ ] **Step 4.7 — Commit**

```bash
git add src/components/onboarding/steps/integration-selection-step.tsx src/app/globals.css tests/unit/onboarding/integration-selection-step.test.tsx
git commit -m "feat(onboarding): add IntegrationSelectionStep with Collective micro-preview"
```

---

## Task 5: Build Collective showcase page

**Files:**
- Create: `src/app/collective/showcase/page.tsx`

- [ ] **Step 5.1 — Create showcase route**

Create `src/app/collective/showcase/page.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import Image from "next/image";

const LIFECYCLE_STEPS = [
  { n: "01", label: "Proposal" },
  { n: "02", label: "Branch" },
  { n: "03", label: "Adversarial" },
  { n: "04", label: "Vote" },
  { n: "05", label: "Collapse" },
  { n: "06", label: "Sealed" },
] as const;

const FEATURE_TAGS = [
  "Temporal Branching",
  "Adversarial Self-Review",
  "Vote + Collapse",
  "Cryptographic Seal",
  "Append-Only Ledger",
] as const;

const METRICS = [
  { value: "3", label: "Active Branches" },
  { value: "12", label: "Sealed Decisions" },
  { value: "100%", label: "Governance Coverage" },
  { value: "0", label: "Ungoverned Actions" },
] as const;

export default function CollectiveShowcasePage() {
  const router = useRouter();

  const handleClose = () => {
    if (typeof window !== "undefined" && window.opener) {
      window.close();
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-[#070d14] text-[#C5C6C7]">
      {/* Topbar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-12 items-center justify-between border-b border-[#1e2d3d] bg-[#0d1520]/92 px-5 backdrop-blur-md">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#7EE8E0]">
          Keon Control
        </span>
        <button
          type="button"
          onClick={handleClose}
          className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 hover:text-white/70 transition-colors"
        >
          ← Close tab
        </button>
      </header>

      <main className="pt-12">
        {/* Hero */}
        <section className="relative min-h-[520px] flex items-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25"
            style={{ backgroundImage: "url('/images/keon-orbit-2.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070d14] via-[#070d14]/80 to-transparent" />

          <div className="relative z-10 max-w-5xl mx-auto w-full px-10 py-16">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#7EE8E0] mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7EE8E0]" />
              Keon Collective
              <span className="text-white/30 mx-1">·</span>
              Group Cognition Layer
            </div>

            <h1 className="font-display text-5xl font-bold text-white leading-tight mb-6 max-w-xl">
              Decisions that{" "}
              <span className="text-[#7EE8E0]">transcend</span>{" "}
              the individual.
            </h1>

            <p className="text-base leading-7 text-white/68 max-w-lg mb-8">
              AI proposals don&apos;t just execute. They branch across multiple entities, face
              adversarial challenge, collect votes, and collapse into cryptographically-sealed
              outcomes — governed decisions no single system could reach alone.
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {FEATURE_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[9px] uppercase tracking-[0.14em] border border-[#7EE8E0]/30 text-[#7EE8E0]/75 rounded-full px-3 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>

            <a
              href="/collective"
              className="inline-flex items-center h-11 px-6 rounded-[8px] bg-[#7EE8E0] text-[#061117] font-mono text-[11px] uppercase tracking-[0.18em] font-bold hover:bg-[#9ff0e8] transition-colors"
            >
              Activate Collective →
            </a>
          </div>
        </section>

        {/* Metrics bar */}
        <div className="border-y border-[#1e2d3d] bg-[#0a1118]">
          <div className="max-w-5xl mx-auto px-10 py-5 grid grid-cols-4 divide-x divide-[#1e2d3d]">
            {METRICS.map(({ value, label }) => (
              <div key={label} className="px-6 first:pl-0 last:pr-0">
                <div className="font-display text-3xl font-bold text-white">{value}</div>
                <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/40 mt-1">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lifecycle diagram */}
        <section className="max-w-5xl mx-auto px-10 py-16">
          <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/35 mb-8 text-center">
            How Collective works — the deliberation lifecycle
          </div>
          <div className="relative flex items-center justify-between">
            {/* Connecting line */}
            <div className="absolute left-0 right-0 top-1/2 h-px bg-[#7EE8E0]/20 -translate-y-1/2" />
            {LIFECYCLE_STEPS.map(({ n, label }, i) => (
              <div key={n} className="relative flex flex-col items-center gap-3">
                <div
                  className={`h-11 w-11 rounded-full border flex items-center justify-center font-mono text-xs font-bold ${
                    i === 2
                      ? "border-[#7EE8E0] bg-[#7EE8E0] text-[#061117]"
                      : "border-[#7EE8E0]/30 bg-[#070d14] text-[#7EE8E0]/60"
                  }`}
                >
                  {n}
                </div>
                <span
                  className={`font-mono text-[9px] uppercase tracking-[0.15em] ${
                    i === 2 ? "text-[#7EE8E0]" : "text-white/35"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Deliberation tree */}
        <section className="max-w-5xl mx-auto px-10 pb-16">
          <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/35 mb-8 text-center">
            Live deliberation — Deploy inference model v3.1 to production
          </div>

          <div className="flex flex-col items-center gap-4">
            {/* Intent */}
            <div className="w-full max-w-xl border border-[#1e2d3d] bg-[#0e1520] rounded-[8px] p-4">
              <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/35 mb-1">
                Intent · submitted 14m ago
              </div>
              <div className="text-sm text-white/80">
                Deploy inference model v3.1 to production cluster
              </div>
            </div>

            <div className="w-px h-4 bg-[#7EE8E0]/20" />

            {/* Branches */}
            <div className="grid grid-cols-3 gap-3 w-full">
              {[
                {
                  id: "A",
                  verdict: "Proceed",
                  body: "Drift within acceptable tolerance. Deploy immediately.",
                  proceed: 62,
                  hold: 38,
                  variant: "neutral",
                },
                {
                  id: "B",
                  verdict: "Adversarial Challenge",
                  body: "p99 latency spike in staging. Risk score 0.74 — defer pending investigation.",
                  proceed: 44,
                  hold: 56,
                  variant: "adversarial",
                },
                {
                  id: "C",
                  verdict: "Synthesized",
                  body: "Proceed — bind p99 < 180ms monitoring alert as execution condition.",
                  proceed: 81,
                  hold: 19,
                  variant: "neutral",
                },
              ].map(({ id, verdict, body, proceed, hold, variant }) => (
                <div
                  key={id}
                  className={`border rounded-[8px] p-4 ${
                    variant === "adversarial"
                      ? "border-[#F4D35E]/30 bg-[#F4D35E]/05"
                      : "border-[#1e2d3d] bg-[#0e1520]"
                  }`}
                >
                  <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-white/35 mb-1">
                    Branch {id} · {verdict}
                  </div>
                  <p className="text-[12px] leading-[1.6] text-white/65 mb-3">{body}</p>
                  <div className="h-0.5 bg-[#1e2d3d] rounded-full overflow-hidden mb-1">
                    <div
                      className={`h-full rounded-full ${
                        variant === "adversarial" ? "bg-[#F4D35E]/60" : "bg-[#7EE8E0]/50"
                      }`}
                      style={{ width: `${proceed}%` }}
                    />
                  </div>
                  <div className="flex justify-between font-mono text-[8px] text-white/30">
                    <span>{proceed}% proceed</span>
                    <span>{hold}% hold</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="w-px h-4 bg-[#7EE8E0]/20" />

            {/* Sealed */}
            <div className="w-full max-w-xl border border-[#7EE8E0]/25 bg-[#7EE8E0]/05 rounded-[8px] p-4">
              <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#7EE8E0]/60 mb-2">
                Collapsed · Sealed · Receipt #C-4421
              </div>
              <div className="flex items-start gap-2 text-sm text-white/80">
                <span className="text-[#7EE8E0] mt-0.5">✓</span>
                Proceed with p99 &lt; 180ms monitoring alert bound. Branch C adopted. Execution authorized.
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 5.2 — Verify TypeScript compiles clean**

```bash
pnpm tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5.3 — Run full test suite to confirm no regressions**

```bash
pnpm test:unit 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 5.4 — Commit**

```bash
git add src/app/collective/showcase/page.tsx
git commit -m "feat(collective): add showcase page as new-tab destination from onboarding"
```

---

## Task 6: Commit all remaining working-tree changes and verify

**Context:** The working tree has pre-existing uncommitted changes (onboarding text updates, router navigation, test-mode banner, control page labels, sidebar visibility logic). These need to be committed to keep the branch clean.

- [ ] **Step 6.1 — Check what's still uncommitted**

```bash
git status --short
```

Review the list. The expected uncommitted files include:
- `src/components/onboarding/steps/intent-selection-step.tsx`
- `src/components/onboarding/steps/scope-confirmation-step.tsx`
- `src/components/onboarding/steps/policy-baseline-step.tsx`
- `src/app/control/page.tsx`
- `src/components/layout/sidebar.tsx`
- `src/components/layout/topbar.tsx`
- `src/lib/control-plane/tenant-binding.tsx`
- `src/lib/control-plane/tenant-context.tsx`
- (and others)

- [ ] **Step 6.2 — Update `complete-step.tsx` goal labels**

In `src/components/onboarding/steps/complete-step.tsx`, update the `goalLabels` map (lines 9–13) to match the new names:

```ts
const goalLabels: Record<string, string> = {
  "govern-ai-actions": "Governance Runtime",
  "memory-and-context": "Cortex",
  "oversight-and-collaboration": "Collective",
};
```

- [ ] **Step 6.3 — Run full test suite one final time**

```bash
pnpm test:unit 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 6.4 — Commit pre-existing working-tree changes**

```bash
git add src/components/onboarding/steps/intent-selection-step.tsx \
        src/components/onboarding/steps/scope-confirmation-step.tsx \
        src/components/onboarding/steps/policy-baseline-step.tsx \
        src/components/onboarding/steps/complete-step.tsx \
        src/app/control/page.tsx \
        src/components/layout/sidebar.tsx \
        src/components/layout/topbar.tsx
git commit -m "feat(onboarding): update goal labels, routing navigation, test-mode banner, sidebar visibility"
```

For any remaining modified files (lib files, other components), review and commit appropriately:

```bash
git add src/lib/control-plane/ src/lib/collective/ src/lib/server/ src/lib/activation/
git commit -m "chore: commit remaining working-tree changes from previous session"
```

- [ ] **Step 6.5 — Final git status check**

```bash
git status --short && git log --oneline -8
```

Expected: clean working tree (or only intentionally untracked files like `.tmp/`, `test-results/`).
