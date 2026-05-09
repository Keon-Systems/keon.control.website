import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SetupChecklist } from "@/components/onboarding/setup-checklist";
import { defaultOnboardingState } from "@/lib/onboarding/state-machine";

const mockUseOnboardingState = vi.fn(() => ({ state: defaultOnboardingState }));

vi.mock("@/lib/onboarding/store", () => ({
  useOnboardingState: () => mockUseOnboardingState(),
}));

describe("SetupChecklist — upcoming items", () => {
  it("renders upcoming required items as aria-disabled divs, not links", () => {
    mockUseOnboardingState.mockReturnValue({ state: defaultOnboardingState });
    render(<SetupChecklist />);
    const disabledItems = document
      .querySelectorAll('[aria-disabled="true"]');
    expect(disabledItems.length).toBeGreaterThan(0);
    disabledItems.forEach((item) => {
      expect(item.tagName.toLowerCase()).not.toBe("a");
    });
  });

  it("renders the current required item as a navigable link", () => {
    mockUseOnboardingState.mockReturnValue({ state: defaultOnboardingState });
    render(<SetupChecklist />);
    // With defaultOnboardingState (no goals set), the first required item is "current"
    const goalsLink = screen.getByRole("link", { name: /define your goal/i });
    expect(goalsLink).toBeInTheDocument();
    expect(goalsLink).toHaveAttribute("href", "/setup?step=goals");
  });

  it("does not render any upcoming items as anchor elements", () => {
    mockUseOnboardingState.mockReturnValue({ state: defaultOnboardingState });
    render(<SetupChecklist />);
    const allAnchors = document.querySelectorAll("a");
    const ariaDisabledAnchors = Array.from(allAnchors).filter(
      (a) => a.getAttribute("aria-disabled") === "true"
    );
    expect(ariaDisabledAnchors.length).toBe(0);
  });
});

describe("SetupChecklist — lifecycle preview interlude", () => {
  it("shows an interlude card when currentStep is LIFECYCLE_PREVIEW and preview not yet seen", () => {
    mockUseOnboardingState.mockReturnValue({
      state: {
        currentStep: "LIFECYCLE_PREVIEW",
        selectedGoals: ["govern-ai-actions"],
        workspaceId: "tenant_123",
        integrationStepCompleted: true,
        selectedIntegrationMode: "BYO_AI",
        lifecyclePreviewSeen: false,
        guardrailPreset: null,
        completed: false,
      },
    });
    render(<SetupChecklist />);
    expect(screen.getByText(/reviewing governance lifecycle/i)).toBeInTheDocument();
  });

  it("does not show the interlude when lifecyclePreviewSeen is true", () => {
    mockUseOnboardingState.mockReturnValue({
      state: {
        currentStep: "SET_GUARDRAILS",
        selectedGoals: ["govern-ai-actions"],
        workspaceId: "tenant_123",
        integrationStepCompleted: true,
        selectedIntegrationMode: "BYO_AI",
        lifecyclePreviewSeen: true,
        guardrailPreset: null,
        completed: false,
      },
    });
    render(<SetupChecklist />);
    expect(screen.queryByText(/reviewing governance lifecycle/i)).not.toBeInTheDocument();
  });

  it("checklist still reports 4 required steps, not 5, during LIFECYCLE_PREVIEW state", () => {
    mockUseOnboardingState.mockReturnValue({
      state: {
        currentStep: "LIFECYCLE_PREVIEW",
        selectedGoals: ["govern-ai-actions"],
        workspaceId: "tenant_123",
        integrationStepCompleted: true,
        selectedIntegrationMode: "BYO_AI",
        lifecyclePreviewSeen: false,
        guardrailPreset: null,
        completed: false,
      },
    });
    render(<SetupChecklist />);
    // The readiness label should show 3/4 (goals + workspace + integration done), not 3/5
    expect(screen.getByText(/3\/4/i)).toBeInTheDocument();
    // Lifecycle preview must not appear as a required checklist item
    expect(screen.queryByText(/see how decisions are governed/i)).not.toBeInTheDocument();
  });
});
