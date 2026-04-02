import type {
  InvocationDescriptor,
  InvocationDescriptorConstraint,
  InvocationDescriptorConstraintSet,
  InvocationDescriptorRequirement,
  InvocationDescriptorSource,
  InvocationDescriptorStatus,
} from "./invocation-descriptor.dto";

function isScopeContained(candidate: string, boundary: string): boolean {
  return candidate === boundary || candidate.startsWith(`${boundary}.`);
}

function isCategoryContained(
  candidate: string,
  boundary: readonly string[],
): boolean {
  return boundary.includes(candidate);
}

function isExpired(timestamp: string | null | undefined, referenceUtc: string): boolean {
  if (!timestamp) {
    return true;
  }

  return new Date(timestamp).getTime() <= new Date(referenceUtc).getTime();
}

function createConstraint(
  code: string,
  message: string,
  satisfied: boolean,
  references: readonly string[],
): InvocationDescriptorConstraint {
  return { code, message, satisfied, references };
}

function deriveRequirementSet(source: InvocationDescriptorSource): readonly InvocationDescriptorRequirement[] {
  return source.preview.requirements.map((requirement) => ({
    ...requirement,
    source: "invocation_preview" as const,
  }));
}

function deriveConstraintSet(source: InvocationDescriptorSource): InvocationDescriptorConstraintSet {
  const { activation, delegation, permission, preparedEffect } = source;
  const referenceUtc = source.preview.evaluatedAtUtc;

  return {
    authorityConstraints: [
      createConstraint(
        "delegation_lineage_alignment",
        "Prepared effect delegation binding remains aligned with permission and activation lineage.",
        Boolean(
          delegation
            && permission
            && activation
            && preparedEffect.delegationGrantId === delegation.grantId
            && permission.delegationGrantId === delegation.grantId
            && activation.delegationGrantId === delegation.grantId,
        ),
        ["prepared_effect", "delegation", "permission", "activation"],
      ),
      createConstraint(
        "permission_lineage_alignment",
        "Prepared effect permission binding remains aligned with activation lineage.",
        Boolean(
          permission
            && activation
            && preparedEffect.permissionGrantId === permission.grantId
            && activation.permissionGrantId === permission.grantId,
        ),
        ["prepared_effect", "permission", "activation"],
      ),
      createConstraint(
        "activation_lineage_alignment",
        "Prepared effect activation binding remains aligned with the resolved activation record.",
        Boolean(activation && preparedEffect.activationId === activation.activationId),
        ["prepared_effect", "activation"],
      ),
      createConstraint(
        "authority_class_alignment",
        "Authority class remains aligned across prepared effect and resolved authority records.",
        Boolean(
          delegation
            && permission
            && activation
            && preparedEffect.authorityClass === delegation.authorityClass
            && preparedEffect.authorityClass === permission.authorityClass
            && preparedEffect.authorityClass === activation.authorityClass,
        ),
        ["prepared_effect", "delegation", "permission", "activation"],
      ),
      createConstraint(
        "effect_class_alignment",
        "Effect class remains aligned across prepared effect and resolved authority records.",
        Boolean(
          delegation
            && permission
            && activation
            && preparedEffect.effectClass === delegation.effectClass
            && preparedEffect.effectClass === permission.effectClass
            && preparedEffect.effectClass === activation.effectClass,
        ),
        ["prepared_effect", "delegation", "permission", "activation"],
      ),
    ],
    scopeConstraints: [
      createConstraint(
        "prepared_scope_within_delegation_scope",
        "Prepared effect scope remains contained within delegation scope.",
        Boolean(
          delegation && isScopeContained(preparedEffect.domainScope, delegation.domainScope),
        ),
        ["prepared_effect", "delegation"],
      ),
      createConstraint(
        "prepared_scope_within_permission_scope",
        "Prepared effect scope remains contained within permission scope.",
        Boolean(
          permission && isScopeContained(preparedEffect.domainScope, permission.domainScope),
        ),
        ["prepared_effect", "permission"],
      ),
      createConstraint(
        "prepared_scope_within_activation_scope",
        "Prepared effect scope remains contained within activation scope.",
        Boolean(
          activation && isScopeContained(preparedEffect.domainScope, activation.domainScope),
        ),
        ["prepared_effect", "activation"],
      ),
      createConstraint(
        "action_category_containment",
        "Prepared effect action category remains enumerated within permission and activation scope.",
        Boolean(
          permission
            && activation
            && isCategoryContained(preparedEffect.actionCategory, permission.actionCategories)
            && isCategoryContained(preparedEffect.actionCategory, activation.actionCategories),
        ),
        ["prepared_effect", "permission", "activation"],
      ),
      createConstraint(
        "capability_category_containment",
        "Prepared effect capability category remains enumerated within permission and activation scope.",
        Boolean(
          permission
            && activation
            && isCategoryContained(preparedEffect.capabilityCategory, permission.capabilityCategories)
            && isCategoryContained(preparedEffect.capabilityCategory, activation.capabilityCategories),
        ),
        ["prepared_effect", "permission", "activation"],
      ),
    ],
    temporalConstraints: [
      createConstraint(
        "prepared_effect_within_preparation_window",
        "Prepared effect structure remains within its own temporal boundary.",
        !isExpired(preparedEffect.expiresAtUtc, referenceUtc),
        ["prepared_effect"],
      ),
      createConstraint(
        "permission_within_validity_window",
        "Permission structure remains within its temporal boundary.",
        !isExpired(permission?.expiresAtUtc, referenceUtc),
        ["permission"],
      ),
      createConstraint(
        "activation_within_validity_window",
        "Activation structure remains within its temporal boundary.",
        !isExpired(activation?.expiresAtUtc, referenceUtc),
        ["activation"],
      ),
      createConstraint(
        "prepared_window_contained_by_permission_window",
        "Prepared effect temporal boundary remains contained within permission temporal boundary.",
        Boolean(
          permission
            && new Date(preparedEffect.expiresAtUtc).getTime() <= new Date(permission.expiresAtUtc).getTime(),
        ),
        ["prepared_effect", "permission"],
      ),
      createConstraint(
        "prepared_window_contained_by_activation_window",
        "Prepared effect temporal boundary remains contained within activation temporal boundary.",
        Boolean(
          activation
            && new Date(preparedEffect.expiresAtUtc).getTime() <= new Date(activation.expiresAtUtc).getTime(),
        ),
        ["prepared_effect", "activation"],
      ),
      createConstraint(
        "prepared_window_contained_by_delegation_window",
        "Prepared effect temporal boundary remains contained within delegation temporal boundary.",
        Boolean(
          delegation
            && new Date(preparedEffect.expiresAtUtc).getTime() <= new Date(delegation.expiresAtUtc).getTime(),
        ),
        ["prepared_effect", "delegation"],
      ),
    ],
  };
}

function resolveStatus(
  source: InvocationDescriptorSource,
  requirements: readonly InvocationDescriptorRequirement[],
  constraintSet: InvocationDescriptorConstraintSet,
): InvocationDescriptorStatus {
  if (source.eligibility.status === "not_eligible") {
    return "unavailable";
  }

  const requirementsSatisfied = requirements.every((item) => item.satisfied);
  const constraintsSatisfied = [
    ...constraintSet.authorityConstraints,
    ...constraintSet.scopeConstraints,
    ...constraintSet.temporalConstraints,
  ].every((item) => item.satisfied);

  return requirementsSatisfied && constraintsSatisfied ? "ready" : "constrained";
}

function assertCongruentSource(source: InvocationDescriptorSource): void {
  if (source.preparedEffect.preparedRequestId !== source.eligibility.preparedEffectId) {
    throw new Error("Invocation descriptor source requires congruent prepared effect and eligibility identifiers.");
  }

  if (source.preparedEffect.preparedRequestId !== source.preview.preparedEffectId) {
    throw new Error("Invocation descriptor source requires congruent prepared effect and preview identifiers.");
  }
}

export interface InvocationDescriptorRepository {
  describe(source: InvocationDescriptorSource): Promise<InvocationDescriptor>;
}

export function createInvocationDescriptorRepository(): InvocationDescriptorRepository {
  return {
    async describe(source: InvocationDescriptorSource): Promise<InvocationDescriptor> {
      assertCongruentSource(source);

      const requirementSet = deriveRequirementSet(source);
      const constraintSet = deriveConstraintSet(source);
      const status = resolveStatus(source, requirementSet, constraintSet);

      return {
        preparedEffectId: source.preparedEffect.preparedRequestId,
        status,
        requiredAuthorityContext: {
          delegationId: source.preparedEffect.delegationGrantId,
          permissionId: source.preparedEffect.permissionGrantId,
          activationId: source.preparedEffect.activationId,
        },
        requirementSet,
        constraintSet,
        eligibilityReference: {
          preparedEffectId: source.eligibility.preparedEffectId,
          surface: "execution_eligibility",
          status: source.eligibility.status,
          evaluatedAtUtc: source.eligibility.evaluatedAtUtc,
        },
        previewReference: {
          preparedEffectId: source.preview.preparedEffectId,
          surface: "invocation_preview",
          status: source.preview.status,
          evaluatedAtUtc: source.preview.evaluatedAtUtc,
        },
      };
    },
  };
}
