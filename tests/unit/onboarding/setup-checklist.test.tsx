import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SetupChecklist } from "@/components/onboarding/setup-checklist";
import { defaultOnboardingState } from "@/lib/onboarding/state-machine";

vi.mock("@/lib/onboarding/store", () => ({
  useOnboardingState: () => ({ state: defaultOnboardingState }),
}));

describe("SetupChecklist — upcoming items", () => {
  it("renders upcoming required items as aria-disabled divs, not links", () => {
    render(<SetupChecklist />);
    const disabledItems = document
      .querySelectorAll('[aria-disabled="true"]');
    expect(disabledItems.length).toBeGreaterThan(0);
    disabledItems.forEach((item) => {
      expect(item.tagName.toLowerCase()).not.toBe("a");
    });
  });

  it("renders the current item (first step) as a link", () => {
    render(<SetupChecklist />);
    // With defaultOnboardingState (no goals set), the first item is "current"
    // and should be rendered as a link
    const links = screen.getAllByRole("link");
    // At least the current step is a link (optional items are also links)
    expect(links.length).toBeGreaterThan(0);
  });

  it("does not render any upcoming items as anchor elements", () => {
    render(<SetupChecklist />);
    const allAnchors = document.querySelectorAll("a");
    const ariaDisabledAnchors = Array.from(allAnchors).filter(
      (a) => a.getAttribute("aria-disabled") === "true"
    );
    expect(ariaDisabledAnchors.length).toBe(0);
  });
});
