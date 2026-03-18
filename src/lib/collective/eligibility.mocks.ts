import type {
  ExecutionEligibilityView,
  ExecutionEligibilityReasonCode,
} from "./eligibility.dto";
import type { PresentationTone } from "./dto";

// Hard failures: active violations of authority constraints.
// Scope mismatch is a boundary violation, not an incomplete condition.
const HARD_FAILURE_CODES: ReadonlySet<ExecutionEligibilityReasonCode> = new Set([
  "delegation_invalid",
  "delegation_revoked",
  "permission_invalid",
  "permission_expired",
  "scope_mismatch",
  "upstream_revoked",
]);

export function resolveEligibilityTone(
  status: "eligible" | "not_eligible",
  reasons: readonly { code: ExecutionEligibilityReasonCode }[],
): PresentationTone {
  if (status === "eligible") return "success";
  const hasHardFailure = reasons.some((r) => HARD_FAILURE_CODES.has(r.code));
  return hasHardFailure ? "danger" : "warning";
}

export function buildEligibilityPresentation(
  status: "eligible" | "not_eligible",
  reasons: readonly { code: ExecutionEligibilityReasonCode }[],
): { label: string; tone: PresentationTone } {
  return {
    label: status === "eligible" ? "Eligible" : "Not Eligible",
    tone: resolveEligibilityTone(status, reasons),
  };
}

export const mockEligibilityFullyEligible: ExecutionEligibilityView = {
  preparedEffectId: "prepared-effect-001",
  status: "eligible",
  reasons: [],
  evaluatedAtUtc: "2026-03-18T10:00:00Z",
  statusPresentation: buildEligibilityPresentation("eligible", []),
};

export const mockEligibilityMissingActivation: ExecutionEligibilityView = {
  preparedEffectId: "prepared-effect-no-activation",
  status: "not_eligible",
  reasons: [
    { code: "activation_missing", message: "No activation is linked to this prepared effect." },
  ],
  evaluatedAtUtc: "2026-03-18T10:01:00Z",
  statusPresentation: buildEligibilityPresentation("not_eligible", [
    { code: "activation_missing" },
  ]),
};

export const mockEligibilityExpiredPermission: ExecutionEligibilityView = {
  preparedEffectId: "prepared-effect-expired-perm",
  status: "not_eligible",
  reasons: [
    { code: "permission_expired", message: "The permission grant has expired." },
  ],
  evaluatedAtUtc: "2026-03-18T10:02:00Z",
  statusPresentation: buildEligibilityPresentation("not_eligible", [
    { code: "permission_expired" },
  ]),
};

export const mockEligibilityRevokedDelegation: ExecutionEligibilityView = {
  preparedEffectId: "prepared-effect-revoked-deleg",
  status: "not_eligible",
  reasons: [
    { code: "delegation_revoked", message: "The delegation grant has been revoked." },
    { code: "upstream_revoked", message: "Upstream authority chain is no longer valid." },
  ],
  evaluatedAtUtc: "2026-03-18T10:03:00Z",
  statusPresentation: buildEligibilityPresentation("not_eligible", [
    { code: "delegation_revoked" },
    { code: "upstream_revoked" },
  ]),
};

export const mockEligibilityScopeMismatch: ExecutionEligibilityView = {
  preparedEffectId: "prepared-effect-scope-fail",
  status: "not_eligible",
  reasons: [
    { code: "scope_mismatch", message: "Effect scope exceeds delegated bounds." },
  ],
  evaluatedAtUtc: "2026-03-18T10:04:00Z",
  statusPresentation: buildEligibilityPresentation("not_eligible", [
    { code: "scope_mismatch" },
  ]),
};

const eligibilityFixtures = new Map<string, ExecutionEligibilityView>([
  [mockEligibilityFullyEligible.preparedEffectId, mockEligibilityFullyEligible],
  [mockEligibilityMissingActivation.preparedEffectId, mockEligibilityMissingActivation],
  [mockEligibilityExpiredPermission.preparedEffectId, mockEligibilityExpiredPermission],
  [mockEligibilityRevokedDelegation.preparedEffectId, mockEligibilityRevokedDelegation],
  [mockEligibilityScopeMismatch.preparedEffectId, mockEligibilityScopeMismatch],
]);

export function getMockEligibilityView(preparedEffectId: string): ExecutionEligibilityView | null {
  return eligibilityFixtures.get(preparedEffectId) ?? null;
}
