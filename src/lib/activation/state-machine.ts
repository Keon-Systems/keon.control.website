/**
 * KEON ACTIVATION — PROVISIONING STATE MACHINE
 *
 * Maps internal orchestration states → user-facing UI state.
 * This is the single source of truth for what users see during provisioning.
 * Internal state names never leak to the presentation layer.
 */

import type {
  ChecklistItemStatus,
  ProvisioningChecklistItem,
  ProvisioningInternalState,
  ProvisioningState,
  ProvisioningUserStep,
} from "./types";

// ─── Step Label Map ───────────────────────────────────────────────────────────

const STEP_LABELS: Record<ProvisioningUserStep, string> = {
  verifying_access: "Verifying access",
  preparing_workspace: "Resolving workspace binding",
  applying_configuration: "Applying default configuration",
  finalizing_setup: "Finalizing setup",
  ready: "Ready",
  failed: "Setup encountered a problem",
};

const STEP_MESSAGES: Record<ProvisioningUserStep, string> = {
  verifying_access: "Confirming your invitation and resolving your workspace.",
  preparing_workspace: "Binding this activation to its approved workspace context.",
  applying_configuration: "Applying your governance baseline and default policies.",
  finalizing_setup: "Running final checks and preparing your control plane.",
  ready: "Your workspace is ready. Launching Keon Control.",
  failed: "Something went wrong during setup. No changes were committed.",
};

// ─── Internal → User Step ─────────────────────────────────────────────────────

const INTERNAL_TO_USER_STEP: Record<ProvisioningInternalState, ProvisioningUserStep> = {
  invite_validating: "verifying_access",
  tenant_resolving: "verifying_access",
  tenant_creating: "preparing_workspace",
  membership_binding: "applying_configuration",
  workspace_bootstrapping: "finalizing_setup",
  provisioning_complete: "ready",
  provisioning_failed: "failed",
};

// ─── Progress Percent ─────────────────────────────────────────────────────────

const PROGRESS_BY_STATE: Record<ProvisioningInternalState, number> = {
  invite_validating: 8,
  tenant_resolving: 20,
  tenant_creating: 42,
  membership_binding: 64,
  workspace_bootstrapping: 84,
  provisioning_complete: 100,
  provisioning_failed: 0,
};

// ─── Checklist Builder ────────────────────────────────────────────────────────

const CHECKLIST_STAGES: Array<{
  id: string;
  label: string;
  completedAt: ProvisioningInternalState[];
  activeAt: ProvisioningInternalState[];
  failedAt: ProvisioningInternalState[];
}> = [
  {
    id: "access",
    label: "Access verified",
    activeAt: ["invite_validating", "tenant_resolving"],
    completedAt: [
      "tenant_creating",
      "membership_binding",
      "workspace_bootstrapping",
      "provisioning_complete",
    ],
    failedAt: ["provisioning_failed"],
  },
  {
    id: "workspace",
    label: "Workspace binding resolved",
    activeAt: ["tenant_creating"],
    completedAt: ["membership_binding", "workspace_bootstrapping", "provisioning_complete"],
    failedAt: ["provisioning_failed"],
  },
  {
    id: "governance",
    label: "Governance baseline applied",
    activeAt: ["membership_binding"],
    completedAt: ["workspace_bootstrapping", "provisioning_complete"],
    failedAt: ["provisioning_failed"],
  },
  {
    id: "ready",
    label: "Setup complete",
    activeAt: ["workspace_bootstrapping"],
    completedAt: ["provisioning_complete"],
    failedAt: ["provisioning_failed"],
  },
];

function buildChecklist(internalState: ProvisioningInternalState): ProvisioningChecklistItem[] {
  return CHECKLIST_STAGES.map((stage) => {
    let status: ChecklistItemStatus = "pending";
    if (stage.completedAt.includes(internalState)) status = "complete";
    else if (stage.activeAt.includes(internalState)) status = "in_progress";
    else if (stage.failedAt.includes(internalState)) status = "failed";
    return { id: stage.id, label: stage.label, status };
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function deriveProvisioningState(internalState: ProvisioningInternalState): ProvisioningState {
  const userStep = INTERNAL_TO_USER_STEP[internalState];
  return {
    internalState,
    userStep,
    stepLabel: STEP_LABELS[userStep],
    stepMessage: STEP_MESSAGES[userStep],
    checklist: buildChecklist(internalState),
    progressPercent: PROGRESS_BY_STATE[internalState],
  };
}

export function isTerminalState(internalState: ProvisioningInternalState): boolean {
  return internalState === "provisioning_complete" || internalState === "provisioning_failed";
}

export function isFailedState(internalState: ProvisioningInternalState): boolean {
  return internalState === "provisioning_failed";
}

export function isCompleteState(internalState: ProvisioningInternalState): boolean {
  return internalState === "provisioning_complete";
}

// ─── Simulation Sequence ──────────────────────────────────────────────────────
// Used by the API route to simulate progression when real orchestration
// is not yet wired. Timings are relative to provisioning session creation (ms).

export const SIMULATION_TIMELINE: Array<{
  state: ProvisioningInternalState;
  afterMs: number;
}> = [
  { state: "invite_validating", afterMs: 0 },
  { state: "tenant_resolving", afterMs: 900 },
  { state: "tenant_creating", afterMs: 2000 },
  { state: "membership_binding", afterMs: 3500 },
  { state: "workspace_bootstrapping", afterMs: 5200 },
  { state: "provisioning_complete", afterMs: 6800 },
];

export function resolveSimulatedState(createdAtMs: number): ProvisioningInternalState {
  const elapsed = Date.now() - createdAtMs;
  let resolved: ProvisioningInternalState = "invite_validating";
  for (const entry of SIMULATION_TIMELINE) {
    if (elapsed >= entry.afterMs) {
      resolved = entry.state;
    }
  }
  return resolved;
}

export { STEP_LABELS };
