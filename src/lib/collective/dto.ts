import type {
  AgentPermissionQueryStatus,
  AgentPermissionStatus,
  AuthorityActivationDispositionKind,
  AuthorityActivationMediationReasonCode,
  AuthorityActivationQueryStatus,
  AuthorityActivationStatus,
  DelegationQueryStatus,
  DelegationStatus,
  PreparedEffectDispositionKind,
  PreparedEffectMediationReasonCode,
  PreparedEffectRequestStatus,
  ReformAdoptionDisposition,
  ReformAdoptionStatus,
  StrategyMutationOperation,
} from "@/lib/contracts/collective-observability";

export type PresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

export type LifecyclePresentation<TState extends string> = {
  raw: TState;
  label: string;
  tone: PresentationTone;
};

export type DispositionPresentation<TDisposition extends string> = {
  raw: TDisposition;
  label: string;
  tone: PresentationTone;
};

export type BadgePresentation = {
  raw: string;
  label: string;
  tone: PresentationTone;
};

export interface ReformAdoptionFilterState {
  readonly decisionId?: string;
  readonly proposalId?: string;
  readonly legitimacyAssessmentId?: string;
  readonly anchorEpochId?: string;
  readonly artifactId?: string;
  readonly disposition?: ReformAdoptionDisposition;
}

export interface StrategyMutationReceiptView {
  readonly receiptId: string;
  readonly adoptionDecisionId: string;
  readonly adoptionReceiptId: string | null;
  readonly anchorEpochId: string;
  readonly operation: StrategyMutationOperation;
  readonly operationPresentation: LifecyclePresentation<StrategyMutationOperation>;
  readonly anchorReceiptRefs: readonly string[];
  readonly lineageRefs: readonly string[];
  readonly badges: readonly string[];
  readonly recordedAtUtc: string;
}

export interface StrategyMutationReceiptGroup {
  readonly decisionId: string;
  readonly receipts: readonly StrategyMutationReceiptView[];
}

export interface ReformAdoptionDecisionListItem {
  readonly decisionId: string;
  readonly proposalId: string;
  readonly legitimacyAssessmentId: string;
  readonly anchorEpochId: string;
  readonly disposition: ReformAdoptionDisposition;
  readonly dispositionPresentation: DispositionPresentation<ReformAdoptionDisposition>;
  readonly lifecycleState: ReformAdoptionStatus;
  readonly lifecyclePresentation: LifecyclePresentation<ReformAdoptionStatus>;
  readonly decisionRationale: string;
  readonly anchorReceiptRefs: readonly string[];
  readonly lineageRefs: readonly string[];
  readonly badges: readonly string[];
  readonly correlationId: string;
  readonly decidedAtUtc: string;
  readonly constitutionalMode: "decisional";
}

export interface ReformAdoptionDecisionDetail extends ReformAdoptionDecisionListItem {
  readonly governanceAuthority: string;
  readonly governanceBindingRef: string | null;
  readonly mutationReceiptGroups: readonly StrategyMutationReceiptGroup[];
  readonly readOnly: boolean;
  readonly receiptAnchored: boolean;
}

export interface DelegatedAuthorityGrantListItem {
  readonly grantId: string;
  readonly delegatorAuthorityRef: string;
  readonly delegateActorId: string;
  readonly tenantId: string;
  readonly governanceBindingRef: string;
  readonly lifecycleState: DelegationStatus;
  readonly lifecyclePresentation: LifecyclePresentation<DelegationStatus>;
  readonly queryLifecycleState: DelegationQueryStatus;
  readonly queryLifecyclePresentation: LifecyclePresentation<DelegationQueryStatus>;
  readonly anchorReceiptRefs: readonly string[];
  readonly lineageRefs: readonly string[];
  readonly badges: readonly string[];
  readonly effectiveFromUtc: string;
  readonly expiresAtUtc: string;
  readonly correlationId: string;
  readonly constitutionalMode: "granted";
}

export interface DelegatedAuthorityGrantDetail extends DelegatedAuthorityGrantListItem {
  readonly delegateEntityId: string | null;
  readonly domainScope: string;
  readonly policyScope: string;
  readonly policyVersion: string;
  readonly authorityClass: string;
  readonly effectClass: string;
  readonly upstreamGrantId: string | null;
  readonly upstreamAuthorityScope: {
    readonly tenantId: string;
    readonly domainScope: string;
    readonly policyScope: string;
    readonly policyVersion: string;
    readonly authorityClass: string;
    readonly effectClass: string;
  } | null;
  readonly constraintStatements: readonly string[];
  readonly issuedAtUtc: string;
  readonly revocation: {
    readonly revocationId: string;
    readonly revokedByActorId: string;
    readonly governanceBindingRef: string;
    readonly revocationReason: string;
    readonly correlationId: string;
    readonly anchorReceiptRefs: readonly string[];
    readonly lineageRefs: readonly string[];
    readonly revokedAtUtc: string;
  } | null;
}

export interface DelegatedAuthorityLineageNode {
  readonly grantId: string;
  readonly upstreamGrantId: string | null;
  readonly governanceBindingRef: string;
  readonly correlationId: string;
  readonly lifecycleState: DelegationStatus;
  readonly lifecyclePresentation: LifecyclePresentation<DelegationStatus>;
  readonly anchorReceiptRefs: readonly string[];
  readonly lineageRefs: readonly string[];
  readonly badges: readonly string[];
  readonly transitions: readonly {
    readonly transitionId: string;
    readonly fromStatus: DelegationStatus;
    readonly toStatus: DelegationStatus;
    readonly reason: string;
    readonly actorId: string;
    readonly governanceBindingRef: string;
    readonly anchorReceiptRefs: readonly string[];
    readonly lineageRefs: readonly string[];
    readonly transitionedAtUtc: string;
  }[];
  readonly constitutionalMode: "granted";
}

export interface AgentPermissionGrantListItem {
  readonly grantId: string;
  readonly grantingAuthorityRef: string;
  readonly agentId: string;
  readonly tenantId: string;
  readonly delegationGrantId: string;
  readonly governanceBindingRef: string;
  readonly lifecycleState: AgentPermissionStatus;
  readonly lifecyclePresentation: LifecyclePresentation<AgentPermissionStatus>;
  readonly queryLifecycleState: AgentPermissionQueryStatus;
  readonly queryLifecyclePresentation: LifecyclePresentation<AgentPermissionQueryStatus>;
  readonly anchorReceiptRefs: readonly string[];
  readonly lineageRefs: readonly string[];
  readonly badges: readonly string[];
  readonly effectiveFromUtc: string;
  readonly expiresAtUtc: string;
  readonly correlationId: string;
  readonly constitutionalMode: "scoped";
}

export interface AgentPermissionGrantDetail extends AgentPermissionGrantListItem {
  readonly agentEntityId: string | null;
  readonly domainScope: string;
  readonly policyScope: string;
  readonly policyVersion: string;
  readonly authorityClass: string;
  readonly effectClass: string;
  readonly actionCategories: readonly string[];
  readonly capabilityCategories: readonly string[];
  readonly delegatedAuthorityScope: {
    readonly tenantId: string;
    readonly domainScope: string;
    readonly policyScope: string;
    readonly policyVersion: string;
    readonly authorityClass: string;
    readonly effectClass: string;
  } | null;
  readonly constraintStatements: readonly string[];
  readonly issuedAtUtc: string;
  readonly revocation: {
    readonly revocationId: string;
    readonly revokedByActorId: string;
    readonly governanceBindingRef: string;
    readonly revocationReason: string;
    readonly correlationId: string;
    readonly anchorReceiptRefs: readonly string[];
    readonly lineageRefs: readonly string[];
    readonly revokedAtUtc: string;
  } | null;
}

export interface AgentPermissionLineageNode {
  readonly grantId: string;
  readonly delegationGrantId: string;
  readonly governanceBindingRef: string;
  readonly correlationId: string;
  readonly lifecycleState: AgentPermissionStatus;
  readonly lifecyclePresentation: LifecyclePresentation<AgentPermissionStatus>;
  readonly anchorReceiptRefs: readonly string[];
  readonly lineageRefs: readonly string[];
  readonly badges: readonly string[];
  readonly transitions: readonly {
    readonly transitionId: string;
    readonly fromStatus: AgentPermissionStatus;
    readonly toStatus: AgentPermissionStatus;
    readonly reason: string;
    readonly actorId: string;
    readonly governanceBindingRef: string;
    readonly anchorReceiptRefs: readonly string[];
    readonly lineageRefs: readonly string[];
    readonly transitionedAtUtc: string;
  }[];
  readonly constitutionalMode: "scoped";
}

export interface AuthorityActivationListItem {
  readonly activationId: string;
  readonly requestingAuthorityRef: string;
  readonly agentId: string;
  readonly tenantId: string;
  readonly delegationGrantId: string;
  readonly permissionGrantId: string;
  readonly governanceBindingRef: string;
  readonly lifecycleState: AuthorityActivationStatus;
  readonly lifecyclePresentation: LifecyclePresentation<AuthorityActivationStatus>;
  readonly queryLifecycleState: AuthorityActivationQueryStatus;
  readonly queryLifecyclePresentation: LifecyclePresentation<AuthorityActivationQueryStatus>;
  readonly anchorReceiptRefs: readonly string[];
  readonly lineageRefs: readonly string[];
  readonly badges: readonly string[];
  readonly requestedAtUtc: string;
  readonly effectiveFromUtc: string;
  readonly expiresAtUtc: string;
  readonly correlationId: string;
  readonly constitutionalMode: "eligible" | "active";
}

export interface AuthorityActivationDetail extends AuthorityActivationListItem {
  readonly agentEntityId: string | null;
  readonly domainScope: string;
  readonly policyScope: string;
  readonly policyVersion: string;
  readonly authorityClass: string;
  readonly effectClass: string;
  readonly actionCategories: readonly string[];
  readonly capabilityCategories: readonly string[];
  readonly constraintStatements: readonly string[];
  readonly permittedAuthorityScope: {
    readonly tenantId: string;
    readonly domainScope: string;
    readonly policyScope: string;
    readonly policyVersion: string;
    readonly authorityClass: string;
    readonly effectClass: string;
    readonly actionCategories: readonly string[];
    readonly capabilityCategories: readonly string[];
  } | null;
  readonly delegatedAuthorityScope: {
    readonly tenantId: string;
    readonly domainScope: string;
    readonly policyScope: string;
    readonly policyVersion: string;
    readonly authorityClass: string;
    readonly effectClass: string;
  } | null;
  readonly disposition: {
    readonly dispositionId: string;
    readonly kind: AuthorityActivationDispositionKind;
    readonly kindPresentation: DispositionPresentation<AuthorityActivationDispositionKind>;
    readonly reasonCode: AuthorityActivationMediationReasonCode;
    readonly rationale: string;
    readonly actorId: string;
    readonly governanceBindingRef: string;
    readonly correlationId: string;
    readonly anchorReceiptRefs: readonly string[];
    readonly lineageRefs: readonly string[];
    readonly recordedAtUtc: string;
  };
  readonly termination: {
    readonly terminationId: string;
    readonly terminalStatus: AuthorityActivationStatus;
    readonly terminalPresentation: LifecyclePresentation<AuthorityActivationStatus>;
    readonly actorId: string;
    readonly governanceBindingRef: string;
    readonly reason: string;
    readonly correlationId: string;
    readonly anchorReceiptRefs: readonly string[];
    readonly lineageRefs: readonly string[];
    readonly recordedAtUtc: string;
  } | null;
}

export interface AuthorityActivationHistoryEntry {
  readonly activationId: string;
  readonly lifecycleState: AuthorityActivationStatus;
  readonly lifecyclePresentation: LifecyclePresentation<AuthorityActivationStatus>;
  readonly dispositionKind: AuthorityActivationDispositionKind;
  readonly dispositionPresentation: DispositionPresentation<AuthorityActivationDispositionKind>;
  readonly reasonCode: AuthorityActivationMediationReasonCode;
  readonly rationale: string;
  readonly actorId: string | null;
  readonly requestedAtUtc: string;
  readonly effectiveFromUtc: string;
  readonly expiresAtUtc: string;
  readonly recordedAtUtc: string;
  readonly transitionId: string | null;
  readonly fromStatus: AuthorityActivationStatus | null;
  readonly toStatus: AuthorityActivationStatus | null;
  readonly reason: string | null;
  readonly anchorReceiptRefs: readonly string[];
  readonly lineageRefs: readonly string[];
  readonly badges: readonly string[];
}

export interface AuthorityActivationLineageNode {
  readonly activationId: string;
  readonly delegationGrantId: string;
  readonly permissionGrantId: string;
  readonly governanceBindingRef: string;
  readonly correlationId: string;
  readonly lifecycleState: AuthorityActivationStatus;
  readonly lifecyclePresentation: LifecyclePresentation<AuthorityActivationStatus>;
  readonly anchorReceiptRefs: readonly string[];
  readonly lineageRefs: readonly string[];
  readonly badges: readonly string[];
  readonly transitions: readonly {
    readonly transitionId: string;
    readonly fromStatus: AuthorityActivationStatus;
    readonly toStatus: AuthorityActivationStatus;
    readonly reasonCode: AuthorityActivationMediationReasonCode;
    readonly reason: string;
    readonly actorId: string;
    readonly governanceBindingRef: string;
    readonly anchorReceiptRefs: readonly string[];
    readonly lineageRefs: readonly string[];
    readonly transitionedAtUtc: string;
  }[];
  readonly constitutionalMode: "eligible" | "active";
}

export interface PreparedEffectRequestListItem {
  readonly preparedRequestId: string;
  readonly tenantId: string;
  readonly actorId: string;
  readonly agentId: string;
  readonly governanceBindingRef: string;
  readonly delegationGrantId: string;
  readonly permissionGrantId: string;
  readonly activationId: string;
  readonly lifecycleState: PreparedEffectRequestStatus;
  readonly lifecyclePresentation: LifecyclePresentation<PreparedEffectRequestStatus>;
  readonly dispositionKind: PreparedEffectDispositionKind;
  readonly dispositionPresentation: DispositionPresentation<PreparedEffectDispositionKind>;
  readonly reasonCode: PreparedEffectMediationReasonCode;
  readonly domainScope: string;
  readonly authorityClass: string;
  readonly effectClass: string;
  readonly actionCategory: string;
  readonly capabilityCategory: string;
  readonly targetClass: string;
  readonly preparedAtUtc: string;
  readonly expiresAtUtc: string;
  readonly anchorReceiptRefs: readonly string[];
  readonly lineageRefs: readonly string[];
  readonly badges: readonly string[];
  readonly isPreparationOnly: true;
  readonly executionAuthorized: false;
  readonly constitutionalMode: "inert";
}

export interface PreparedEffectRequestDetail extends PreparedEffectRequestListItem {
  readonly correlationId: string;
  readonly selectedBranchId: string;
  readonly collapseId: string;
  readonly reviewId: string;
  readonly heatProfileId: string;
  readonly inheritedTargetClass: string;
  readonly activatedScope: {
    readonly tenantId: string;
    readonly domainScope: string;
    readonly policyScope: string;
    readonly policyVersion: string;
    readonly authorityClass: string;
    readonly effectClass: string;
    readonly actionCategories: readonly string[];
    readonly capabilityCategories: readonly string[];
  };
  readonly constraintStatements: readonly string[];
  readonly disposition: {
    readonly dispositionId: string;
    readonly kind: PreparedEffectDispositionKind;
    readonly kindPresentation: DispositionPresentation<PreparedEffectDispositionKind>;
    readonly reasonCode: PreparedEffectMediationReasonCode;
    readonly rationale: string;
    readonly actorId: string;
    readonly governanceBindingRef: string;
    readonly correlationId: string;
    readonly anchorReceiptRefs: readonly string[];
    readonly lineageRefs: readonly string[];
    readonly recordedAtUtc: string;
  };
  readonly terminal: {
    readonly terminalId: string;
    readonly terminalStatus: PreparedEffectRequestStatus;
    readonly terminalPresentation: LifecyclePresentation<PreparedEffectRequestStatus>;
    readonly actorId: string;
    readonly governanceBindingRef: string;
    readonly reason: string;
    readonly correlationId: string;
    readonly anchorReceiptRefs: readonly string[];
    readonly lineageRefs: readonly string[];
    readonly recordedAtUtc: string;
  } | null;
}

export interface PreparedEffectLineageNode {
  readonly preparedRequestId: string;
  readonly delegationGrantId: string;
  readonly permissionGrantId: string;
  readonly activationId: string;
  readonly selectedBranchId: string;
  readonly collapseId: string;
  readonly reviewId: string;
  readonly heatProfileId: string;
  readonly governanceBindingRef: string;
  readonly correlationId: string;
  readonly lifecycleState: PreparedEffectRequestStatus;
  readonly lifecyclePresentation: LifecyclePresentation<PreparedEffectRequestStatus>;
  readonly anchorReceiptRefs: readonly string[];
  readonly lineageRefs: readonly string[];
  readonly badges: readonly string[];
  readonly isPreparationOnly: true;
  readonly executionAuthorized: false;
  readonly constitutionalMode: "inert";
}
<<<<<<< HEAD
=======

export type ExecutionEligibilityStatus = "eligible" | "not_eligible";

export type ExecutionEligibilityReasonCode =
  | "activation_not_active"
  | "activation_missing"
  | "permission_invalid"
  | "permission_expired"
  | "delegation_invalid"
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
    readonly tone: "success" | "warning" | "danger" | "neutral";
  };
}
>>>>>>> origin/main
