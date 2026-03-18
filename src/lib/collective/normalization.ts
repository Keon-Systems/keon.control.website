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
import type {
  BadgePresentation,
  DispositionPresentation,
  LifecyclePresentation,
  PresentationTone,
} from "./dto";

function titleCase(raw: string): string {
  return raw.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
}

function mapPresentation<TState extends string>(
  raw: TState,
  mappings: Partial<Record<TState, { label: string; tone: PresentationTone }>>,
): LifecyclePresentation<TState> {
  const mapped = mappings[raw];
  return {
    raw,
    label: mapped?.label ?? titleCase(raw),
    tone: mapped?.tone ?? "neutral",
  };
}

export function normalizeBadge(raw: string): BadgePresentation {
  const lowered = raw.toLowerCase();
  const tone: PresentationTone = lowered.includes("reject") || lowered.includes("revoke") || lowered.includes("invalid")
    ? "danger"
    : lowered.includes("expire") || lowered.includes("suspend") || lowered.includes("contest")
      ? "warning"
      : lowered.includes("active") || lowered.includes("approve") || lowered.includes("eligible") || lowered.includes("record")
        ? "success"
        : lowered.includes("scope") || lowered.includes("lineage")
          ? "info"
          : "neutral";

  return {
    raw,
    label: titleCase(raw),
    tone,
  };
}

export function normalizeBadges(badges: readonly string[]): BadgePresentation[] {
  return badges.map(normalizeBadge);
}

export function presentReformAdoptionStatus(raw: ReformAdoptionStatus): LifecyclePresentation<ReformAdoptionStatus> {
  return mapPresentation(raw, {
    ApprovedForAdoption: { label: "Approved for Adoption", tone: "success" },
    Rejected: { label: "Rejected", tone: "danger" },
    Superseded: { label: "Superseded", tone: "warning" },
    Revoked: { label: "Revoked", tone: "danger" },
  });
}

export function presentReformAdoptionDisposition(raw: ReformAdoptionDisposition): DispositionPresentation<ReformAdoptionDisposition> {
  return mapPresentation(raw, {
    Approved: { label: "Approved", tone: "success" },
    Rejected: { label: "Rejected", tone: "danger" },
    Superseded: { label: "Superseded", tone: "warning" },
    Revoked: { label: "Revoked", tone: "danger" },
  });
}

export function presentStrategyMutationOperation(raw: StrategyMutationOperation): LifecyclePresentation<StrategyMutationOperation> {
  return mapPresentation(raw, {
    Activate: { label: "Activate", tone: "success" },
    Supersede: { label: "Supersede", tone: "warning" },
    Retire: { label: "Retire", tone: "neutral" },
  });
}

export function presentDelegationStatus(raw: DelegationStatus): LifecyclePresentation<DelegationStatus> {
  return mapPresentation(raw, {
    Draft: { label: "Draft", tone: "neutral" },
    Proposed: { label: "Proposed", tone: "info" },
    Active: { label: "Active", tone: "success" },
    Expired: { label: "Expired", tone: "warning" },
    Revoked: { label: "Revoked", tone: "danger" },
    Rejected: { label: "Rejected", tone: "danger" },
  });
}

export function presentDelegationQueryStatus(raw: DelegationQueryStatus): LifecyclePresentation<DelegationQueryStatus> {
  return presentDelegationStatus(raw);
}

export function presentAgentPermissionStatus(raw: AgentPermissionStatus): LifecyclePresentation<AgentPermissionStatus> {
  return mapPresentation(raw, {
    Draft: { label: "Draft", tone: "neutral" },
    Active: { label: "Active", tone: "success" },
    Expired: { label: "Expired", tone: "warning" },
    Revoked: { label: "Revoked", tone: "danger" },
    Rejected: { label: "Rejected", tone: "danger" },
  });
}

export function presentAgentPermissionQueryStatus(raw: AgentPermissionQueryStatus): LifecyclePresentation<AgentPermissionQueryStatus> {
  return presentAgentPermissionStatus(raw);
}

export function presentAuthorityActivationStatus(raw: AuthorityActivationStatus): LifecyclePresentation<AuthorityActivationStatus> {
  return mapPresentation(raw, {
    Draft: { label: "Draft", tone: "neutral" },
    Pending: { label: "Pending", tone: "info" },
    Eligible: { label: "Eligible", tone: "success" },
    Ineligible: { label: "Ineligible", tone: "danger" },
    Suspended: { label: "Suspended", tone: "warning" },
    Expired: { label: "Expired", tone: "warning" },
    Revoked: { label: "Revoked", tone: "danger" },
    Rejected: { label: "Rejected", tone: "danger" },
  });
}

export function presentAuthorityActivationQueryStatus(raw: AuthorityActivationQueryStatus): LifecyclePresentation<AuthorityActivationQueryStatus> {
  return presentAuthorityActivationStatus(raw);
}

export function presentAuthorityActivationDisposition(raw: AuthorityActivationDispositionKind): DispositionPresentation<AuthorityActivationDispositionKind> {
  return mapPresentation(raw, {
    EligibilityConfirmed: { label: "Eligibility Confirmed", tone: "success" },
    EligibilityDenied: { label: "Eligibility Denied", tone: "danger" },
    Suspended: { label: "Suspended", tone: "warning" },
    Revoked: { label: "Revoked", tone: "danger" },
    Rejected: { label: "Rejected", tone: "danger" },
    Expired: { label: "Expired", tone: "warning" },
  });
}

export function presentAuthorityActivationReasonCode(raw: AuthorityActivationMediationReasonCode): DispositionPresentation<AuthorityActivationMediationReasonCode> {
  return mapPresentation(raw, {
    GovernanceReviewRequested: { label: "Governance Review Requested", tone: "info" },
    GovernanceEligibilityConfirmed: { label: "Governance Eligibility Confirmed", tone: "success" },
    GovernanceEligibilityDenied: { label: "Governance Eligibility Denied", tone: "danger" },
    GovernanceSuspended: { label: "Governance Suspended", tone: "warning" },
    GovernanceRevoked: { label: "Governance Revoked", tone: "danger" },
    GovernanceRejected: { label: "Governance Rejected", tone: "danger" },
    GovernanceWindowExpired: { label: "Governance Window Expired", tone: "warning" },
  });
}

export function presentPreparedEffectStatus(raw: PreparedEffectRequestStatus): LifecyclePresentation<PreparedEffectRequestStatus> {
  return mapPresentation(raw, {
    Materialized: { label: "Materialized", tone: "success" },
    Invalidated: { label: "Invalidated", tone: "danger" },
    Superseded: { label: "Superseded", tone: "warning" },
    Withdrawn: { label: "Withdrawn", tone: "warning" },
    Expired: { label: "Expired", tone: "warning" },
  });
}

export function presentPreparedEffectDisposition(raw: PreparedEffectDispositionKind): DispositionPresentation<PreparedEffectDispositionKind> {
  return mapPresentation(raw, {
    Materialized: { label: "Materialized", tone: "success" },
    Invalidated: { label: "Invalidated", tone: "danger" },
    Superseded: { label: "Superseded", tone: "warning" },
    Withdrawn: { label: "Withdrawn", tone: "warning" },
    Expired: { label: "Expired", tone: "warning" },
  });
}

export function presentPreparedEffectReasonCode(raw: PreparedEffectMediationReasonCode): DispositionPresentation<PreparedEffectMediationReasonCode> {
  return mapPresentation(raw, {
    PreparationRecorded: { label: "Preparation Recorded", tone: "info" },
    PreparationInvalidated: { label: "Preparation Invalidated", tone: "danger" },
    PreparationSuperseded: { label: "Preparation Superseded", tone: "warning" },
    PreparationWithdrawn: { label: "Preparation Withdrawn", tone: "warning" },
    PreparationExpired: { label: "Preparation Expired", tone: "warning" },
  });
}
