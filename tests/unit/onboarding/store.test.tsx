import { OnboardingStateProvider, useOnboardingState } from "@/lib/onboarding/store";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

const storageKey = "keon.onboarding.state";

function FinishProbe() {
  const { hydrated, finishOnboarding } = useOnboardingState();

  return (
    <button
      type="button"
      disabled={!hydrated}
      onClick={() => {
        finishOnboarding();
        const raw = window.localStorage.getItem(storageKey);
        const completed = raw ? JSON.parse(raw).completed : false;
        document.body.dataset.completedImmediately = String(completed);
      }}
    >
      Finish
    </button>
  );
}

describe("OnboardingStateProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.body.dataset.completedImmediately;
  });

  it("persists onboarding completion before post-setup navigation can hard reload", async () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        currentStep: "READY",
        selectedGoals: ["govern-ai-actions"],
        workspaceId: "ten_keon_internal_test",
        integrationStepCompleted: true,
        selectedIntegrationMode: "BYO_AI",
        lifecyclePreviewSeen: true,
        guardrailPreset: "balanced",
        completed: false,
      })
    );

    render(
      <OnboardingStateProvider>
        <FinishProbe />
      </OnboardingStateProvider>
    );

    const button = await screen.findByRole("button", { name: "Finish" });
    await act(async () => {
      await userEvent.click(button);
    });

    expect(document.body.dataset.completedImmediately).toBe("true");
  });
});
