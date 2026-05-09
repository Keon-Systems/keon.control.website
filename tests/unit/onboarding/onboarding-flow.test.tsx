import { render, screen } from "@testing-library/react";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { describe, expect, it, vi } from "vitest";

// Mock next/navigation — OnboardingFlow uses useSearchParams
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: (_key: string) => "lifecycle-preview" }),
  useRouter: () => ({ replace: vi.fn() }),
}));

// Mock store — return LIFECYCLE_PREVIEW state
vi.mock("@/lib/onboarding/store", () => ({
  useOnboardingState: () => ({
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
    advanceLifecyclePreview: vi.fn(),
    dispatch: vi.fn(),
  }),
}));

describe("OnboardingFlow — LIFECYCLE_PREVIEW", () => {
  it("renders LifecyclePreviewStep when currentStep is LIFECYCLE_PREVIEW", () => {
    render(<OnboardingFlow />);
    expect(
      screen.getByText(/every governed action follows the same lifecycle/i)
    ).toBeInTheDocument();
  });
});
