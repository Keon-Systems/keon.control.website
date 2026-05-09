import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Stable mock references
const mockReplace = vi.fn();
const mockDispatch = vi.fn();

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// Mock onboarding store
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

beforeEach(() => {
  mockDispatch.mockClear();
  mockReplace.mockClear();
});

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

  it("disables the continue button until a mode is selected", () => {
    render(<IntegrationSelectionStep />);
    const btn = screen.getByRole("button", { name: /continue/i });
    expect(btn).toBeDisabled();
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

  it("clicking Continue dispatches ADVANCE_INTEGRATION after selecting a mode", () => {
    render(<IntegrationSelectionStep />);
    fireEvent.click(screen.getByRole("button", { name: /byo ai/i }));
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

  it("clicking Continue routes to lifecycle-preview, not guardrails", () => {
    render(<IntegrationSelectionStep />);
    fireEvent.click(screen.getByRole("button", { name: /byo ai/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(mockReplace).toHaveBeenCalledWith("/setup?step=lifecycle-preview");
  });

  it("renders the 'Watch a decision unfold' CTA", () => {
    render(<IntegrationSelectionStep />);
    expect(screen.getByText(/watch a decision unfold/i)).toBeInTheDocument();
  });

  it("renders the select-a-mode hint when nothing is selected", () => {
    render(<IntegrationSelectionStep />);
    expect(screen.getByText(/select an operating model to continue/i)).toBeInTheDocument();
  });

  it("renders the reassurance hint after selecting BYO AI", () => {
    render(<IntegrationSelectionStep />);
    fireEvent.click(screen.getByRole("button", { name: /byo ai/i }));
    expect(screen.getByText(/start with byo ai and upgrade later/i)).toBeInTheDocument();
  });
});
