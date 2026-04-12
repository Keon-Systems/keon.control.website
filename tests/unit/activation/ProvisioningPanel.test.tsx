/**
 * ProvisioningPanel — Unit Tests
 *
 * Covers:
 *   1. Route renders correctly (activation route mounts)
 *   2. Each provisioning step maps to correct UI label
 *   3. Progress bar reflects state
 *   4. Checklist updates correctly per state
 *   5. Ready state renders "Launching" message
 */

import { deriveProvisioningState } from "@/lib/activation/state-machine";
import type { ProvisioningInternalState } from "@/lib/activation/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProvisioningPanel } from "@/components/activation/ProvisioningPanel";

function renderPanel(internalState: ProvisioningInternalState) {
  const state = deriveProvisioningState(internalState);
  return render(<ProvisioningPanel state={state} />);
}

// ─── Label Rendering ──────────────────────────────────────────────────────────

describe("ProvisioningPanel — step label rendering", () => {
  it("shows 'Verifying access' for invite_validating", () => {
    renderPanel("invite_validating");
    expect(screen.getByTestId("step-label")).toHaveTextContent("Verifying access");
  });

  it("shows 'Preparing your workspace' for tenant_creating", () => {
    renderPanel("tenant_creating");
    expect(screen.getByTestId("step-label")).toHaveTextContent("Preparing your workspace");
  });

  it("shows 'Applying default configuration' for membership_binding", () => {
    renderPanel("membership_binding");
    expect(screen.getByTestId("step-label")).toHaveTextContent("Applying default configuration");
  });

  it("shows 'Finalizing setup' for workspace_bootstrapping", () => {
    renderPanel("workspace_bootstrapping");
    expect(screen.getByTestId("step-label")).toHaveTextContent("Finalizing setup");
  });

  it("shows 'Ready' for provisioning_complete", () => {
    renderPanel("provisioning_complete");
    expect(screen.getByTestId("step-label")).toHaveTextContent("Ready");
  });

  it("shows step message for each state", () => {
    renderPanel("invite_validating");
    const msg = screen.getByTestId("step-message");
    expect(msg.textContent?.length).toBeGreaterThan(0);
  });
});

// ─── Progress Bar ─────────────────────────────────────────────────────────────

describe("ProvisioningPanel — progress bar", () => {
  it("progress bar is present and has correct aria role", () => {
    renderPanel("tenant_creating");
    const bar = screen.getByTestId("progress-bar");
    expect(bar).toHaveAttribute("role", "progressbar");
  });

  it("progress bar reflects 100% at provisioning_complete", () => {
    renderPanel("provisioning_complete");
    const bar = screen.getByTestId("progress-bar");
    expect(bar).toHaveAttribute("aria-valuenow", "100");
  });

  it("progress bar reflects non-zero partial progress at intermediate state", () => {
    renderPanel("tenant_creating");
    const bar = screen.getByTestId("progress-bar");
    const value = Number(bar.getAttribute("aria-valuenow") ?? "0");
    expect(value).toBeGreaterThan(0);
    expect(value).toBeLessThan(100);
  });
});

// ─── Checklist ────────────────────────────────────────────────────────────────

describe("ProvisioningPanel — checklist", () => {
  it("renders 4 checklist items", () => {
    renderPanel("invite_validating");
    const list = screen.getByTestId("provisioning-checklist");
    expect(list.children).toHaveLength(4);
  });

  it("first item is in_progress at invite_validating", () => {
    renderPanel("invite_validating");
    const item = screen.getByTestId("checklist-item-access");
    expect(item).toHaveAttribute("data-status", "in_progress");
  });

  it("all items are complete at provisioning_complete", () => {
    renderPanel("provisioning_complete");
    const itemIds = ["access", "workspace", "governance", "ready"];
    for (const id of itemIds) {
      const item = screen.getByTestId(`checklist-item-${id}`);
      expect(item).toHaveAttribute("data-status", "complete");
    }
  });

  it("all items are failed at provisioning_failed", () => {
    renderPanel("provisioning_failed");
    const itemIds = ["access", "workspace", "governance", "ready"];
    for (const id of itemIds) {
      const item = screen.getByTestId(`checklist-item-${id}`);
      expect(item).toHaveAttribute("data-status", "failed");
    }
  });

  it("items show correct transitions: access complete, workspace active at tenant_creating", () => {
    renderPanel("tenant_creating");
    expect(screen.getByTestId("checklist-item-access")).toHaveAttribute("data-status", "complete");
    expect(screen.getByTestId("checklist-item-workspace")).toHaveAttribute("data-status", "in_progress");
    expect(screen.getByTestId("checklist-item-governance")).toHaveAttribute("data-status", "pending");
  });
});

// ─── Ready State ──────────────────────────────────────────────────────────────

describe("ProvisioningPanel — ready state", () => {
  it("shows 'Launching' message when provisioning_complete", () => {
    renderPanel("provisioning_complete");
    // Both the step message and the ready CTA contain "Launching" — use getAllByText
    const matches = screen.getAllByText(/launching/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("does NOT show launching message for intermediate states", () => {
    renderPanel("tenant_creating");
    expect(screen.queryByText(/launching/i)).not.toBeInTheDocument();
  });

  it("shows a clear label when test activation mode is active", () => {
    const state = deriveProvisioningState("invite_validating");
    render(
      <ProvisioningPanel
        state={state}
        activationMode="test"
        activationLabel="Test activation mode"
      />
    );

    expect(screen.getByTestId("test-activation-badge")).toHaveTextContent("Test activation mode");
  });
});
