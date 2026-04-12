import { describe, expect, it } from "vitest";
import { clampVisibleStep, getCurrentBlocker, getChecklistItems, getReadinessLabel, getNextRequiredStep } from "@/lib/onboarding/experience";
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

describe("onboarding experience helpers", () => {
  it("reports in-progress readiness clearly", () => {
    expect(getReadinessLabel(defaultOnboardingState)).toBe("0/3 required steps complete");
    expect(getCurrentBlocker(defaultOnboardingState)).toMatch(/choose what you want keon to manage first/i);
  });

  it("marks required steps complete before ready state", () => {
    const state = {
      ...defaultOnboardingState,
      currentStep: "READY" as const,
      selectedGoals: ["govern-ai-actions"] as const,
      workspaceId: "tenant_123",
      guardrailPreset: "balanced" as const,
    };

    const checklist = getChecklistItems(state);
    expect(checklist.required.every((item) => item.status === "complete")).toBe(true);
    expect(getReadinessLabel({ ...state, completed: true })).toBe("Ready to use");
  });
});
