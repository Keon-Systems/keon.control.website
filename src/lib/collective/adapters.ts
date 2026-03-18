import type {
  AgentPermissionGrantDetailContract,
  AgentPermissionGrantSummaryContract,
  AgentPermissionLineageContract,
  AuthorityActivationDetailContract,
  AuthorityActivationHistoryContract,
  AuthorityActivationHistoryEntryContract,
  AuthorityActivationLineageContract,
  AuthorityActivationSummaryContract,
  DelegatedAuthorityGrantDetailContract,
  DelegatedAuthorityGrantSummaryContract,
  DelegationLineageContract,
  PreparedEffectLineageContract,
  PreparedEffectRequestDetailContract,
  PreparedEffectRequestListItemContract,
  ReformAdoptionDecisionContract,
  StrategyMutationReceiptContract,
  StrategyMutationReceiptGroupContract,
} from "@/lib/contracts/collective-observability";
import type {
  AgentPermissionGrantDetail,
  AgentPermissionGrantListItem,
  AgentPermissionLineageNode,
  AuthorityActivationDetail,
  AuthorityActivationHistoryEntry,
  AuthorityActivationLineageNode,
  AuthorityActivationListItem,
  DelegatedAuthorityGrantDetail,
  DelegatedAuthorityGrantListItem,
  DelegatedAuthorityLineageNode,
  PreparedEffectLineageNode,
  PreparedEffectRequestDetail,
  PreparedEffectRequestListItem,
  ReformAdoptionDecisionDetail,
  ReformAdoptionDecisionListItem,
  StrategyMutationReceiptGroup,
  StrategyMutationReceiptView,
} from "./dto";
import {
  presentAgentPermissionQueryStatus,
  presentAgentPermissionStatus,
  presentAuthorityActivationDisposition,
  presentAuthorityActivationQueryStatus,
  presentAuthorityActivationStatus,
  presentDelegationQueryStatus,
  presentDelegationStatus,
  presentPreparedEffectDisposition,
  presentPreparedEffectStatus,
  presentReformAdoptionDisposition,
  presentReformAdoptionStatus,
  presentStrategyMutationOperation,
} from "./normalization";

function dedupe(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function withDefaultBadges(badges: readonly string[], additions: readonly string[]): string[] {
  return dedupe([...badges, ...additions]);
}

function resolveActivationConstitutionalMode(status: AuthorityActivationListItem["lifecycleState"]): "eligible" | "active" {
  return status === "Eligible" ? "active" : "eligible";
}

export function adaptStrategyMutationReceipt(contract: StrategyMutationReceiptContract): StrategyMutationReceiptView {
  return {
    receiptId: contract.receiptId,
    adoptionDecisionId: contract.adoptionDecisionId,
    adoptionReceiptId: contract.adoptionReceiptId ?? null,
    anchorEpochId: contract.anchorEpochId,
    operation: contract.operation,
    operationPresentation: presentStrategyMutationOperation(contract.operation),
    anchorReceiptRefs: contract.anchorReceiptRefs,
    lineageRefs: contract.lineageRefs,
    badges: withDefaultBadges([], ["strategy-mutation-receipt", "read-only", "receipt-anchored"]),
    recordedAtUtc: contract.recordedAtUtc,
  };
}

export function adaptStrategyMutationReceiptGroup(contract: StrategyMutationReceiptGroupContract): StrategyMutationReceiptGroup {
  return {
    decisionId: contract.decisionId,
    receipts: contract.receipts.map(adaptStrategyMutationReceipt),
  };
}

export function adaptReformAdoptionDecisionListItem(contract: ReformAdoptionDecisionContract): ReformAdoptionDecisionListItem {
  return {
    decisionId: contract.decisionId,
    proposalId: contract.proposalId,
    legitimacyAssessmentId: contract.legitimacyAssessmentId,
    anchorEpochId: contract.anchorEpochId,
    disposition: contract.disposition,
    dispositionPresentation: presentReformAdoptionDisposition(contract.disposition),
    lifecycleState: contract.status,
    lifecyclePresentation: presentReformAdoptionStatus(contract.status),
    decisionRationale: contract.decisionRationale,
    anchorReceiptRefs: contract.anchorReceiptRefs,
    lineageRefs: contract.lineageRefs,
    badges: withDefaultBadges(contract.badges, ["decisional", "reform-adoption"]),
    correlationId: contract.correlationId,
    decidedAtUtc: contract.decidedAtUtc,
    constitutionalMode: "decisional",
  };
}

export function adaptReformAdoptionDecisionDetail(contract: ReformAdoptionDecisionContract, mutationReceiptGroups: readonly StrategyMutationReceiptGroupContract[]): ReformAdoptionDecisionDetail {
  const base = adaptReformAdoptionDecisionListItem(contract);
  return {
    ...base,
    governanceAuthority: contract.governanceContext.authority,
    governanceBindingRef: contract.governanceContext.governanceBindingRef ?? null,
    mutationReceiptGroups: mutationReceiptGroups.map(adaptStrategyMutationReceiptGroup),
    readOnly: contract.readOnly,
    receiptAnchored: contract.receiptAnchored,
  };
}

export function adaptDelegatedAuthorityGrantListItem(contract: DelegatedAuthorityGrantSummaryContract): DelegatedAuthorityGrantListItem {
  return {
    grantId: contract.grantId,
    delegatorAuthorityRef: contract.delegatorAuthorityRef,
    delegateActorId: contract.delegateActorId,
    tenantId: contract.tenantId,
    governanceBindingRef: contract.governanceBindingRef,
    lifecycleState: contract.canonicalStatus,
    lifecyclePresentation: presentDelegationStatus(contract.canonicalStatus),
    queryLifecycleState: contract.status,
    queryLifecyclePresentation: presentDelegationQueryStatus(contract.status),
    anchorReceiptRefs: contract.anchorReceiptRefs,
    lineageRefs: contract.lineageRefs,
    badges: withDefaultBadges(contract.badges, ["granted", "delegated-authority"]),
    effectiveFromUtc: contract.effectiveFromUtc,
    expiresAtUtc: contract.expiresAtUtc,
    correlationId: contract.correlationId,
    constitutionalMode: "granted",
  };
}

export function adaptDelegatedAuthorityGrantDetail(contract: DelegatedAuthorityGrantDetailContract): DelegatedAuthorityGrantDetail {
  const base = adaptDelegatedAuthorityGrantListItem(contract.summary);
  return {
    ...base,
    delegateEntityId: contract.delegateEntityId ?? null,
    domainScope: contract.domainScope,
    policyScope: contract.policyScope,
    policyVersion: contract.policyVersion,
    authorityClass: contract.authorityClass,
    effectClass: contract.effectClass,
    upstreamGrantId: contract.upstreamGrantId ?? null,
    upstreamAuthorityScope: contract.upstreamAuthorityScope ?? null,
    constraintStatements: contract.constraintStatements,
    issuedAtUtc: contract.issuedAtUtc,
    revocation: contract.revocation ? {
      revocationId: contract.revocation.revocationId,
      revokedByActorId: contract.revocation.revokedByActorId,
      governanceBindingRef: contract.revocation.governanceBindingRef,
      revocationReason: contract.revocation.revocationReason,
      correlationId: contract.revocation.correlationId,
      anchorReceiptRefs: contract.revocation.anchorReceiptRefs,
      lineageRefs: contract.revocation.lineageRefs,
      revokedAtUtc: contract.revocation.revokedAtUtc,
    } : null,
  };
}

export function adaptDelegatedAuthorityLineage(contract: DelegationLineageContract): DelegatedAuthorityLineageNode {
  return {
    grantId: contract.grantId,
    upstreamGrantId: contract.upstreamGrantId ?? null,
    governanceBindingRef: contract.governanceBindingRef,
    correlationId: contract.correlationId,
    lifecycleState: contract.canonicalStatus,
    lifecyclePresentation: presentDelegationStatus(contract.canonicalStatus),
    anchorReceiptRefs: contract.anchorReceiptRefs,
    lineageRefs: contract.lineageRefs,
    badges: withDefaultBadges([], ["granted", "delegated-authority", "lineage"]),
    transitions: contract.history.map((transition) => ({
      transitionId: transition.transitionId,
      fromStatus: transition.fromStatus,
      toStatus: transition.toStatus,
      reason: transition.reason,
      actorId: transition.actorId,
      governanceBindingRef: transition.governanceBindingRef,
      anchorReceiptRefs: transition.anchorReceiptRefs,
      lineageRefs: transition.lineageRefs,
      transitionedAtUtc: transition.transitionedAtUtc,
    })),
    constitutionalMode: "granted",
  };
}

export function adaptAgentPermissionGrantListItem(contract: AgentPermissionGrantSummaryContract): AgentPermissionGrantListItem {
  return {
    grantId: contract.grantId,
    grantingAuthorityRef: contract.grantingAuthorityRef,
    agentId: contract.agentId,
    tenantId: contract.tenantId,
    delegationGrantId: contract.delegationGrantId,
    governanceBindingRef: contract.governanceBindingRef,
    lifecycleState: contract.canonicalStatus,
    lifecyclePresentation: presentAgentPermissionStatus(contract.canonicalStatus),
    queryLifecycleState: contract.status,
    queryLifecyclePresentation: presentAgentPermissionQueryStatus(contract.status),
    anchorReceiptRefs: contract.anchorReceiptRefs,
    lineageRefs: contract.lineageRefs,
    badges: withDefaultBadges(contract.badges, ["scoped", "agent-permission"]),
    effectiveFromUtc: contract.effectiveFromUtc,
    expiresAtUtc: contract.expiresAtUtc,
    correlationId: contract.correlationId,
    constitutionalMode: "scoped",
  };
}

export function adaptAgentPermissionGrantDetail(contract: AgentPermissionGrantDetailContract): AgentPermissionGrantDetail {
  const base = adaptAgentPermissionGrantListItem(contract.summary);
  return {
    ...base,
    agentEntityId: contract.agentEntityId ?? null,
    domainScope: contract.domainScope,
    policyScope: contract.policyScope,
    policyVersion: contract.policyVersion,
    authorityClass: contract.authorityClass,
    effectClass: contract.effectClass,
    actionCategories: contract.actionCategories,
    capabilityCategories: contract.capabilityCategories,
    delegatedAuthorityScope: contract.delegatedAuthorityScope ?? null,
    constraintStatements: contract.constraintStatements,
    issuedAtUtc: contract.issuedAtUtc,
    revocation: contract.revocation ? {
      revocationId: contract.revocation.revocationId,
      revokedByActorId: contract.revocation.revokedByActorId,
      governanceBindingRef: contract.revocation.governanceBindingRef,
      revocationReason: contract.revocation.revocationReason,
      correlationId: contract.revocation.correlationId,
      anchorReceiptRefs: contract.revocation.anchorReceiptRefs,
      lineageRefs: contract.revocation.lineageRefs,
      revokedAtUtc: contract.revocation.revokedAtUtc,
    } : null,
  };
}

export function adaptAgentPermissionLineage(contract: AgentPermissionLineageContract): AgentPermissionLineageNode {
  return {
    grantId: contract.grantId,
    delegationGrantId: contract.delegationGrantId,
    governanceBindingRef: contract.governanceBindingRef,
    correlationId: contract.correlationId,
    lifecycleState: contract.canonicalStatus,
    lifecyclePresentation: presentAgentPermissionStatus(contract.canonicalStatus),
    anchorReceiptRefs: contract.anchorReceiptRefs,
    lineageRefs: contract.lineageRefs,
    badges: withDefaultBadges([], ["scoped", "agent-permission", "lineage"]),
    transitions: contract.history.map((transition) => ({
      transitionId: transition.transitionId,
      fromStatus: transition.fromStatus,
      toStatus: transition.toStatus,
      reason: transition.reason,
      actorId: transition.actorId,
      governanceBindingRef: transition.governanceBindingRef,
      anchorReceiptRefs: transition.anchorReceiptRefs,
      lineageRefs: transition.lineageRefs,
      transitionedAtUtc: transition.transitionedAtUtc,
    })),
    constitutionalMode: "scoped",
  };
}

export function adaptAuthorityActivationListItem(contract: AuthorityActivationSummaryContract): AuthorityActivationListItem {
  return {
    activationId: contract.activationId,
    requestingAuthorityRef: contract.requestingAuthorityRef,
    agentId: contract.agentId,
    tenantId: contract.tenantId,
    delegationGrantId: contract.delegationGrantId,
    permissionGrantId: contract.permissionGrantId,
    governanceBindingRef: contract.governanceBindingRef,
    lifecycleState: contract.canonicalStatus,
    lifecyclePresentation: presentAuthorityActivationStatus(contract.canonicalStatus),
    queryLifecycleState: contract.status,
    queryLifecyclePresentation: presentAuthorityActivationQueryStatus(contract.status),
    anchorReceiptRefs: contract.anchorReceiptRefs,
    lineageRefs: contract.lineageRefs,
    badges: withDefaultBadges(contract.badges, ["activation", "authority"]),
    requestedAtUtc: contract.requestedAtUtc,
    effectiveFromUtc: contract.effectiveFromUtc,
    expiresAtUtc: contract.expiresAtUtc,
    correlationId: contract.correlationId,
    constitutionalMode: resolveActivationConstitutionalMode(contract.canonicalStatus),
  };
}

export function adaptAuthorityActivationDetail(contract: AuthorityActivationDetailContract): AuthorityActivationDetail {
  const base = adaptAuthorityActivationListItem(contract.summary);
  return {
    ...base,
    agentEntityId: contract.agentEntityId ?? null,
    domainScope: contract.domainScope,
    policyScope: contract.policyScope,
    policyVersion: contract.policyVersion,
    authorityClass: contract.authorityClass,
    effectClass: contract.effectClass,
    actionCategories: contract.actionCategories,
    capabilityCategories: contract.capabilityCategories,
    constraintStatements: contract.constraintStatements,
    permittedAuthorityScope: contract.permittedAuthorityScope ?? null,
    delegatedAuthorityScope: contract.delegatedAuthorityScope ?? null,
    disposition: {
      dispositionId: contract.disposition.dispositionId,
      kind: contract.disposition.kind,
      kindPresentation: presentAuthorityActivationDisposition(contract.disposition.kind),
      reasonCode: contract.disposition.reasonCode,
      rationale: contract.disposition.rationale,
      actorId: contract.disposition.actorId,
      governanceBindingRef: contract.disposition.governanceBindingRef,
      correlationId: contract.disposition.correlationId,
      anchorReceiptRefs: contract.disposition.anchorReceiptRefs,
      lineageRefs: contract.disposition.lineageRefs,
      recordedAtUtc: contract.disposition.recordedAtUtc,
    },
    termination: contract.termination ? {
      terminationId: contract.termination.terminationId,
      terminalStatus: contract.termination.terminalStatus,
      terminalPresentation: presentAuthorityActivationStatus(contract.termination.terminalStatus),
      actorId: contract.termination.actorId,
      governanceBindingRef: contract.termination.governanceBindingRef,
      reason: contract.termination.reason,
      correlationId: contract.termination.correlationId,
      anchorReceiptRefs: contract.termination.anchorReceiptRefs,
      lineageRefs: contract.termination.lineageRefs,
      recordedAtUtc: contract.termination.recordedAtUtc,
    } : null,
  };
}

export function adaptAuthorityActivationHistoryEntry(contract: AuthorityActivationHistoryEntryContract): AuthorityActivationHistoryEntry {
  return {
    activationId: contract.activationId,
    lifecycleState: contract.status,
    lifecyclePresentation: presentAuthorityActivationStatus(contract.status),
    dispositionKind: contract.dispositionKind,
    dispositionPresentation: presentAuthorityActivationDisposition(contract.dispositionKind),
    reasonCode: contract.reasonCode,
    rationale: contract.rationale,
    actorId: contract.actorId ?? null,
    requestedAtUtc: contract.requestedAtUtc,
    effectiveFromUtc: contract.effectiveFromUtc,
    expiresAtUtc: contract.expiresAtUtc,
    recordedAtUtc: contract.recordedAtUtc,
    transitionId: contract.transitionId ?? null,
    fromStatus: contract.fromStatus ?? null,
    toStatus: contract.toStatus ?? null,
    reason: contract.reason ?? null,
    anchorReceiptRefs: contract.anchorReceiptRefs,
    lineageRefs: contract.lineageRefs,
    badges: withDefaultBadges([], ["activation-history", "read-only"]),
  };
}

export function adaptAuthorityActivationHistory(contract: AuthorityActivationHistoryContract): AuthorityActivationHistoryEntry[] {
  return contract.history.map(adaptAuthorityActivationHistoryEntry);
}

export function adaptAuthorityActivationLineage(contract: AuthorityActivationLineageContract): AuthorityActivationLineageNode {
  return {
    activationId: contract.activationId,
    delegationGrantId: contract.delegationGrantId,
    permissionGrantId: contract.permissionGrantId,
    governanceBindingRef: contract.governanceBindingRef,
    correlationId: contract.correlationId,
    lifecycleState: contract.canonicalStatus,
    lifecyclePresentation: presentAuthorityActivationStatus(contract.canonicalStatus),
    anchorReceiptRefs: contract.anchorReceiptRefs,
    lineageRefs: contract.lineageRefs,
    badges: withDefaultBadges([], ["activation", "authority", "lineage"]),
    transitions: contract.history.map((transition) => ({
      transitionId: transition.transitionId,
      fromStatus: transition.fromStatus,
      toStatus: transition.toStatus,
      reasonCode: transition.reasonCode,
      reason: transition.reason,
      actorId: transition.actorId,
      governanceBindingRef: transition.governanceBindingRef,
      anchorReceiptRefs: transition.anchorReceiptRefs,
      lineageRefs: transition.lineageRefs,
      transitionedAtUtc: transition.transitionedAtUtc,
    })),
    constitutionalMode: resolveActivationConstitutionalMode(contract.canonicalStatus),
  };
}

export function adaptPreparedEffectListItem(contract: PreparedEffectRequestListItemContract): PreparedEffectRequestListItem {
  return {
    preparedRequestId: contract.preparedRequestId,
    tenantId: contract.tenantId,
    actorId: contract.actorId,
    agentId: contract.agentId,
    governanceBindingRef: contract.governanceBindingRef,
    delegationGrantId: contract.delegationGrantId,
    permissionGrantId: contract.permissionGrantId,
    activationId: contract.activationId,
    lifecycleState: contract.status,
    lifecyclePresentation: presentPreparedEffectStatus(contract.status),
    dispositionKind: contract.dispositionKind,
    dispositionPresentation: presentPreparedEffectDisposition(contract.dispositionKind),
    reasonCode: contract.reasonCode,
    domainScope: contract.domainScope,
    authorityClass: contract.authorityClass,
    effectClass: contract.effectClass,
    actionCategory: contract.actionCategory,
    capabilityCategory: contract.capabilityCategory,
    targetClass: contract.targetClass,
    preparedAtUtc: contract.preparedAtUtc,
    expiresAtUtc: contract.expiresAtUtc,
    anchorReceiptRefs: contract.anchorReceiptRefs,
    lineageRefs: contract.lineageRefs,
    badges: withDefaultBadges(contract.badges, ["prepared-effect", "inert"]),
    isPreparationOnly: true,
    executionAuthorized: false,
    constitutionalMode: "inert",
  };
}

export function adaptPreparedEffectDetail(contract: PreparedEffectRequestDetailContract): PreparedEffectRequestDetail {
  const base = adaptPreparedEffectListItem({
    preparedRequestId: contract.preparedRequestId,
    tenantId: contract.tenantId,
    actorId: contract.actorId,
    agentId: contract.agentId,
    governanceBindingRef: contract.governanceBindingRef,
    delegationGrantId: contract.delegationGrantId,
    permissionGrantId: contract.permissionGrantId,
    activationId: contract.activationId,
    status: contract.status,
    dispositionKind: contract.disposition.kind,
    reasonCode: contract.disposition.reasonCode,
    domainScope: contract.domainScope,
    authorityClass: contract.authorityClass,
    effectClass: contract.effectClass,
    actionCategory: contract.actionCategory,
    capabilityCategory: contract.capabilityCategory,
    targetClass: contract.targetClass,
    preparedAtUtc: contract.preparedAtUtc,
    expiresAtUtc: contract.expiresAtUtc,
    anchorReceiptRefs: contract.anchorReceiptRefs,
    lineageRefs: contract.lineageRefs,
    badges: contract.badges,
    readOnly: contract.readOnly,
    preparationOnly: contract.preparationOnly,
  });

  return {
    ...base,
    correlationId: contract.correlationId,
    selectedBranchId: contract.selectedBranchId,
    collapseId: contract.collapseId,
    reviewId: contract.reviewId,
    heatProfileId: contract.heatProfileId,
    inheritedTargetClass: contract.inheritedTargetClass,
    activatedScope: contract.activatedScope,
    constraintStatements: contract.constraintStatements,
    disposition: {
      dispositionId: contract.disposition.dispositionId,
      kind: contract.disposition.kind,
      kindPresentation: presentPreparedEffectDisposition(contract.disposition.kind),
      reasonCode: contract.disposition.reasonCode,
      rationale: contract.disposition.rationale,
      actorId: contract.disposition.actorId,
      governanceBindingRef: contract.disposition.governanceBindingRef,
      correlationId: contract.disposition.correlationId,
      anchorReceiptRefs: contract.disposition.anchorReceiptRefs,
      lineageRefs: contract.disposition.lineageRefs,
      recordedAtUtc: contract.disposition.recordedAtUtc,
    },
    terminal: contract.terminal ? {
      terminalId: contract.terminal.terminalId,
      terminalStatus: contract.terminal.terminalStatus,
      terminalPresentation: presentPreparedEffectStatus(contract.terminal.terminalStatus),
      actorId: contract.terminal.actorId,
      governanceBindingRef: contract.terminal.governanceBindingRef,
      reason: contract.terminal.reason,
      correlationId: contract.terminal.correlationId,
      anchorReceiptRefs: contract.terminal.anchorReceiptRefs,
      lineageRefs: contract.terminal.lineageRefs,
      recordedAtUtc: contract.terminal.recordedAtUtc,
    } : null,
  };
}

export function adaptPreparedEffectLineage(contract: PreparedEffectLineageContract): PreparedEffectLineageNode {
  return {
    preparedRequestId: contract.preparedRequestId,
    delegationGrantId: contract.delegationGrantId,
    permissionGrantId: contract.permissionGrantId,
    activationId: contract.activationId,
    selectedBranchId: contract.selectedBranchId,
    collapseId: contract.collapseId,
    reviewId: contract.reviewId,
    heatProfileId: contract.heatProfileId,
    governanceBindingRef: contract.governanceBindingRef,
    correlationId: contract.correlationId,
    lifecycleState: contract.status,
    lifecyclePresentation: presentPreparedEffectStatus(contract.status),
    anchorReceiptRefs: contract.anchorReceiptRefs,
    lineageRefs: contract.lineageRefs,
    badges: withDefaultBadges(contract.badges, ["prepared-effect", "inert", "lineage"]),
    isPreparationOnly: true,
    executionAuthorized: false,
    constitutionalMode: "inert",
  };
}
