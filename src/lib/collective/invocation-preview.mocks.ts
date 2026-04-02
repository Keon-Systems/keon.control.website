import type { InvocationPreviewView } from "./invocation-preview.dto";
import {
  buildInvocationPreviewPresentation,
  buildInvocationPreviewSummary,
} from "./invocation-preview.dto";

// ──────────────────────────────────────────────
// Fixture 1: not_available — missing activation
// ──────────────────────────────────────────────

export const mockInvocationPreviewNotAvailable: InvocationPreviewView = {
  preparedEffectId: "prepared-effect-no-activation",
  status: "not_available",
  summary: buildInvocationPreviewSummary("not_available"),
  requirements: [
    { code: "prepared_effect_must_be_ready", message: "Prepared effect must be ready", satisfied: true },
    { code: "activation_must_be_active", message: "Activation must be active", satisfied: false },
    { code: "permission_must_be_valid", message: "Permission must be valid", satisfied: true },
    { code: "delegation_must_be_valid", message: "Delegation must be valid", satisfied: true },
    { code: "scope_must_remain_within_bounds", message: "Scope must remain within bounds", satisfied: true },
  ],
  authorityContext: {
    delegationId: "deleg-001",
    permissionId: "perm-001",
  },
  eligibilityStatus: "not_eligible",
  evaluatedAtUtc: "2026-03-18T10:01:00Z",
  statusPresentation: buildInvocationPreviewPresentation("not_available"),
};

// ──────────────────────────────────────────────
// Fixture 2: constrained — eligible but one requirement unsatisfied
//
// Forward-looking fixture: the current eligibility model cannot produce
// this state (eligible always means empty reasons → all satisfied → ready).
// This fixture exists for UI rendering coverage. See resolveReadinessStatus
// in invocation-preview.repositories.ts for the full explanation.
// ──────────────────────────────────────────────

export const mockInvocationPreviewConstrained: InvocationPreviewView = {
  preparedEffectId: "prepared-effect-constrained",
  status: "constrained",
  summary: buildInvocationPreviewSummary("constrained"),
  requirements: [
    { code: "prepared_effect_must_be_ready", message: "Prepared effect must be ready", satisfied: true },
    { code: "activation_must_be_active", message: "Activation must be active", satisfied: true },
    { code: "permission_must_be_valid", message: "Permission must be valid", satisfied: false },
    { code: "delegation_must_be_valid", message: "Delegation must be valid", satisfied: true },
    { code: "scope_must_remain_within_bounds", message: "Scope must remain within bounds", satisfied: true },
  ],
  authorityContext: {
    delegationId: "deleg-001",
    permissionId: "perm-002",
    activationId: "act-001",
  },
  eligibilityStatus: "eligible",
  evaluatedAtUtc: "2026-03-18T10:02:00Z",
  statusPresentation: buildInvocationPreviewPresentation("constrained"),
};

// ──────────────────────────────────────────────
// Fixture 3: ready — all requirements satisfied
// ──────────────────────────────────────────────

export const mockInvocationPreviewReady: InvocationPreviewView = {
  preparedEffectId: "prepared-effect-001",
  status: "ready",
  summary: buildInvocationPreviewSummary("ready"),
  requirements: [
    { code: "prepared_effect_must_be_ready", message: "Prepared effect must be ready", satisfied: true },
    { code: "activation_must_be_active", message: "Activation must be active", satisfied: true },
    { code: "permission_must_be_valid", message: "Permission must be valid", satisfied: true },
    { code: "delegation_must_be_valid", message: "Delegation must be valid", satisfied: true },
    { code: "scope_must_remain_within_bounds", message: "Scope must remain within bounds", satisfied: true },
  ],
  authorityContext: {
    delegationId: "deleg-001",
    permissionId: "perm-001",
    activationId: "act-001",
  },
  eligibilityStatus: "eligible",
  evaluatedAtUtc: "2026-03-18T10:00:00Z",
  statusPresentation: buildInvocationPreviewPresentation("ready"),
};

// ──────────────────────────────────────────────
// Fixture lookup by preparedEffectId
// ──────────────────────────────────────────────

const invocationPreviewFixtures = new Map<string, InvocationPreviewView>([
  [mockInvocationPreviewNotAvailable.preparedEffectId, mockInvocationPreviewNotAvailable],
  [mockInvocationPreviewConstrained.preparedEffectId, mockInvocationPreviewConstrained],
  [mockInvocationPreviewReady.preparedEffectId, mockInvocationPreviewReady],
]);

export function getMockInvocationPreviewView(
  preparedEffectId: string,
): InvocationPreviewView | null {
  return invocationPreviewFixtures.get(preparedEffectId) ?? null;
}
