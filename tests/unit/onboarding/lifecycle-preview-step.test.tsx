import { LifecyclePreviewStep } from "@/components/onboarding/steps/lifecycle-preview-step";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockAdvanceLifecyclePreview = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock("@/lib/onboarding/store", () => ({
  useOnboardingState: () => ({ advanceLifecyclePreview: mockAdvanceLifecyclePreview }),
}));

beforeEach(() => {
  mockAdvanceLifecyclePreview.mockReset();
  mockReplace.mockReset();
});

describe("LifecyclePreviewStep", () => {
  it("renders all six stages in order", () => {
    render(<LifecyclePreviewStep />);
    const stages = [
      "Intent submitted",
      "Branches evaluate",
      "Adversarial challenge",
      "Vote & converge",
      "Sealed outcome",
      "Receipt issued",
    ];
    for (const label of stages) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    // Verify order — each stage appears after the previous one
    const allText = document.body.textContent ?? "";
    let lastIndex = -1;
    for (const label of stages) {
      const idx = allText.indexOf(label);
      expect(idx).toBeGreaterThan(lastIndex);
      lastIndex = idx;
    }
  });

  it("Continue to guardrails calls advanceLifecyclePreview and routes to guardrails", async () => {
    render(<LifecyclePreviewStep />);
    await userEvent.click(screen.getByRole("button", { name: /continue to guardrails/i }));
    expect(mockAdvanceLifecyclePreview).toHaveBeenCalledOnce();
    expect(mockReplace).toHaveBeenCalledWith("/setup?step=guardrails");
  });

  it("Explore full walkthrough link points to /collective/showcase and opens in new tab", () => {
    render(<LifecyclePreviewStep />);
    const link = screen.getByRole("link", { name: /explore full walkthrough/i });
    expect(link).toHaveAttribute("href", "/collective/showcase");
    expect(link).toHaveAttribute("target", "_blank");
  });
});
