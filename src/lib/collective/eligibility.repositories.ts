import type {
  ExecutionEligibilityReason,
  ExecutionEligibilityReasonCode,
  ExecutionEligibilityView,
} from "./eligibility.dto";
import { buildEligibilityPresentation, getMockEligibilityView } from "./eligibility.mocks";

// Evaluation context — internal, explicit, extensible
export interface EligibilityEvaluationContext {
  readonly preparedEffectId: string;
  readonly activation: {
    readonly exists: boolean;
    readonly lifecycleActive: boolean;
  };
  readonly permission: {
    readonly exists: boolean;
    readonly lifecycleValid: boolean;
    readonly expired: boolean;
  };
  readonly delegation: {
    readonly exists: boolean;
    readonly lifecycleValid: boolean;
    readonly revoked: boolean;
  };
  readonly scopeAligned: boolean;
  readonly preparedEffectReady: boolean;
}

function evaluateContext(ctx: EligibilityEvaluationContext): ExecutionEligibilityView {
  const reasons: ExecutionEligibilityReason[] = [];

  // Activation checks
  if (!ctx.activation.exists) {
    reasons.push({ code: "activation_missing", message: "No activation is linked to this prepared effect." });
  } else if (!ctx.activation.lifecycleActive) {
    reasons.push({ code: "activation_not_active", message: "Activation is not active." });
  }

  // Permission checks — expired is only meaningful if the permission exists
  if (!ctx.permission.exists || !ctx.permission.lifecycleValid) {
    reasons.push({ code: "permission_invalid", message: "The permission grant is not valid." });
  } else if (ctx.permission.expired) {
    reasons.push({ code: "permission_expired", message: "The permission grant has expired." });
  }

  // Delegation checks
  if (!ctx.delegation.exists || !ctx.delegation.lifecycleValid) {
    reasons.push({ code: "delegation_invalid", message: "The delegation grant is not valid." });
  }
  if (ctx.delegation.revoked) {
    reasons.push({ code: "delegation_revoked", message: "The delegation grant has been revoked." });
  }

  // Scope alignment (deferred — simulated via mock)
  if (!ctx.scopeAligned) {
    reasons.push({ code: "scope_mismatch", message: "Effect scope exceeds delegated bounds." });
  }

  // Prepared effect readiness
  if (!ctx.preparedEffectReady) {
    reasons.push({ code: "prepared_effect_not_ready", message: "The prepared effect is not in a ready state." });
  }

  // Upstream revocation is a derived condition: when a delegation is revoked
  // and an activation exists that depends on it, the entire upstream authority
  // chain is invalidated. This is separate from delegation_revoked because it
  // signals cascading impact, not just the delegation's own state.
  if (ctx.delegation.revoked && ctx.activation.exists) {
    reasons.push({ code: "upstream_revoked", message: "Upstream authority chain is no longer valid." });
  }

  const status = reasons.length === 0 ? "eligible" : "not_eligible";

  return {
    preparedEffectId: ctx.preparedEffectId,
    status,
    reasons,
    evaluatedAtUtc: new Date().toISOString(),
    statusPresentation: buildEligibilityPresentation(status, reasons),
  };
}

export interface ExecutionEligibilityRepository {
  evaluate(preparedEffectId: string): Promise<ExecutionEligibilityView>;
}

// Unlike other collective repositories (which use a Provider/Adapter
// two-layer architecture for contract-to-view-model transformation),
// eligibility is computed from existing view models, not fetched from
// an external API contract. There is no contract schema to adapt from,
// so the provider layer is intentionally omitted.

export function createMockExecutionEligibilityRepository(): ExecutionEligibilityRepository {
  return {
    async evaluate(preparedEffectId: string): Promise<ExecutionEligibilityView> {
      const fixture = getMockEligibilityView(preparedEffectId);
      if (fixture) {
        return {
          ...fixture,
          evaluatedAtUtc: new Date().toISOString(),
        };
      }

      return evaluateContext({
        preparedEffectId,
        activation: { exists: false, lifecycleActive: false },
        permission: { exists: false, lifecycleValid: false, expired: false },
        delegation: { exists: false, lifecycleValid: false, revoked: false },
        scopeAligned: false,
        preparedEffectReady: false,
      });
    },
  };
}

export function createExecutionEligibilityRepository(): ExecutionEligibilityRepository {
  return createMockExecutionEligibilityRepository();
}

export { evaluateContext as evaluateEligibilityContext };
