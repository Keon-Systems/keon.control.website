import { describe, expect, it } from "vitest";
import { defaultOnboardingState, transitionOnboardingState } from "./state-machine";

describe("transitionOnboardingState", () => {
  it("moves through the happy path in order", () => {
    const started = transitionOnboardingState(defaultOnboardingState, { type: "BEGIN_SETUP" });
    const withIntent = transitionOnboardingState(started, {
      type: "SAVE_INTENT_SELECTION",
      payload: { selectedIntent: ["govern-ai-actions"] },
    });
    const withScope = transitionOnboardingState(withIntent, {
      type: "CONFIRM_SCOPE",
      payload: { tenantId: "tenant_123" },
    });
    const withPolicy = transitionOnboardingState(withScope, {
      type: "APPLY_POLICY_BASELINE",
      payload: { policyBaseline: "balanced" },
    });
    const readyToFinish = transitionOnboardingState(withPolicy, { type: "COMPLETE_FIRST_GOVERNED_ACTION" });
    const completed = transitionOnboardingState(readyToFinish, { type: "FINISH_ONBOARDING" });

    expect(completed).toMatchObject({
      currentStep: "COMPLETE",
      selectedIntent: ["govern-ai-actions"],
      tenantId: "tenant_123",
      policyBaseline: "balanced",
      completed: true,
    });
  });

  it("does not skip ahead without required data", () => {
    const skipped = transitionOnboardingState(defaultOnboardingState, {
      type: "APPLY_POLICY_BASELINE",
      payload: { policyBaseline: "strict" },
    });

    expect(skipped).toEqual(defaultOnboardingState);
  });

  it("requires at least one selected intent", () => {
    const started = transitionOnboardingState(defaultOnboardingState, { type: "BEGIN_SETUP" });
    const unchanged = transitionOnboardingState(started, {
      type: "SAVE_INTENT_SELECTION",
      payload: { selectedIntent: [] },
    });

    expect(unchanged.currentStep).toBe("INTENT_SELECTION");
  });

  it("normalizes completed hydrated state to the final step", () => {
    const hydrated = transitionOnboardingState(defaultOnboardingState, {
      type: "HYDRATE",
      payload: {
        currentStep: "FIRST_GOVERNED_ACTION",
        selectedIntent: ["memory-and-context"],
        tenantId: "tenant_456",
        policyBaseline: "flexible",
        completed: true,
      },
    });

    expect(hydrated.currentStep).toBe("COMPLETE");
    expect(hydrated.completed).toBe(true);
  });
});
