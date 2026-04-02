import type {
  AgentPermissionGrantDetail,
  AuthorityActivationDetail,
  DelegatedAuthorityGrantDetail,
  PreparedEffectRequestDetail,
  PresentationTone,
} from "./dto";
import type { ExecutionEligibilityStatus, ExecutionEligibilityView } from "./eligibility.dto";

// ──────────────────────────────────────────────
// Readiness status — derived from eligibility + requirements
// ──────────────────────────────────────────────

export type InvocationReadinessStatus =
  | "not_available"
  | "constrained"
  | "ready";

// ──────────────────────────────────────────────
// Requirement model — deterministic, always-present
// ──────────────────────────────────────────────

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

// ──────────────────────────────────────────────
// Authority context snapshot
// ──────────────────────────────────────────────

export interface InvocationAuthorityContext {
  readonly delegationId?: string;
  readonly permissionId?: string;
  readonly activationId?: string;
}

// ──────────────────────────────────────────────
// Invocation Preview Input — unified single-object arg
// ──────────────────────────────────────────────

export interface InvocationPreviewInput {
  readonly preparedEffect: PreparedEffectRequestDetail;
  readonly activation: AuthorityActivationDetail | null;
  readonly permission: AgentPermissionGrantDetail | null;
  readonly delegation: DelegatedAuthorityGrantDetail | null;
  readonly eligibility: ExecutionEligibilityView;
  readonly evaluatedAtUtc: string;
}

// ──────────────────────────────────────────────
// Invocation Preview View — the top-level projection
// ──────────────────────────────────────────────

export interface InvocationPreviewView {
  readonly preparedEffectId: string;
  readonly status: InvocationReadinessStatus;
  readonly summary: string;
  readonly requirements: readonly InvocationRequirement[];
  readonly authorityContext: InvocationAuthorityContext;
  readonly eligibilityStatus: ExecutionEligibilityStatus;
  readonly evaluatedAtUtc: string;
  readonly statusPresentation: {
    readonly label: string;
    readonly tone: PresentationTone;
  };
}

// ──────────────────────────────────────────────
// Presentation helpers
// ──────────────────────────────────────────────

const STATUS_PRESENTATION: Record<
  InvocationReadinessStatus,
  { label: string; tone: PresentationTone }
> = {
  not_available: { label: "Not Available", tone: "neutral" },
  constrained: { label: "Constrained", tone: "warning" },
  ready: { label: "Ready", tone: "success" },
};

export function buildInvocationPreviewPresentation(
  status: InvocationReadinessStatus,
): { label: string; tone: PresentationTone } {
  return STATUS_PRESENTATION[status];
}

const STATUS_SUMMARIES: Record<InvocationReadinessStatus, string> = {
  not_available:
    "This preview reflects authority conditions that are not currently available.",
  constrained:
    "This preview reflects authority conditions that remain constrained by requirements.",
  ready:
    "All authority conditions reflected in this preview are satisfied.",
};

export function buildInvocationPreviewSummary(
  status: InvocationReadinessStatus,
): string {
  return STATUS_SUMMARIES[status];
}
