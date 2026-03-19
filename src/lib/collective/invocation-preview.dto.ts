import type { PresentationTone } from "./dto";

export type InvocationReadinessStatus =
  | "not_available"
  | "constrained"
  | "ready";

export type InvocationRequirementCode =
  | "activation_must_be_active"
  | "permission_must_be_valid"
  | "delegation_must_be_valid"
  | "scope_must_remain_within_bounds"
  | "prepared_effect_must_be_ready";

export interface InvocationRequirement {
  readonly code: InvocationRequirementCode;
  readonly message: string;
  readonly satisfied: boolean;
}

export interface InvocationPreviewView {
  readonly preparedEffectId: string;
  readonly status: InvocationReadinessStatus;
  readonly summary: string;
  readonly requirements: readonly InvocationRequirement[];
  readonly authorityContext: {
    readonly delegationId?: string;
    readonly permissionId?: string;
    readonly activationId?: string;
  };
  readonly eligibilityStatus: "eligible" | "not_eligible";
  readonly evaluatedAtUtc: string;
  readonly statusPresentation: {
    readonly label: string;
    readonly tone: Extract<PresentationTone, "neutral" | "warning" | "success">;
  };
}

export function buildInvocationPreviewPresentation(
  status: InvocationReadinessStatus,
): InvocationPreviewView["statusPresentation"] {
  switch (status) {
    case "ready":
      return {
        label: "Ready",
        tone: "success",
      };
    case "constrained":
      return {
        label: "Constrained",
        tone: "warning",
      };
    default:
      return {
        label: "Not Available",
        tone: "neutral",
      };
  }
}

