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

export function presentExecutionEligibilityStatus(raw: ExecutionEligibilityStatus): LifecyclePresentation<ExecutionEligibilityStatus> {
  return mapPresentation(raw, {
    eligible: { label: "Eligible", tone: "success" },
    not_eligible: { label: "Not Eligible", tone: "danger" },
  });
}
