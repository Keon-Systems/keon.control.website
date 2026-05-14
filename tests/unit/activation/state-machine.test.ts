/**
 * Activation State Machine — Unit Tests
 *
 * Covers:
 *   1. Each internal state derives the correct user-facing label
 *   2. Each internal state produces the correct checklist
 *   3. Terminal state detection
 *   4. Progress percent sanity
 *   5. Simulated timeline ordering
 */

import {
  SIMULATION_TIMELINE,
  deriveProvisioningState,
  isCompleteState,
  isFailedState,
  isTerminalState,
  resolveSimulatedState,
} from "@/lib/activation/state-machine";
import type { ProvisioningInternalState } from "@/lib/activation/types";
import { describe, expect, it } from "vitest";

// ─── User Step Label Tests ────────────────────────────────────────────────────

describe("deriveProvisioningState — user step labels", () => {
  const cases: Array<[ProvisioningInternalState, string]> = [
    ["invite_validating", "Verifying access"],
    ["tenant_resolving", "Verifying access"],
    ["tenant_creating", "Resolving workspace binding"],
    ["membership_binding", "Applying default configuration"],
    ["workspace_bootstrapping", "Finalizing setup"],
    ["provisioning_complete", "Ready"],
    ["provisioning_failed", "Setup encountered a problem"],
  ];

  it.each(cases)("state '%s' → label '%s'", (state, expectedLabel) => {
    const result = deriveProvisioningState(state);
    expect(result.stepLabel).toBe(expectedLabel);
  });

  it.each(cases)("state '%s' has a non-empty step message", (state) => {
    const result = deriveProvisioningState(state);
    expect(result.stepMessage.length).toBeGreaterThan(0);
  });
});

// ─── Checklist Tests ──────────────────────────────────────────────────────────

describe("deriveProvisioningState — checklist", () => {
  it("all items are pending at invite_validating start except first", () => {
    const { checklist } = deriveProvisioningState("invite_validating");
    expect(checklist[0].status).toBe("in_progress");
    expect(checklist[1].status).toBe("pending");
    expect(checklist[2].status).toBe("pending");
    expect(checklist[3].status).toBe("pending");
  });

  it("first item completes when tenant_creating", () => {
    const { checklist } = deriveProvisioningState("tenant_creating");
    expect(checklist[0].status).toBe("complete");
    expect(checklist[1].status).toBe("in_progress");
  });

  it("first two items complete when membership_binding", () => {
    const { checklist } = deriveProvisioningState("membership_binding");
    expect(checklist[0].status).toBe("complete");
    expect(checklist[1].status).toBe("complete");
    expect(checklist[2].status).toBe("in_progress");
  });

  it("all items complete when provisioning_complete", () => {
    const { checklist } = deriveProvisioningState("provisioning_complete");
    for (const item of checklist) {
      expect(item.status).toBe("complete");
    }
  });

  it("all items are failed when provisioning_failed", () => {
    const { checklist } = deriveProvisioningState("provisioning_failed");
    for (const item of checklist) {
      expect(item.status).toBe("failed");
    }
  });

  it("checklist always has exactly 4 items", () => {
    const states: ProvisioningInternalState[] = [
      "invite_validating",
      "tenant_resolving",
      "tenant_creating",
      "membership_binding",
      "workspace_bootstrapping",
      "provisioning_complete",
      "provisioning_failed",
    ];
    for (const state of states) {
      const { checklist } = deriveProvisioningState(state);
      expect(checklist).toHaveLength(4);
    }
  });

  it("each item has a non-empty label", () => {
    const { checklist } = deriveProvisioningState("tenant_creating");
    for (const item of checklist) {
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it("does not claim that activation created a workspace", () => {
    const { checklist, stepMessage } = deriveProvisioningState("tenant_creating");
    expect(checklist.map((item) => item.label)).toContain("Workspace binding resolved");
    expect(checklist.map((item) => item.label)).not.toContain("Workspace created");
    expect(stepMessage).toMatch(/binding/i);
    expect(stepMessage).not.toMatch(/initializing your workspace environment/i);
  });
});

// ─── Progress Percent Tests ───────────────────────────────────────────────────

describe("deriveProvisioningState — progress", () => {
  it("progress increases monotonically through normal states", () => {
    const normalSequence: ProvisioningInternalState[] = [
      "invite_validating",
      "tenant_resolving",
      "tenant_creating",
      "membership_binding",
      "workspace_bootstrapping",
      "provisioning_complete",
    ];
    let prev = -1;
    for (const state of normalSequence) {
      const { progressPercent } = deriveProvisioningState(state);
      expect(progressPercent).toBeGreaterThan(prev);
      prev = progressPercent;
    }
  });

  it("complete state reaches 100%", () => {
    const { progressPercent } = deriveProvisioningState("provisioning_complete");
    expect(progressPercent).toBe(100);
  });

  it("failed state has 0 progress", () => {
    const { progressPercent } = deriveProvisioningState("provisioning_failed");
    expect(progressPercent).toBe(0);
  });

  it("progress is always 0-100", () => {
    const allStates: ProvisioningInternalState[] = [
      "invite_validating", "tenant_resolving", "tenant_creating",
      "membership_binding", "workspace_bootstrapping",
      "provisioning_complete", "provisioning_failed",
    ];
    for (const state of allStates) {
      const { progressPercent } = deriveProvisioningState(state);
      expect(progressPercent).toBeGreaterThanOrEqual(0);
      expect(progressPercent).toBeLessThanOrEqual(100);
    }
  });
});

// ─── Terminal State Detection ─────────────────────────────────────────────────

describe("isTerminalState", () => {
  it("provisioning_complete is terminal", () => {
    expect(isTerminalState("provisioning_complete")).toBe(true);
  });
  it("provisioning_failed is terminal", () => {
    expect(isTerminalState("provisioning_failed")).toBe(true);
  });
  it("intermediate states are not terminal", () => {
    const intermediates: ProvisioningInternalState[] = [
      "invite_validating", "tenant_resolving", "tenant_creating",
      "membership_binding", "workspace_bootstrapping",
    ];
    for (const state of intermediates) {
      expect(isTerminalState(state)).toBe(false);
    }
  });
});

describe("isCompleteState / isFailedState", () => {
  it("isCompleteState is true only for provisioning_complete", () => {
    expect(isCompleteState("provisioning_complete")).toBe(true);
    expect(isCompleteState("provisioning_failed")).toBe(false);
    expect(isCompleteState("workspace_bootstrapping")).toBe(false);
  });
  it("isFailedState is true only for provisioning_failed", () => {
    expect(isFailedState("provisioning_failed")).toBe(true);
    expect(isFailedState("provisioning_complete")).toBe(false);
    expect(isFailedState("workspace_bootstrapping")).toBe(false);
  });
});

// ─── Simulation Timeline Tests ────────────────────────────────────────────────

describe("SIMULATION_TIMELINE", () => {
  it("starts at 0ms with invite_validating", () => {
    expect(SIMULATION_TIMELINE[0].afterMs).toBe(0);
    expect(SIMULATION_TIMELINE[0].state).toBe("invite_validating");
  });

  it("ends with provisioning_complete", () => {
    const last = SIMULATION_TIMELINE[SIMULATION_TIMELINE.length - 1];
    expect(last.state).toBe("provisioning_complete");
  });

  it("timeline is in ascending order by afterMs", () => {
    for (let i = 1; i < SIMULATION_TIMELINE.length; i++) {
      expect(SIMULATION_TIMELINE[i].afterMs).toBeGreaterThan(
        SIMULATION_TIMELINE[i - 1].afterMs
      );
    }
  });
});

describe("resolveSimulatedState", () => {
  it("returns invite_validating immediately after creation", () => {
    const now = Date.now();
    expect(resolveSimulatedState(now)).toBe("invite_validating");
  });

  it("returns provisioning_complete well after the last timeline entry", () => {
    const longAgo = Date.now() - 30_000;
    expect(resolveSimulatedState(longAgo)).toBe("provisioning_complete");
  });

  it("resolves each simulated state at expected time", () => {
    for (const entry of SIMULATION_TIMELINE) {
      const fakeCreatedAt = Date.now() - entry.afterMs - 1;
      const resolved = resolveSimulatedState(fakeCreatedAt);
      // Should be at least as advanced as this entry
      const entryIndex = SIMULATION_TIMELINE.findIndex((e) => e.state === entry.state);
      const resolvedIndex = SIMULATION_TIMELINE.findIndex((e) => e.state === resolved);
      expect(resolvedIndex).toBeGreaterThanOrEqual(entryIndex);
    }
  });
});
