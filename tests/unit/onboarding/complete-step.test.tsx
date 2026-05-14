import { CompleteStep } from "@/components/onboarding/steps/complete-step";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const finishOnboarding = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/control-plane/tenant-binding", () => ({
  useTenantBinding: () => ({
    confirmedTenant: { id: "ten_keon_internal_test", name: "Keon Internal Test Tenant" },
    confirmedEnvironment: "sandbox",
  }),
}));

vi.mock("@/lib/onboarding/store", () => ({
  useOnboardingState: () => ({
    state: {
      selectedGoals: ["govern-ai-actions"],
      guardrailPreset: "balanced",
      selectedIntegrationMode: "BYO_AI",
    },
    finishOnboarding,
  }),
}));

describe("CompleteStep", () => {
  it("summarizes setup choices without claiming durable workspace provisioning", () => {
    render(<CompleteStep />);

    expect(screen.getByRole("heading", { name: "Setup choices confirmed." })).toBeInTheDocument();
    expect(screen.queryByText(/Workspace prepared/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/which workspace to prepare/i)).not.toBeInTheDocument();
  });
});
