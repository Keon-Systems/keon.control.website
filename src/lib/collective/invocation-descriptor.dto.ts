import type {
  AgentPermissionGrantDetail,
  AuthorityActivationDetail,
  DelegatedAuthorityGrantDetail,
  PreparedEffectRequestDetail,
  PresentationTone,
} from "./dto";
import type { ExecutionEligibilityView } from "./eligibility.dto";
import type {
  InvocationAuthorityContext,
  InvocationPreviewView,
  InvocationRequirement,
} from "./invocation-preview.dto";

export type InvocationDescriptorStatus = "unavailable" | "constrained" | "ready";

export interface InvocationDescriptorRequirement extends InvocationRequirement {
  readonly source: "invocation_preview";
}

export interface InvocationDescriptorConstraint {
  readonly code: string;
  readonly message: string;
  readonly satisfied: boolean;
  readonly references: readonly string[];
}

export interface InvocationDescriptorConstraintSet {
  readonly scopeConstraints: readonly InvocationDescriptorConstraint[];
  readonly temporalConstraints: readonly InvocationDescriptorConstraint[];
  readonly authorityConstraints: readonly InvocationDescriptorConstraint[];
}

export interface InvocationDescriptorReference {
  readonly preparedEffectId: string;
  readonly surface: "execution_eligibility" | "invocation_preview";
  readonly status: string;
  readonly evaluatedAtUtc: string;
}

export interface InvocationDescriptorSource {
  readonly preparedEffect: PreparedEffectRequestDetail;
  readonly activation: AuthorityActivationDetail | null;
  readonly permission: AgentPermissionGrantDetail | null;
  readonly delegation: DelegatedAuthorityGrantDetail | null;
  readonly eligibility: ExecutionEligibilityView;
  readonly preview: InvocationPreviewView;
}

export interface InvocationDescriptor {
  readonly preparedEffectId: string;
  readonly status: InvocationDescriptorStatus;
  readonly requiredAuthorityContext: InvocationAuthorityContext;
  readonly requirementSet: readonly InvocationDescriptorRequirement[];
  readonly constraintSet: InvocationDescriptorConstraintSet;
  readonly eligibilityReference: InvocationDescriptorReference;
  readonly previewReference: InvocationDescriptorReference;
}

const STATUS_PRESENTATION: Record<
  InvocationDescriptorStatus,
  { label: string; tone: PresentationTone }
> = {
  unavailable: { label: "Unavailable", tone: "neutral" },
  constrained: { label: "Constrained", tone: "warning" },
  ready: { label: "Aligned", tone: "success" },
};

const STATUS_SUMMARY: Record<InvocationDescriptorStatus, string> = {
  unavailable:
    "This descriptor records structure that is currently unavailable within the authority chain.",
  constrained:
    "This descriptor records structure that remains constrained by explicit requirements and bounds.",
  ready:
    "This descriptor records structure whose explicit requirements and bounds are presently aligned.",
};

export function buildInvocationDescriptorPresentation(
  status: InvocationDescriptorStatus,
): { label: string; tone: PresentationTone } {
  return STATUS_PRESENTATION[status];
}

export function buildInvocationDescriptorSummary(status: InvocationDescriptorStatus): string {
  return STATUS_SUMMARY[status];
}
