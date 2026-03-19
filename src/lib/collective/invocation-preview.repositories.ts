import type {
  AgentPermissionGrantDetail,
  AuthorityActivationDetail,
  DelegatedAuthorityGrantDetail,
  PreparedEffectRequestDetail,
  ExecutionEligibilityView,
} from "./dto";
import type {
  InvocationPreviewView,
  InvocationRequirement,
} from "./invocation-preview.dto";
import { buildInvocationPreviewPresentation } from "./invocation-preview.dto";

export interface InvocationPreviewSource {
  readonly preparedEffect: PreparedEffectRequestDetail;
  readonly activation: AuthorityActivationDetail | null;
  readonly permission: AgentPermissionGrantDetail | null;
  readonly delegation: DelegatedAuthorityGrantDetail | null;
  readonly eligibility: ExecutionEligibilityView;
  readonly evaluatedAtUtc?: string;
}

export interface InvocationPreviewRepository {
  preview(source: InvocationPreviewSource): InvocationPreviewView;
}

function isPermissionValid(permission: AgentPermissionGrantDetail | null, nowUtc: number): boolean {
  return Boolean(
    permission
      && permission.lifecycleState === "Active"
      && Date.parse(permission.expiresAtUtc) > nowUtc,
  );
}

function isDelegationValid(delegation: DelegatedAuthorityGrantDetail | null, nowUtc: number): boolean {
  return Boolean(
    delegation
      && delegation.lifecycleState === "Active"
      && Date.parse(delegation.expiresAtUtc) > nowUtc,
  );
}

function isActivationActive(activation: AuthorityActivationDetail | null, nowUtc: number): boolean {
  return Boolean(
    activation
      && activation.lifecycleState === "Eligible"
      && activation.constitutionalMode === "active"
      && Date.parse(activation.expiresAtUtc) > nowUtc,
  );
}

function isPreparedEffectReady(preparedEffect: PreparedEffectRequestDetail, nowUtc: number): boolean {
  return preparedEffect.lifecycleState === "Materialized" && Date.parse(preparedEffect.expiresAtUtc) > nowUtc;
}

function isScopeSubset(child: string | null | undefined, parent: string | null | undefined): boolean {
  if (!child) return true;
  if (!parent) return false;
  return child === parent || child.startsWith(`${parent}.`);
}

function includesAll(parent: readonly string[] | undefined, child: readonly string[] | undefined): boolean {
  if (!child || child.length === 0) return true;
  if (!parent) return false;
  const parentValues = new Set(parent);
  return child.every((value) => parentValues.has(value));
}

function matchesScalar(child: string | null | undefined, parent: string | null | undefined): boolean {
  if (!child) return true;
  if (!parent) return false;
  return child === parent;
}

function isScopeAligned(preparedEffect: PreparedEffectRequestDetail): boolean {
  return matchesScalar(preparedEffect.tenantId, preparedEffect.activatedScope.tenantId)
    && isScopeSubset(preparedEffect.domainScope, preparedEffect.activatedScope.domainScope)
    && matchesScalar(preparedEffect.authorityClass, preparedEffect.activatedScope.authorityClass)
    && matchesScalar(preparedEffect.effectClass, preparedEffect.activatedScope.effectClass)
    && includesAll(preparedEffect.activatedScope.actionCategories, [preparedEffect.actionCategory])
    && includesAll(preparedEffect.activatedScope.capabilityCategories, [preparedEffect.capabilityCategory])
    && isScopeSubset(preparedEffect.targetClass, preparedEffect.inheritedTargetClass);
}

function buildRequirements(
  preparedEffect: PreparedEffectRequestDetail,
  activation: AuthorityActivationDetail | null,
  permission: AgentPermissionGrantDetail | null,
  delegation: DelegatedAuthorityGrantDetail | null,
  nowUtc: number,
): readonly InvocationRequirement[] {
  return [
    {
      code: "prepared_effect_must_be_ready",
      message: "Prepared effect must be ready",
      satisfied: isPreparedEffectReady(preparedEffect, nowUtc),
    },
    {
      code: "activation_must_be_active",
      message: "Activation must be active",
      satisfied: isActivationActive(activation, nowUtc),
    },
    {
      code: "permission_must_be_valid",
      message: "Permission must be valid",
      satisfied: isPermissionValid(permission, nowUtc),
    },
    {
      code: "delegation_must_be_valid",
      message: "Delegation must be valid",
      satisfied: isDelegationValid(delegation, nowUtc),
    },
    {
      code: "scope_must_remain_within_bounds",
      message: "Scope must remain within bounds",
      satisfied: isScopeAligned(preparedEffect),
    },
  ];
}

function resolveStatus(
  eligibilityStatus: InvocationPreviewView["eligibilityStatus"],
  requirements: readonly InvocationRequirement[],
): InvocationPreviewView["status"] {
  if (eligibilityStatus === "not_eligible") {
    return "not_available";
  }

  return requirements.every((requirement) => requirement.satisfied)
    ? "ready"
    : "constrained";
}

function buildSummary(status: InvocationPreviewView["status"]): string {
  switch (status) {
    case "ready":
      return "All authority conditions reflected in this preview are satisfied.";
    case "constrained":
      return "This preview reflects authority conditions that remain constrained by requirements.";
    default:
      return "This preview reflects authority conditions that are not currently available.";
  }
}

export function createInvocationPreviewRepository(
): InvocationPreviewRepository {
  return {
    preview(source) {
      const evaluatedAtUtc = source.evaluatedAtUtc ?? new Date().toISOString();
      const nowUtc = Date.parse(evaluatedAtUtc);
      const requirements = buildRequirements(
        source.preparedEffect,
        source.activation,
        source.permission,
        source.delegation,
        nowUtc,
      );
      const status = resolveStatus(source.eligibility.status, requirements);

      return {
        preparedEffectId: source.preparedEffect.preparedRequestId,
        status,
        summary: buildSummary(status),
        requirements,
        authorityContext: {
          delegationId: source.preparedEffect.delegationGrantId || undefined,
          permissionId: source.preparedEffect.permissionGrantId || undefined,
          activationId: source.preparedEffect.activationId || undefined,
        },
        eligibilityStatus: source.eligibility.status,
        evaluatedAtUtc,
        statusPresentation: buildInvocationPreviewPresentation(status),
      };
    },
  };
}
