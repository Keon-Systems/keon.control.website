import { describe, expect, it } from "vitest";
import { clampVisibleStep, getCurrentBlocker, getChecklistItems, getReadinessLabel, getNextRequiredStep, isLifecyclePreviewInterlude, stepRouteMap, routeStepMap } from "@/lib/onboarding/experience";
import { defaultOnboardingState, type OnboardingState } from "@/lib/onboarding/state-machine";

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

  it("getNextRequiredStep returns LIFECYCLE_PREVIEW when integration complete but preview not seen", () => {
    const advanced: OnboardingState = {
      ...afterAccess,
      integrationStepCompleted: true,
      lifecyclePreviewSeen: false,
      currentStep: "LIFECYCLE_PREVIEW",
    };
    expect(getNextRequiredStep(advanced)).toBe("LIFECYCLE_PREVIEW");
  });

  it("getNextRequiredStep returns SET_GUARDRAILS once integration complete and preview seen", () => {
    const advanced: OnboardingState = {
      ...afterAccess,
      integrationStepCompleted: true,
      lifecyclePreviewSeen: true,
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

  it("checklist has 4 required items", () => {
    const complete: OnboardingState = {
      ...defaultOnboardingState,
      currentStep: "READY",
      selectedGoals: ["govern-ai-actions"],
      workspaceId: "tenant_123",
      integrationStepCompleted: true,
      lifecyclePreviewSeen: true,
      guardrailPreset: "balanced",
    };
    const { required } = getChecklistItems(complete);
    expect(required).toHaveLength(4);
    expect(required.every((item) => item.status === "complete")).toBe(true);
  });
});

describe("onboarding experience helpers", () => {
  it("reports in-progress readiness clearly", () => {
    expect(getReadinessLabel(defaultOnboardingState)).toBe("0/4 required steps complete");
    expect(getCurrentBlocker(defaultOnboardingState)).toMatch(/choose what you want keon to manage first/i);
  });

  it("marks required steps complete before ready state", () => {
    const state = {
      ...defaultOnboardingState,
      currentStep: "READY" as const,
      selectedGoals: ["govern-ai-actions"] as const,
      workspaceId: "tenant_123",
      integrationStepCompleted: true,
      lifecyclePreviewSeen: true,
      guardrailPreset: "balanced" as const,
    };

    const checklist = getChecklistItems(state);
    expect(checklist.required.every((item) => item.status === "complete")).toBe(true);
    expect(getReadinessLabel({ ...state, completed: true })).toBe("Basic setup complete");
  });
});

describe("isLifecyclePreviewInterlude", () => {
  it("isLifecyclePreviewInterlude returns true when integration complete and preview not seen", () => {
    const state: OnboardingState = {
      ...defaultOnboardingState,
      integrationStepCompleted: true,
      lifecyclePreviewSeen: false,
    };
    expect(isLifecyclePreviewInterlude(state)).toBe(true);
  });

  it("isLifecyclePreviewInterlude returns false when preview has been seen", () => {
    const state: OnboardingState = {
      ...defaultOnboardingState,
      integrationStepCompleted: true,
      lifecyclePreviewSeen: true,
    };
    expect(isLifecyclePreviewInterlude(state)).toBe(false);
  });

  it("isLifecyclePreviewInterlude returns false when integration not yet complete", () => {
    const state: OnboardingState = {
      ...defaultOnboardingState,
      integrationStepCompleted: false,
      lifecyclePreviewSeen: false,
    };
    expect(isLifecyclePreviewInterlude(state)).toBe(false);
  });
});

describe("LIFECYCLE_PREVIEW routing", () => {
  it("stepRouteMap maps LIFECYCLE_PREVIEW to 'lifecycle-preview'", () => {
    expect(stepRouteMap["LIFECYCLE_PREVIEW"]).toBe("lifecycle-preview");
  });

  it("routeStepMap maps 'lifecycle-preview' to LIFECYCLE_PREVIEW", () => {
    expect(routeStepMap["lifecycle-preview"]).toBe("LIFECYCLE_PREVIEW");
  });

  it("getNextRequiredStep returns LIFECYCLE_PREVIEW when integration is complete but preview not yet seen", () => {
    const state: OnboardingState = {
      ...defaultOnboardingState,
      selectedGoals: ["govern-ai-actions"],
      workspaceId: "tenant_123",
      integrationStepCompleted: true,
      lifecyclePreviewSeen: false,
    };
    expect(getNextRequiredStep(state)).toBe("LIFECYCLE_PREVIEW");
  });

  it("getNextRequiredStep returns SET_GUARDRAILS when preview has been seen and no guardrail set", () => {
    const state: OnboardingState = {
      ...defaultOnboardingState,
      selectedGoals: ["govern-ai-actions"],
      workspaceId: "tenant_123",
      integrationStepCompleted: true,
      lifecyclePreviewSeen: true,
      guardrailPreset: null,
    };
    expect(getNextRequiredStep(state)).toBe("SET_GUARDRAILS");
  });

  it("clampVisibleStep clamps 'guardrails' back to LIFECYCLE_PREVIEW when preview not yet seen", () => {
    const state: OnboardingState = {
      ...defaultOnboardingState,
      selectedGoals: ["govern-ai-actions"],
      workspaceId: "tenant_123",
      integrationStepCompleted: true,
      lifecyclePreviewSeen: false,
    };
    const clamped = clampVisibleStep("guardrails", state);
    expect(clamped).toBe("LIFECYCLE_PREVIEW");
  });

  it("clampVisibleStep allows 'guardrails' once preview has been seen", () => {
    const state: OnboardingState = {
      ...defaultOnboardingState,
      selectedGoals: ["govern-ai-actions"],
      workspaceId: "tenant_123",
      integrationStepCompleted: true,
      lifecyclePreviewSeen: true,
    };
    const clamped = clampVisibleStep("guardrails", state);
    expect(clamped).toBe("SET_GUARDRAILS");
  });

  it("getCurrentBlocker returns distinct copy for LIFECYCLE_PREVIEW", () => {
    const state: OnboardingState = {
      ...defaultOnboardingState,
      selectedGoals: ["govern-ai-actions"],
      workspaceId: "tenant_123",
      integrationStepCompleted: true,
      lifecyclePreviewSeen: false,
    };
    expect(getCurrentBlocker(state)).toBe(
      "Review the decision governance lifecycle before continuing to guardrails."
    );
  });
});
