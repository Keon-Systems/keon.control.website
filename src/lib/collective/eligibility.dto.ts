import type { PresentationTone } from "./dto";

export type ExecutionEligibilityStatus = "eligible" | "not_eligible";

export type ExecutionEligibilityReasonCode =
  | "activation_not_active"
  | "activation_missing"
  | "permission_invalid"
  | "permission_expired"
  | "delegation_invalid"
  | "delegation_revoked"
  | "scope_mismatch"
  | "prepared_effect_not_ready"
  | "upstream_revoked";

export interface ExecutionEligibilityReason {
  readonly code: ExecutionEligibilityReasonCode;
  readonly message: string;
}

export interface ExecutionEligibilityView {
  readonly preparedEffectId: string;
  readonly status: ExecutionEligibilityStatus;
  readonly reasons: readonly ExecutionEligibilityReason[];
  readonly evaluatedAtUtc: string;
  readonly statusPresentation: {
    readonly label: string;
    readonly tone: PresentationTone;
  };
}

// ──────────────────────────────────────────────
// Presentation helpers — production code, not mock-only
// ──────────────────────────────────────────────

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
  status: ExecutionEligibilityStatus,
  reasons: readonly { code: ExecutionEligibilityReasonCode }[],
): PresentationTone {
  if (status === "eligible") return "success";
  const hasHardFailure = reasons.some((r) => HARD_FAILURE_CODES.has(r.code));
  return hasHardFailure ? "danger" : "warning";
}

export function buildEligibilityPresentation(
  status: ExecutionEligibilityStatus,
  reasons: readonly { code: ExecutionEligibilityReasonCode }[],
): { label: string; tone: PresentationTone } {
  return {
    label: status === "eligible" ? "Eligible" : "Not Eligible",
    tone: resolveEligibilityTone(status, reasons),
  };
}
