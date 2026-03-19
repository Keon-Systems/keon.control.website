import type { ExecutionEligibilityView } from "./eligibility.dto";
import type {
  InvocationPreviewInput,
  InvocationPreviewView,
  InvocationReadinessStatus,
  InvocationRequirement,
  InvocationRequirementCode,
} from "./invocation-preview.dto";
import {
  buildInvocationPreviewPresentation,
  buildInvocationPreviewSummary,
} from "./invocation-preview.dto";

// ──────────────────────────────────────────────
// Requirement derivation from eligibility reasons
// ──────────────────────────────────────────────

// Maps each requirement code to the eligibility reason codes that would
// indicate the requirement is NOT satisfied.
const REQUIREMENT_FAILURE_CODES: Record<
  InvocationRequirementCode,
  ReadonlySet<string>
> = {
  prepared_effect_must_be_ready: new Set(["prepared_effect_not_ready"]),
  activation_must_be_active: new Set([
    "activation_not_active",
    "activation_missing",
  ]),
  permission_must_be_valid: new Set([
    "permission_invalid",
    "permission_expired",
  ]),
  delegation_must_be_valid: new Set([
    "delegation_invalid",
    "delegation_revoked",
    "upstream_revoked",
  ]),
  scope_must_remain_within_bounds: new Set(["scope_mismatch"]),
};

const REQUIREMENT_MESSAGES: Record<InvocationRequirementCode, string> = {
  prepared_effect_must_be_ready: "Prepared effect must be ready",
  activation_must_be_active: "Activation must be active",
  permission_must_be_valid: "Permission must be valid",
  delegation_must_be_valid: "Delegation must be valid",
  scope_must_remain_within_bounds: "Scope must remain within bounds",
};

// Deterministic order per spec
const REQUIREMENT_ORDER: readonly InvocationRequirementCode[] = [
  "prepared_effect_must_be_ready",
  "activation_must_be_active",
  "permission_must_be_valid",
  "delegation_must_be_valid",
  "scope_must_remain_within_bounds",
];

function deriveRequirements(
  eligibility: ExecutionEligibilityView,
  input: InvocationPreviewInput,
): readonly InvocationRequirement[] {
  const failedCodes = new Set<string>(eligibility.reasons.map((r) => r.code));

  // When eligibility is eligible (no reason codes), also check entity state directly.
  // This allows the "constrained" path to be reached when entities have degraded
  // since the eligibility was evaluated (e.g. permission expired by evaluatedAtUtc).
  if (eligibility.status === "eligible" && input.permission?.expiresAtUtc) {
    const expiresAt = new Date(input.permission.expiresAtUtc);
    const evaluatedAt = new Date(input.evaluatedAtUtc);
    if (expiresAt <= evaluatedAt) {
      failedCodes.add("permission_expired");
    }
  }

  return REQUIREMENT_ORDER.map((code) => {
    const failureCodes = REQUIREMENT_FAILURE_CODES[code];
    const satisfied = ![...failureCodes].some((fc) => failedCodes.has(fc));

    return {
      code,
      message: REQUIREMENT_MESSAGES[code],
      satisfied,
    };
  });
}

// ──────────────────────────────────────────────
// Status resolution
// ──────────────────────────────────────────────

function resolveReadinessStatus(
  eligibility: ExecutionEligibilityView,
  requirements: readonly InvocationRequirement[],
): InvocationReadinessStatus {
  if (eligibility.status === "not_eligible") return "not_available";
  const allSatisfied = requirements.every((r) => r.satisfied);
  return allSatisfied ? "ready" : "constrained";
}

// ──────────────────────────────────────────────
// Repository interface and factory
// ──────────────────────────────────────────────

export interface InvocationPreviewRepository {
  preview(input: InvocationPreviewInput): Promise<InvocationPreviewView>;
}

export function createInvocationPreviewRepository(): InvocationPreviewRepository {
  return {
    async preview(input: InvocationPreviewInput): Promise<InvocationPreviewView> {
      const { preparedEffect, eligibility } = input;
      const preparedEffectId = preparedEffect.preparedRequestId;

      const authorityContext = {
        delegationId: preparedEffect.delegationGrantId || undefined,
        permissionId: preparedEffect.permissionGrantId || undefined,
        activationId: preparedEffect.activationId || undefined,
      };

      const requirements = deriveRequirements(eligibility, input);
      const status = resolveReadinessStatus(eligibility, requirements);

      return {
        preparedEffectId,
        status,
        summary: buildInvocationPreviewSummary(status),
        requirements,
        authorityContext,
        eligibilityStatus: eligibility.status,
        evaluatedAtUtc: input.evaluatedAtUtc,
        statusPresentation: buildInvocationPreviewPresentation(status),
      };
    },
  };
}
