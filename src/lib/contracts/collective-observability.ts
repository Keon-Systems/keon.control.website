import { z } from "zod";
import { IsoDateTimeSchema } from "./common";

const CanonicalStringSchema = z.string().min(1);
const CanonicalIdSchema = CanonicalStringSchema;
const ReceiptRefSchema = CanonicalStringSchema;
const LineageRefSchema = CanonicalStringSchema;
const CorrelationIdSchema = CanonicalStringSchema;

export const GovernanceContextSchema = z.object({
  authority: CanonicalStringSchema,
  policyScope: CanonicalStringSchema.optional().nullable(),
  policyVersion: CanonicalStringSchema.optional().nullable(),
  governanceBindingRef: CanonicalStringSchema.optional().nullable(),
});
export type GovernanceContext = z.infer<typeof GovernanceContextSchema>;

export const ReformAdoptionDispositionSchema = z.enum([
  "Approved",
  "Rejected",
  "Superseded",
  "Revoked",
]);
export type ReformAdoptionDisposition = z.infer<typeof ReformAdoptionDispositionSchema>;

export const ReformAdoptionStatusSchema = z.enum([
  "ApprovedForAdoption",
  "Rejected",
  "Superseded",
  "Revoked",
]);
export type ReformAdoptionStatus = z.infer<typeof ReformAdoptionStatusSchema>;

export const ReformAdoptionDecisionContractSchema = z.object({
  decisionId: CanonicalIdSchema,
  proposalId: CanonicalIdSchema,
  legitimacyAssessmentId: CanonicalIdSchema,
  anchorEpochId: CanonicalIdSchema,
  disposition: ReformAdoptionDispositionSchema,
  status: ReformAdoptionStatusSchema,
  decisionRationale: z.string(),
  governanceContext: GovernanceContextSchema,
  anchorReceiptRefs: z.array(ReceiptRefSchema).default([]),
  lineageRefs: z.array(LineageRefSchema).default([]),
  correlationId: CorrelationIdSchema,
  decidedAtUtc: IsoDateTimeSchema,
  badges: z.array(z.string()).default([]),
  readOnly: z.boolean().default(true),
  receiptAnchored: z.boolean().default(true),
});
export type ReformAdoptionDecisionContract = z.infer<typeof ReformAdoptionDecisionContractSchema>;

export const StrategyMutationOperationSchema = z.enum(["Activate", "Supersede", "Retire"]);
export type StrategyMutationOperation = z.infer<typeof StrategyMutationOperationSchema>;

export const StrategyMutationReceiptContractSchema = z.object({
  receiptId: CanonicalIdSchema,
  canonicalReceiptRef: CanonicalIdSchema.optional().nullable(),
  adoptionReceiptId: CanonicalIdSchema.optional().nullable(),
  adoptionDecisionId: CanonicalIdSchema,
  anchorEpochId: CanonicalIdSchema,
  operation: StrategyMutationOperationSchema,
  governanceContext: GovernanceContextSchema,
  correlationId: CorrelationIdSchema,
  anchorReceiptRefs: z.array(ReceiptRefSchema).default([]),
  lineageRefs: z.array(LineageRefSchema).default([]),
  transitionOutcome: z.record(z.string(), z.unknown()).optional(),
  recordedAtUtc: IsoDateTimeSchema,
  canonical: z.boolean().default(true),
  readOnly: z.boolean().default(true),
});
export type StrategyMutationReceiptContract = z.infer<typeof StrategyMutationReceiptContractSchema>;

export const StrategyMutationReceiptGroupContractSchema = z.object({
  decisionId: CanonicalIdSchema,
  receipts: z.array(StrategyMutationReceiptContractSchema).default([]),
});
export type StrategyMutationReceiptGroupContract = z.infer<typeof StrategyMutationReceiptGroupContractSchema>;

export const DelegationStatusSchema = z.enum([
  "Draft",
  "Proposed",
  "Active",
  "Expired",
  "Revoked",
  "Rejected",
]);
export type DelegationStatus = z.infer<typeof DelegationStatusSchema>;

export const DelegationQueryStatusSchema = z.enum([
  "Draft",
  "Proposed",
  "Active",
  "Expired",
  "Revoked",
  "Rejected",
]);
export type DelegationQueryStatus = z.infer<typeof DelegationQueryStatusSchema>;

export const DelegationRevocationRecordSchema = z.object({
  revocationId: CanonicalIdSchema,
  grantId: CanonicalIdSchema,
  revokedByActorId: CanonicalIdSchema,
  governanceBindingRef: CanonicalStringSchema,
  revocationReason: z.string(),
  correlationId: CorrelationIdSchema,
  anchorReceiptRefs: z.array(ReceiptRefSchema).default([]),
  lineageRefs: z.array(LineageRefSchema).default([]),
  revokedAtUtc: IsoDateTimeSchema,
});
export type DelegationRevocationRecord = z.infer<typeof DelegationRevocationRecordSchema>;

export const DelegatedAuthorityGrantSummaryContractSchema = z.object({
  grantId: CanonicalIdSchema,
  delegatorAuthorityRef: CanonicalStringSchema,
  delegateActorId: CanonicalIdSchema,
  tenantId: CanonicalIdSchema,
  governanceBindingRef: CanonicalStringSchema,
  canonicalStatus: DelegationStatusSchema,
  status: DelegationQueryStatusSchema,
  correlationId: CorrelationIdSchema,
  anchorReceiptRefs: z.array(ReceiptRefSchema).default([]),
  lineageRefs: z.array(LineageRefSchema).default([]),
  effectiveFromUtc: IsoDateTimeSchema,
  expiresAtUtc: IsoDateTimeSchema,
  badges: z.array(z.string()).default([]),
  readOnly: z.boolean().default(true),
  receiptAnchored: z.boolean().default(true),
});
export type DelegatedAuthorityGrantSummaryContract = z.infer<typeof DelegatedAuthorityGrantSummaryContractSchema>;

export const DelegatedAuthorityGrantDetailContractSchema = z.object({
  summary: DelegatedAuthorityGrantSummaryContractSchema,
  delegateEntityId: CanonicalIdSchema.optional().nullable(),
  domainScope: CanonicalStringSchema,
  policyScope: CanonicalStringSchema,
  policyVersion: CanonicalStringSchema,
  authorityClass: CanonicalStringSchema,
  effectClass: CanonicalStringSchema,
  upstreamAuthorityScope: z.object({
    tenantId: CanonicalIdSchema,
    domainScope: CanonicalStringSchema,
    policyScope: CanonicalStringSchema,
    policyVersion: CanonicalStringSchema,
    authorityClass: CanonicalStringSchema,
    effectClass: CanonicalStringSchema,
  }).optional().nullable(),
  constraintStatements: z.array(z.string()).default([]),
  issuedAtUtc: IsoDateTimeSchema,
  revocation: DelegationRevocationRecordSchema.optional().nullable(),
  upstreamGrantId: CanonicalIdSchema.optional().nullable(),
});
export type DelegatedAuthorityGrantDetailContract = z.infer<typeof DelegatedAuthorityGrantDetailContractSchema>;

export const DelegationLifecycleTransitionContractSchema = z.object({
  transitionId: CanonicalIdSchema,
  grantId: CanonicalIdSchema,
  fromStatus: DelegationStatusSchema,
  toStatus: DelegationStatusSchema,
  actorId: CanonicalIdSchema,
  governanceBindingRef: CanonicalStringSchema,
  reason: z.string(),
  anchorReceiptRefs: z.array(ReceiptRefSchema).default([]),
  lineageRefs: z.array(LineageRefSchema).default([]),
  transitionedAtUtc: IsoDateTimeSchema,
});
export type DelegationLifecycleTransitionContract = z.infer<typeof DelegationLifecycleTransitionContractSchema>;

export const DelegationLineageContractSchema = z.object({
  grantId: CanonicalIdSchema,
  governanceBindingRef: CanonicalStringSchema,
  correlationId: CorrelationIdSchema,
  lineageRefs: z.array(LineageRefSchema).default([]),
  anchorReceiptRefs: z.array(ReceiptRefSchema).default([]),
  upstreamGrantId: CanonicalIdSchema.optional().nullable(),
  canonicalStatus: DelegationStatusSchema,
  history: z.array(DelegationLifecycleTransitionContractSchema).default([]),
  readOnly: z.boolean().default(true),
});
export type DelegationLineageContract = z.infer<typeof DelegationLineageContractSchema>;

export const AgentPermissionStatusSchema = z.enum([
  "Draft",
  "Active",
  "Expired",
  "Revoked",
  "Rejected",
]);
export type AgentPermissionStatus = z.infer<typeof AgentPermissionStatusSchema>;

export const AgentPermissionQueryStatusSchema = z.enum([
  "Draft",
  "Active",
  "Expired",
  "Revoked",
  "Rejected",
]);
export type AgentPermissionQueryStatus = z.infer<typeof AgentPermissionQueryStatusSchema>;

export const AgentPermissionRevocationRecordSchema = z.object({
  revocationId: CanonicalIdSchema,
  grantId: CanonicalIdSchema,
  delegationGrantId: CanonicalIdSchema,
  revokedByActorId: CanonicalIdSchema,
  governanceBindingRef: CanonicalStringSchema,
  revocationReason: z.string(),
  correlationId: CorrelationIdSchema,
  anchorReceiptRefs: z.array(ReceiptRefSchema).default([]),
  lineageRefs: z.array(LineageRefSchema).default([]),
  revokedAtUtc: IsoDateTimeSchema,
});
export type AgentPermissionRevocationRecord = z.infer<typeof AgentPermissionRevocationRecordSchema>;

export const AgentPermissionGrantSummaryContractSchema = z.object({
  grantId: CanonicalIdSchema,
  grantingAuthorityRef: CanonicalStringSchema,
  agentId: CanonicalIdSchema,
  tenantId: CanonicalIdSchema,
  delegationGrantId: CanonicalIdSchema,
  governanceBindingRef: CanonicalStringSchema,
  canonicalStatus: AgentPermissionStatusSchema,
  status: AgentPermissionQueryStatusSchema,
  correlationId: CorrelationIdSchema,
  anchorReceiptRefs: z.array(ReceiptRefSchema).default([]),
  lineageRefs: z.array(LineageRefSchema).default([]),
  effectiveFromUtc: IsoDateTimeSchema,
  expiresAtUtc: IsoDateTimeSchema,
  badges: z.array(z.string()).default([]),
  readOnly: z.boolean().default(true),
  receiptAnchored: z.boolean().default(true),
});
export type AgentPermissionGrantSummaryContract = z.infer<typeof AgentPermissionGrantSummaryContractSchema>;

export const AgentPermissionGrantDetailContractSchema = z.object({
  summary: AgentPermissionGrantSummaryContractSchema,
  agentEntityId: CanonicalIdSchema.optional().nullable(),
  domainScope: CanonicalStringSchema,
  policyScope: CanonicalStringSchema,
  policyVersion: CanonicalStringSchema,
  authorityClass: CanonicalStringSchema,
  effectClass: CanonicalStringSchema,
  actionCategories: z.array(CanonicalStringSchema).default([]),
  capabilityCategories: z.array(CanonicalStringSchema).default([]),
  delegatedAuthorityScope: z.object({
    tenantId: CanonicalIdSchema,
    domainScope: CanonicalStringSchema,
    policyScope: CanonicalStringSchema,
    policyVersion: CanonicalStringSchema,
    authorityClass: CanonicalStringSchema,
    effectClass: CanonicalStringSchema,
  }).optional().nullable(),
  constraintStatements: z.array(z.string()).default([]),
  issuedAtUtc: IsoDateTimeSchema,
  revocation: AgentPermissionRevocationRecordSchema.optional().nullable(),
});
export type AgentPermissionGrantDetailContract = z.infer<typeof AgentPermissionGrantDetailContractSchema>;

export const AgentPermissionLifecycleTransitionContractSchema = z.object({
  transitionId: CanonicalIdSchema,
  grantId: CanonicalIdSchema,
  fromStatus: AgentPermissionStatusSchema,
  toStatus: AgentPermissionStatusSchema,
  actorId: CanonicalIdSchema,
  governanceBindingRef: CanonicalStringSchema,
  reason: z.string(),
  anchorReceiptRefs: z.array(ReceiptRefSchema).default([]),
  lineageRefs: z.array(LineageRefSchema).default([]),
  transitionedAtUtc: IsoDateTimeSchema,
});
export type AgentPermissionLifecycleTransitionContract = z.infer<typeof AgentPermissionLifecycleTransitionContractSchema>;

export const AgentPermissionLineageContractSchema = z.object({
  grantId: CanonicalIdSchema,
  delegationGrantId: CanonicalIdSchema,
  governanceBindingRef: CanonicalStringSchema,
  correlationId: CorrelationIdSchema,
  lineageRefs: z.array(LineageRefSchema).default([]),
  anchorReceiptRefs: z.array(ReceiptRefSchema).default([]),
  canonicalStatus: AgentPermissionStatusSchema,
  history: z.array(AgentPermissionLifecycleTransitionContractSchema).default([]),
  readOnly: z.boolean().default(true),
});
export type AgentPermissionLineageContract = z.infer<typeof AgentPermissionLineageContractSchema>;

export const AuthorityActivationStatusSchema = z.enum([
  "Draft",
  "Pending",
  "Eligible",
  "Ineligible",
  "Suspended",
  "Expired",
  "Revoked",
  "Rejected",
]);
export type AuthorityActivationStatus = z.infer<typeof AuthorityActivationStatusSchema>;

export const AuthorityActivationQueryStatusSchema = z.enum([
  "Draft",
  "Pending",
  "Eligible",
  "Ineligible",
  "Suspended",
  "Expired",
  "Revoked",
  "Rejected",
]);
export type AuthorityActivationQueryStatus = z.infer<typeof AuthorityActivationQueryStatusSchema>;

export const AuthorityActivationDispositionKindSchema = z.enum([
  "EligibilityConfirmed",
  "EligibilityDenied",
  "Suspended",
  "Revoked",
  "Rejected",
  "Expired",
]);
export type AuthorityActivationDispositionKind = z.infer<typeof AuthorityActivationDispositionKindSchema>;

export const AuthorityActivationMediationReasonCodeSchema = z.enum([
  "GovernanceReviewRequested",
  "GovernanceEligibilityConfirmed",
  "GovernanceEligibilityDenied",
  "GovernanceSuspended",
  "GovernanceRevoked",
  "GovernanceRejected",
  "GovernanceWindowExpired",
]);
export type AuthorityActivationMediationReasonCode = z.infer<typeof AuthorityActivationMediationReasonCodeSchema>;

export const AuthorityActivationDispositionSchema = z.object({
  dispositionId: CanonicalIdSchema,
  activationId: CanonicalIdSchema,
  kind: AuthorityActivationDispositionKindSchema,
  reasonCode: AuthorityActivationMediationReasonCodeSchema,
  actorId: CanonicalIdSchema,
  governanceBindingRef: CanonicalStringSchema,
  rationale: z.string(),
  correlationId: CorrelationIdSchema,
  anchorReceiptRefs: z.array(ReceiptRefSchema).default([]),
  lineageRefs: z.array(LineageRefSchema).default([]),
  recordedAtUtc: IsoDateTimeSchema,
});
export type AuthorityActivationDisposition = z.infer<typeof AuthorityActivationDispositionSchema>;

export const AuthorityActivationTerminationRecordSchema = z.object({
  terminationId: CanonicalIdSchema,
  activationId: CanonicalIdSchema,
  terminalStatus: AuthorityActivationStatusSchema,
  actorId: CanonicalIdSchema,
  governanceBindingRef: CanonicalStringSchema,
  reason: z.string(),
  correlationId: CorrelationIdSchema,
  anchorReceiptRefs: z.array(ReceiptRefSchema).default([]),
  lineageRefs: z.array(LineageRefSchema).default([]),
  recordedAtUtc: IsoDateTimeSchema,
});
export type AuthorityActivationTerminationRecord = z.infer<typeof AuthorityActivationTerminationRecordSchema>;

export const AuthorityActivationSummaryContractSchema = z.object({
  activationId: CanonicalIdSchema,
  requestingAuthorityRef: CanonicalStringSchema,
  agentId: CanonicalIdSchema,
  tenantId: CanonicalIdSchema,
  delegationGrantId: CanonicalIdSchema,
  permissionGrantId: CanonicalIdSchema,
  governanceBindingRef: CanonicalStringSchema,
  canonicalStatus: AuthorityActivationStatusSchema,
  status: AuthorityActivationQueryStatusSchema,
  correlationId: CorrelationIdSchema,
  anchorReceiptRefs: z.array(ReceiptRefSchema).default([]),
  lineageRefs: z.array(LineageRefSchema).default([]),
  requestedAtUtc: IsoDateTimeSchema,
  effectiveFromUtc: IsoDateTimeSchema,
  expiresAtUtc: IsoDateTimeSchema,
  badges: z.array(z.string()).default([]),
  readOnly: z.boolean().default(true),
  receiptAnchored: z.boolean().default(true),
});
export type AuthorityActivationSummaryContract = z.infer<typeof AuthorityActivationSummaryContractSchema>;

export const AuthorityActivationDetailContractSchema = z.object({
  summary: AuthorityActivationSummaryContractSchema,
  agentEntityId: CanonicalIdSchema.optional().nullable(),
  domainScope: CanonicalStringSchema,
  policyScope: CanonicalStringSchema,
  policyVersion: CanonicalStringSchema,
  authorityClass: CanonicalStringSchema,
  effectClass: CanonicalStringSchema,
  actionCategories: z.array(CanonicalStringSchema).default([]),
  capabilityCategories: z.array(CanonicalStringSchema).default([]),
  constraintStatements: z.array(z.string()).default([]),
  permittedAuthorityScope: z.object({
    tenantId: CanonicalIdSchema,
    domainScope: CanonicalStringSchema,
    policyScope: CanonicalStringSchema,
    policyVersion: CanonicalStringSchema,
    authorityClass: CanonicalStringSchema,
    effectClass: CanonicalStringSchema,
    actionCategories: z.array(CanonicalStringSchema).default([]),
    capabilityCategories: z.array(CanonicalStringSchema).default([]),
  }).optional().nullable(),
  delegatedAuthorityScope: z.object({
    tenantId: CanonicalIdSchema,
    domainScope: CanonicalStringSchema,
    policyScope: CanonicalStringSchema,
    policyVersion: CanonicalStringSchema,
    authorityClass: CanonicalStringSchema,
    effectClass: CanonicalStringSchema,
  }).optional().nullable(),
  disposition: AuthorityActivationDispositionSchema,
  termination: AuthorityActivationTerminationRecordSchema.optional().nullable(),
});
export type AuthorityActivationDetailContract = z.infer<typeof AuthorityActivationDetailContractSchema>;

export const AuthorityActivationLifecycleTransitionContractSchema = z.object({
  transitionId: CanonicalIdSchema,
  activationId: CanonicalIdSchema,
  fromStatus: AuthorityActivationStatusSchema,
  toStatus: AuthorityActivationStatusSchema,
  actorId: CanonicalIdSchema,
  governanceBindingRef: CanonicalStringSchema,
  reasonCode: AuthorityActivationMediationReasonCodeSchema,
  reason: z.string(),
  anchorReceiptRefs: z.array(ReceiptRefSchema).default([]),
  lineageRefs: z.array(LineageRefSchema).default([]),
  transitionedAtUtc: IsoDateTimeSchema,
});
export type AuthorityActivationLifecycleTransitionContract = z.infer<typeof AuthorityActivationLifecycleTransitionContractSchema>;

export const AuthorityActivationHistoryEntryContractSchema = z.object({
  activationId: CanonicalIdSchema,
  status: AuthorityActivationStatusSchema,
  requestedAtUtc: IsoDateTimeSchema,
  effectiveFromUtc: IsoDateTimeSchema,
  expiresAtUtc: IsoDateTimeSchema,
  dispositionKind: AuthorityActivationDispositionKindSchema,
  reasonCode: AuthorityActivationMediationReasonCodeSchema,
  rationale: z.string(),
  actorId: CanonicalIdSchema.optional().nullable(),
  transitionId: CanonicalIdSchema.optional().nullable(),
  fromStatus: AuthorityActivationStatusSchema.optional().nullable(),
  toStatus: AuthorityActivationStatusSchema.optional().nullable(),
  reason: z.string().optional().nullable(),
  anchorReceiptRefs: z.array(ReceiptRefSchema).default([]),
  lineageRefs: z.array(LineageRefSchema).default([]),
  recordedAtUtc: IsoDateTimeSchema,
});
export type AuthorityActivationHistoryEntryContract = z.infer<typeof AuthorityActivationHistoryEntryContractSchema>;

export const AuthorityActivationHistoryContractSchema = z.object({
  activationId: CanonicalIdSchema,
  delegationGrantId: CanonicalIdSchema,
  permissionGrantId: CanonicalIdSchema,
  governanceBindingRef: CanonicalStringSchema,
  correlationId: CorrelationIdSchema,
  canonicalStatus: AuthorityActivationStatusSchema,
  history: z.array(AuthorityActivationHistoryEntryContractSchema).default([]),
  readOnly: z.boolean().default(true),
});
export type AuthorityActivationHistoryContract = z.infer<typeof AuthorityActivationHistoryContractSchema>;

export const AuthorityActivationLineageContractSchema = z.object({
  activationId: CanonicalIdSchema,
  delegationGrantId: CanonicalIdSchema,
  permissionGrantId: CanonicalIdSchema,
  governanceBindingRef: CanonicalStringSchema,
  correlationId: CorrelationIdSchema,
  lineageRefs: z.array(LineageRefSchema).default([]),
  anchorReceiptRefs: z.array(ReceiptRefSchema).default([]),
  canonicalStatus: AuthorityActivationStatusSchema,
  history: z.array(AuthorityActivationLifecycleTransitionContractSchema).default([]),
  readOnly: z.boolean().default(true),
});
export type AuthorityActivationLineageContract = z.infer<typeof AuthorityActivationLineageContractSchema>;

export const PreparedEffectRequestStatusSchema = z.enum([
  "Materialized",
  "Invalidated",
  "Superseded",
  "Withdrawn",
  "Expired",
]);
export type PreparedEffectRequestStatus = z.infer<typeof PreparedEffectRequestStatusSchema>;

export const PreparedEffectDispositionKindSchema = z.enum([
  "Materialized",
  "Invalidated",
  "Superseded",
  "Withdrawn",
  "Expired",
]);
export type PreparedEffectDispositionKind = z.infer<typeof PreparedEffectDispositionKindSchema>;

export const PreparedEffectMediationReasonCodeSchema = z.enum([
  "PreparationRecorded",
  "PreparationInvalidated",
  "PreparationSuperseded",
  "PreparationWithdrawn",
  "PreparationExpired",
]);
export type PreparedEffectMediationReasonCode = z.infer<typeof PreparedEffectMediationReasonCodeSchema>;

export const PreparedEffectRequestListItemContractSchema = z.object({
  preparedRequestId: CanonicalIdSchema,
  tenantId: CanonicalIdSchema,
  actorId: CanonicalIdSchema,
  agentId: CanonicalIdSchema,
  governanceBindingRef: CanonicalStringSchema,
  delegationGrantId: CanonicalIdSchema,
  permissionGrantId: CanonicalIdSchema,
  activationId: CanonicalIdSchema,
  status: PreparedEffectRequestStatusSchema,
  dispositionKind: PreparedEffectDispositionKindSchema,
  reasonCode: PreparedEffectMediationReasonCodeSchema,
  domainScope: CanonicalStringSchema,
  authorityClass: CanonicalStringSchema,
  effectClass: CanonicalStringSchema,
  actionCategory: CanonicalStringSchema,
  capabilityCategory: CanonicalStringSchema,
  targetClass: CanonicalStringSchema,
  preparedAtUtc: IsoDateTimeSchema,
  expiresAtUtc: IsoDateTimeSchema,
  anchorReceiptRefs: z.array(ReceiptRefSchema).default([]),
  lineageRefs: z.array(LineageRefSchema).default([]),
  badges: z.array(z.string()).default([]),
  readOnly: z.boolean().default(true),
  preparationOnly: z.boolean().default(true),
});
export type PreparedEffectRequestListItemContract = z.infer<typeof PreparedEffectRequestListItemContractSchema>;

export const PreparedEffectRequestDispositionSchema = z.object({
  dispositionId: CanonicalIdSchema,
  preparedRequestId: CanonicalIdSchema,
  kind: PreparedEffectDispositionKindSchema,
  reasonCode: PreparedEffectMediationReasonCodeSchema,
  actorId: CanonicalIdSchema,
  governanceBindingRef: CanonicalStringSchema,
  rationale: z.string(),
  correlationId: CorrelationIdSchema,
  anchorReceiptRefs: z.array(ReceiptRefSchema).default([]),
  lineageRefs: z.array(LineageRefSchema).default([]),
  recordedAtUtc: IsoDateTimeSchema,
});
export type PreparedEffectRequestDisposition = z.infer<typeof PreparedEffectRequestDispositionSchema>;

export const PreparedEffectRequestTerminalRecordSchema = z.object({
  terminalId: CanonicalIdSchema,
  preparedRequestId: CanonicalIdSchema,
  terminalStatus: PreparedEffectRequestStatusSchema,
  actorId: CanonicalIdSchema,
  governanceBindingRef: CanonicalStringSchema,
  reason: z.string(),
  correlationId: CorrelationIdSchema,
  anchorReceiptRefs: z.array(ReceiptRefSchema).default([]),
  lineageRefs: z.array(LineageRefSchema).default([]),
  recordedAtUtc: IsoDateTimeSchema,
});
export type PreparedEffectRequestTerminalRecord = z.infer<typeof PreparedEffectRequestTerminalRecordSchema>;

export const PreparedEffectRequestDetailContractSchema = z.object({
  preparedRequestId: CanonicalIdSchema,
  tenantId: CanonicalIdSchema,
  actorId: CanonicalIdSchema,
  agentId: CanonicalIdSchema,
  governanceBindingRef: CanonicalStringSchema,
  correlationId: CorrelationIdSchema,
  delegationGrantId: CanonicalIdSchema,
  permissionGrantId: CanonicalIdSchema,
  activationId: CanonicalIdSchema,
  selectedBranchId: CanonicalIdSchema,
  collapseId: CanonicalIdSchema,
  reviewId: CanonicalIdSchema,
  heatProfileId: CanonicalIdSchema,
  status: PreparedEffectRequestStatusSchema,
  domainScope: CanonicalStringSchema,
  authorityClass: CanonicalStringSchema,
  effectClass: CanonicalStringSchema,
  actionCategory: CanonicalStringSchema,
  capabilityCategory: CanonicalStringSchema,
  targetClass: CanonicalStringSchema,
  inheritedTargetClass: CanonicalStringSchema,
  activatedScope: z.object({
    tenantId: CanonicalIdSchema,
    domainScope: CanonicalStringSchema,
    policyScope: CanonicalStringSchema,
    policyVersion: CanonicalStringSchema,
    authorityClass: CanonicalStringSchema,
    effectClass: CanonicalStringSchema,
    actionCategories: z.array(CanonicalStringSchema).default([]),
    capabilityCategories: z.array(CanonicalStringSchema).default([]),
  }),
  constraintStatements: z.array(z.string()).default([]),
  disposition: PreparedEffectRequestDispositionSchema,
  terminal: PreparedEffectRequestTerminalRecordSchema.optional().nullable(),
  preparedAtUtc: IsoDateTimeSchema,
  expiresAtUtc: IsoDateTimeSchema,
  anchorReceiptRefs: z.array(ReceiptRefSchema).default([]),
  lineageRefs: z.array(LineageRefSchema).default([]),
  badges: z.array(z.string()).default([]),
  readOnly: z.boolean().default(true),
  preparationOnly: z.boolean().default(true),
});
export type PreparedEffectRequestDetailContract = z.infer<typeof PreparedEffectRequestDetailContractSchema>;

export const PreparedEffectLineageContractSchema = z.object({
  preparedRequestId: CanonicalIdSchema,
  delegationGrantId: CanonicalIdSchema,
  permissionGrantId: CanonicalIdSchema,
  activationId: CanonicalIdSchema,
  governanceBindingRef: CanonicalStringSchema,
  correlationId: CorrelationIdSchema,
  selectedBranchId: CanonicalIdSchema,
  collapseId: CanonicalIdSchema,
  reviewId: CanonicalIdSchema,
  heatProfileId: CanonicalIdSchema,
  lineageRefs: z.array(LineageRefSchema).default([]),
  anchorReceiptRefs: z.array(ReceiptRefSchema).default([]),
  status: PreparedEffectRequestStatusSchema,
  badges: z.array(z.string()).default([]),
  readOnly: z.boolean().default(true),
  preparationOnly: z.boolean().default(true),
});
export type PreparedEffectLineageContract = z.infer<typeof PreparedEffectLineageContractSchema>;

export const ListReformAdoptionDecisionsResponseSchema = z.object({
  items: z.array(ReformAdoptionDecisionContractSchema),
});
export type ListReformAdoptionDecisionsResponse = z.infer<typeof ListReformAdoptionDecisionsResponseSchema>;

export const GetReformAdoptionDecisionDetailResponseSchema = z.object({
  decision: ReformAdoptionDecisionContractSchema,
  mutationReceiptGroups: z.array(StrategyMutationReceiptGroupContractSchema).default([]),
});
export type GetReformAdoptionDecisionDetailResponse = z.infer<typeof GetReformAdoptionDecisionDetailResponseSchema>;

export const ListDelegatedAuthorityGrantsResponseSchema = z.object({
  items: z.array(DelegatedAuthorityGrantSummaryContractSchema),
});
export type ListDelegatedAuthorityGrantsResponse = z.infer<typeof ListDelegatedAuthorityGrantsResponseSchema>;

export const GetDelegatedAuthorityGrantDetailResponseSchema = z.object({
  grant: DelegatedAuthorityGrantDetailContractSchema,
});
export type GetDelegatedAuthorityGrantDetailResponse = z.infer<typeof GetDelegatedAuthorityGrantDetailResponseSchema>;

export const GetDelegatedAuthorityLineageResponseSchema = z.object({
  lineage: DelegationLineageContractSchema,
});
export type GetDelegatedAuthorityLineageResponse = z.infer<typeof GetDelegatedAuthorityLineageResponseSchema>;

export const ListAgentPermissionGrantsResponseSchema = z.object({
  items: z.array(AgentPermissionGrantSummaryContractSchema),
});
export type ListAgentPermissionGrantsResponse = z.infer<typeof ListAgentPermissionGrantsResponseSchema>;

export const GetAgentPermissionGrantDetailResponseSchema = z.object({
  grant: AgentPermissionGrantDetailContractSchema,
});
export type GetAgentPermissionGrantDetailResponse = z.infer<typeof GetAgentPermissionGrantDetailResponseSchema>;

export const GetAgentPermissionLineageResponseSchema = z.object({
  lineage: AgentPermissionLineageContractSchema,
});
export type GetAgentPermissionLineageResponse = z.infer<typeof GetAgentPermissionLineageResponseSchema>;

export const ListAuthorityActivationsResponseSchema = z.object({
  items: z.array(AuthorityActivationSummaryContractSchema),
});
export type ListAuthorityActivationsResponse = z.infer<typeof ListAuthorityActivationsResponseSchema>;

export const GetAuthorityActivationDetailResponseSchema = z.object({
  activation: AuthorityActivationDetailContractSchema,
});
export type GetAuthorityActivationDetailResponse = z.infer<typeof GetAuthorityActivationDetailResponseSchema>;

export const GetAuthorityActivationHistoryResponseSchema = z.object({
  history: AuthorityActivationHistoryContractSchema,
});
export type GetAuthorityActivationHistoryResponse = z.infer<typeof GetAuthorityActivationHistoryResponseSchema>;

export const GetAuthorityActivationLineageResponseSchema = z.object({
  lineage: AuthorityActivationLineageContractSchema,
});
export type GetAuthorityActivationLineageResponse = z.infer<typeof GetAuthorityActivationLineageResponseSchema>;

export const ListPreparedEffectRequestsResponseSchema = z.object({
  items: z.array(PreparedEffectRequestListItemContractSchema),
});
export type ListPreparedEffectRequestsResponse = z.infer<typeof ListPreparedEffectRequestsResponseSchema>;

export const GetPreparedEffectRequestDetailResponseSchema = z.object({
  preparedEffect: PreparedEffectRequestDetailContractSchema,
});
export type GetPreparedEffectRequestDetailResponse = z.infer<typeof GetPreparedEffectRequestDetailResponseSchema>;

export const GetPreparedEffectLineageResponseSchema = z.object({
  lineage: PreparedEffectLineageContractSchema,
});
export type GetPreparedEffectLineageResponse = z.infer<typeof GetPreparedEffectLineageResponseSchema>;
