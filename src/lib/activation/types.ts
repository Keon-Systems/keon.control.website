/**
 * KEON ACTIVATION LAYER — TYPE SYSTEM
 *
 * The provisioning pipeline runs between magic-link entry and onboarding.
 * Internal states drive the server-side orchestration. User-facing labels
 * are derived from internal states — raw state names never reach the UI.
 */

// ─── Internal Orchestration States ───────────────────────────────────────────

export type ProvisioningInternalState =
  | "invite_validating"
  | "tenant_resolving"
  | "tenant_creating"
  | "membership_binding"
  | "workspace_bootstrapping"
  | "provisioning_complete"
  | "provisioning_failed";

export type ActivationMode = "invite" | "test";

export type ActivationSource = "invite_token" | "test_token" | "local_sandbox_seed";

export interface ActivationContextSummary {
  mode: ActivationMode;
  source: ActivationSource;
  tenantId?: string;
  tenantName?: string;
  workspaceId?: string;
  workspaceName?: string;
  environment?: "sandbox" | "production";
  uiLabel?: string;
}

// ─── User-Facing Step Keys ────────────────────────────────────────────────────

export type ProvisioningUserStep =
  | "verifying_access"
  | "preparing_workspace"
  | "applying_configuration"
  | "finalizing_setup"
  | "ready"
  | "failed";

// ─── Checklist ────────────────────────────────────────────────────────────────

export type ChecklistItemStatus = "pending" | "in_progress" | "complete" | "failed";

export interface ProvisioningChecklistItem {
  id: string;
  label: string;
  status: ChecklistItemStatus;
}

// ─── Provisioning State (client-consumable) ───────────────────────────────────

export interface ProvisioningState {
  internalState: ProvisioningInternalState;
  userStep: ProvisioningUserStep;
  stepLabel: string;
  stepMessage: string;
  checklist: ProvisioningChecklistItem[];
  progressPercent: number;
}

// ─── API Contracts ────────────────────────────────────────────────────────────

export interface StartProvisioningRequest {
  token: string;
  activationMode?: ActivationMode;
}

export interface StartProvisioningResponse {
  provisioningId: string;
  activation: ActivationContextSummary;
}

export interface ProvisioningStatusResponse {
  provisioningId: string;
  state: ProvisioningState;
  activation: ActivationContextSummary;
  completedAt?: string;
  failedAt?: string;
  failureCode?: string;
  failureMessage?: string;
}
