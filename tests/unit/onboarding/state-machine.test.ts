import { describe, expect, it } from "vitest";
import { defaultOnboardingState, sanitizeOnboardingState, transitionOnboardingState, type OnboardingState } from "@/lib/onboarding/state-machine";

describe("transitionOnboardingState", () => {
  it("moves through the happy path in order", () => {
    const started = transitionOnboardingState(defaultOnboardingState, { type: "START_SETUP" });
    const withGoals = transitionOnboardingState(started, {
      type: "SAVE_GOALS",
      payload: { selectedGoals: ["govern-ai-actions"] },
    });
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
    const completed = transitionOnboardingState(readyToFinish, { type: "FINISH_ONBOARDING" });

    expect(completed).toMatchObject({
      currentStep: "READY",
      selectedGoals: ["govern-ai-actions"],
      workspaceId: "tenant_123",
      guardrailPreset: "balanced",
      completed: true,
    });
  });

  it("does not skip ahead without required data", () => {
    const skipped = transitionOnboardingState(defaultOnboardingState, {
      type: "APPLY_GUARDRAILS",
      payload: { guardrailPreset: "strict" },
    });

    expect(skipped).toEqual(defaultOnboardingState);
  });

  it("requires at least one selected goal", () => {
    const started = transitionOnboardingState(defaultOnboardingState, { type: "START_SETUP" });
    const unchanged = transitionOnboardingState(started, {
      type: "SAVE_GOALS",
      payload: { selectedGoals: [] },
    });

    expect(unchanged.currentStep).toBe("DEFINE_GOALS");
  });

  it("normalizes completed hydrated state to the final step", () => {
    const hydrated = transitionOnboardingState(defaultOnboardingState, {
      type: "HYDRATE",
      payload: {
        currentStep: "SET_GUARDRAILS",
        selectedGoals: ["memory-and-context"],
        workspaceId: "tenant_456",
        guardrailPreset: "flexible",
        completed: true,
      },
    });

    expect(hydrated.currentStep).toBe("READY");
    expect(hydrated.completed).toBe(true);
  });
});

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

  it("ADVANCE_INTEGRATION without a mode is rejected — mode is now required", () => {
    const next = transitionOnboardingState(afterAccess, { type: "ADVANCE_INTEGRATION" });
    expect(next.currentStep).toBe("SELECT_INTEGRATION"); // no change
    expect(next.integrationStepCompleted).toBe(false);   // no change
  });

  it("rejects ADVANCE_INTEGRATION when no integration mode is selected", () => {
    const state: OnboardingState = {
      ...defaultOnboardingState,
      currentStep: "SELECT_INTEGRATION",
      selectedGoals: ["govern-ai-actions"],
      workspaceId: "tenant_123",
      integrationStepCompleted: false,
      selectedIntegrationMode: undefined,
    };
    const result = transitionOnboardingState(state, { type: "ADVANCE_INTEGRATION" });
    expect(result).toEqual(state);
  });

  it("accepts ADVANCE_INTEGRATION when a mode is provided", () => {
    const state: OnboardingState = {
      ...defaultOnboardingState,
      currentStep: "SELECT_INTEGRATION",
      selectedGoals: ["govern-ai-actions"],
      workspaceId: "tenant_123",
      integrationStepCompleted: false,
      selectedIntegrationMode: undefined,
    };
    const result = transitionOnboardingState(state, {
      type: "ADVANCE_INTEGRATION",
      payload: { selectedMode: "BYO_AI" },
    });
    expect(result.currentStep).toBe("SET_GUARDRAILS");
    expect(result.integrationStepCompleted).toBe(true);
    expect(result.selectedIntegrationMode).toBe("BYO_AI");
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

  it("ADVANCE_INTEGRATION is a no-op when not at SELECT_INTEGRATION step", () => {
    const atReady: OnboardingState = {
      ...defaultOnboardingState,
      currentStep: "READY",
      workspaceId: "tenant_123",
      integrationStepCompleted: true,
      guardrailPreset: "balanced",
      completed: true,
    };
    const unchanged = transitionOnboardingState(atReady, { type: "ADVANCE_INTEGRATION" });
    expect(unchanged.currentStep).toBe("READY");
    expect(unchanged.integrationStepCompleted).toBe(true);
  });
});
