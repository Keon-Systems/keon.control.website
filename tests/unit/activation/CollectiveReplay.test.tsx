/**
 * CollectiveReplay — Unit Tests
 *
 * Covers:
 *   1. Component renders without crashing
 *   2. Demo disclaimer label is ALWAYS present
 *   3. data-testid="collective-replay" is present
 *   4. No real user data is present (no "your data" claims)
 *   5. Replay container renders in the DOM
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CollectiveReplay } from "@/components/activation/CollectiveReplay";

describe("CollectiveReplay", () => {
  it("renders without crashing", () => {
    expect(() => render(<CollectiveReplay />)).not.toThrow();
  });

  it("renders the collective-replay container", () => {
    render(<CollectiveReplay />);
    expect(screen.getByTestId("collective-replay")).toBeInTheDocument();
  });

  it("renders the inspection CTA", () => {
    render(<CollectiveReplay />);
    expect(screen.getByRole("button", { name: /inspect decision/i })).toBeInTheDocument();
  });

  it("always shows the example scenario disclaimer", () => {
    render(<CollectiveReplay />);
    const disclaimer = screen.getByTestId("replay-disclaimer");
    expect(disclaimer).toBeInTheDocument();
    expect(disclaimer.textContent).toMatch(/example scenario/i);
    expect(disclaimer.textContent).toMatch(/not from your environment/i);
  });

  it("disclaimer has accessible aria-label", () => {
    render(<CollectiveReplay />);
    const disclaimer = screen.getByTestId("replay-disclaimer");
    expect(disclaimer).toHaveAttribute("aria-label", "Example scenario disclaimer");
  });

  it("reinforces governed decision-making in the header", () => {
    render(<CollectiveReplay />);
    expect(screen.getByText(/decision authorized before execution/i)).toBeInTheDocument();
  });

  it("renders approval metadata that reads as a governed receipt", () => {
    render(<CollectiveReplay />);
    const container = screen.getByTestId("collective-replay");
    expect(container.textContent).toMatch(/policy/i);
    expect(container.textContent).toMatch(/lineage/i);
  });

  it("opens and closes deep inspection mode", async () => {
    const user = userEvent.setup();
    render(<CollectiveReplay />);

    const trigger = screen.getByRole("button", { name: /inspect decision/i });
    await user.click(trigger);

    expect(screen.getByTestId("deep-inspection-panel")).toHaveAttribute("aria-hidden", "false");
    expect(screen.getByRole("button", { name: /close inspection/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close inspection/i }));
    expect(screen.getByTestId("deep-inspection-panel")).toHaveAttribute("aria-hidden", "true");
  });

  it("renders the required inspection sections", async () => {
    const user = userEvent.setup();
    render(<CollectiveReplay />);
    await user.click(screen.getByRole("button", { name: /inspect decision/i }));

    expect(screen.getByText(/directive/i)).toBeInTheDocument();
    expect(screen.getByText(/decision path/i)).toBeInTheDocument();
    expect(screen.getByText(/governance checks/i)).toBeInTheDocument();
    expect(screen.getByText(/receipt anchors/i)).toBeInTheDocument();
    expect(screen.getByText(/causal lineage/i)).toBeInTheDocument();
    expect(screen.getByText(/outcome meaning/i)).toBeInTheDocument();
  });

  it("renders the required causal-history and receipt phrasing", async () => {
    const user = userEvent.setup();
    render(<CollectiveReplay />);
    await user.click(screen.getByRole("button", { name: /inspect decision/i }));

    expect(screen.getByText(/anchored in causal history/i)).toBeInTheDocument();
    expect(screen.getByText(/reconstructable from receipts/i)).toBeInTheDocument();
  });

  it("shows selected-branch detail and rejected branch reasons in inspection mode", async () => {
    const user = userEvent.setup();
    render(<CollectiveReplay />);
    await user.click(screen.getByRole("button", { name: /inspect decision/i }));

    expect(screen.getByText(/mfa \+ scoped/i)).toBeInTheDocument();
    expect(screen.getByTestId("rejected-branch-p1")).toHaveTextContent(/privilege exceeds policy/i);
    expect(screen.getByTestId("rejected-branch-p2")).toHaveTextContent(/missing strong auth/i);
  });

  it("SVG canvas is present and aria-hidden", () => {
    render(<CollectiveReplay />);
    const svg = document.querySelector("svg[aria-hidden='true']");
    expect(svg).toBeInTheDocument();
  });

  it("does not claim data is from the user's environment", () => {
    render(<CollectiveReplay />);
    const container = screen.getByTestId("collective-replay");
    // Must not contain language that implies real user data
    expect(container.textContent).not.toMatch(/your data/i);
    expect(container.textContent).not.toMatch(/your environment is/i);
  });

  it("accepts a className prop without error", () => {
    expect(() => render(<CollectiveReplay className="test-class" />)).not.toThrow();
  });
});
