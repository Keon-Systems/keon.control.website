"use client";

import { useQuery } from "@tanstack/react-query";
import type { CollectiveChainStage } from "@/lib/collective/chain.dto";
import { getCollectiveChainStageLabel } from "@/lib/collective/chain.normalization";
import { collectiveObservabilityQueryKeys } from "@/lib/collective/queryKeys";
import {
  createAgentPermissionRepository,
  createAuthorityActivationRepository,
  createDelegatedAuthorityRepository,
  createExecutionEligibilityRepository,
  createPreparedEffectRepository,
} from "@/lib/collective/repositories";
import { createInvocationPreviewRepository } from "@/lib/collective/invocation-preview.repositories";
import { buildInvocationDescriptorPresentation } from "@/lib/collective/invocation-descriptor.dto";
import { createInvocationDescriptorRepository } from "@/lib/collective/invocation-descriptor.repositories";
import { Panel, PanelContent } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────
// Guided content for each of the guided steps
// ──────────────────────────────────────────────

type GuidedStageContent = {
  key: CollectiveChainStage | "invocationDescriptor";
  stage?: CollectiveChainStage;
  title: string;
  meaning: string;
  whyItMatters: string;
  connection: string;
  constitutionalNote?: string;
};

const GUIDED_CONTENT: readonly GuidedStageContent[] = [
  {
    key: "reform",
    stage: "reform",
    title: getCollectiveChainStageLabel("reform"),
    meaning: "This is where proposed change enters the system.",
    whyItMatters:
      "Reforms are the origin point for constitutional change.",
    connection:
      "A reform may be assessed for legitimacy before anything is adopted.",
  },
  {
    key: "legitimacy",
    stage: "legitimacy",
    title: getCollectiveChainStageLabel("legitimacy"),
    meaning:
      "This stage evaluates whether the proposed change is sound and supportable.",
    whyItMatters:
      "Legitimacy helps distinguish serious change from weak or unsafe change.",
    connection:
      "A legitimacy assessment can inform, but does not itself adopt, the reform.",
  },
  {
    key: "adoption",
    stage: "adoption",
    title: getCollectiveChainStageLabel("adoption"),
    meaning:
      "This stage records whether a proposed reform was accepted, rejected, superseded, or revoked.",
    whyItMatters: "Adoption is where reform outcomes become explicit.",
    connection:
      "An adopted reform may lead to downstream strategic mutation records.",
  },
  {
    key: "mutation",
    stage: "mutation",
    title: getCollectiveChainStageLabel("mutation"),
    meaning: "This stage records strategic state changes caused by adoption.",
    whyItMatters: "It shows what changed after a reform decision.",
    connection:
      "Mutation records consequences; they do not grant runtime authority by themselves.",
  },
  {
    key: "delegation",
    stage: "delegation",
    title: getCollectiveChainStageLabel("delegation"),
    meaning:
      "This stage defines bounded authority passed from one authority holder to another.",
    whyItMatters:
      "Delegation establishes who may act within specific limits.",
    connection: "Delegation is upstream of permission and activation.",
  },
  {
    key: "permission",
    stage: "permission",
    title: getCollectiveChainStageLabel("permission"),
    meaning:
      "This stage scopes what an agent is allowed to do under a delegation.",
    whyItMatters:
      "Permissions narrow authority into specific capabilities and actions.",
    connection: "Permissions must remain within delegation bounds.",
  },
  {
    key: "activation",
    stage: "activation",
    title: getCollectiveChainStageLabel("activation"),
    meaning:
      "This stage records whether a granted permission is eligible or active at runtime.",
    whyItMatters:
      "Activation reflects runtime posture, not broad authority creation.",
    connection:
      "Activation must remain within permission and delegation bounds.",
  },
  {
    key: "preparedEffect",
    stage: "preparedEffect",
    title: getCollectiveChainStageLabel("preparedEffect"),
    meaning:
      "This stage represents a staged effect that remains inert and non-executable from this surface.",
    whyItMatters:
      "It shows what has been prepared without granting execution authority.",
    connection:
      "A prepared effect may sit at the edge of execution governance, but it is still not an execution command.",
    constitutionalNote:
      "Prepared effects are staged only. They do not carry execution authority.",
  },
  {
    key: "invocationDescriptor",
    title: "Invocation Descriptor",
    meaning:
      "This step records the structural shape of authority, requirements, and constraints for a prepared effect.",
    whyItMatters:
      "It makes invocation legible without turning structure into capability.",
    connection:
      "The descriptor sits beside eligibility and preview as a structural reference before lineage inspection.",
    constitutionalNote:
      "This defines structure, not capability.",
  },
];

const TOTAL_STEPS = GUIDED_CONTENT.length;

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface CollectiveChainGuidedPanelProps {
  readonly stepIndex: number;
  readonly isStagePresentInChain: boolean;
  readonly preparedEffectId?: string | null;
  readonly onNext: () => void;
  readonly onBack: () => void;
  readonly onExit: () => void;
}

// ──────────────────────────────────────────────
// Component — Full-width single-lane layout
// ──────────────────────────────────────────────

export function CollectiveChainGuidedPanel({
  stepIndex,
  isStagePresentInChain,
  preparedEffectId,
  onNext,
  onBack,
  onExit,
}: CollectiveChainGuidedPanelProps) {
  const content = GUIDED_CONTENT[stepIndex];
  const showPreparedEffectContext =
    Boolean(preparedEffectId)
    && (content?.key === "preparedEffect" || content?.key === "invocationDescriptor");
  const preparedEffect = useQuery({
    queryKey: preparedEffectId
      ? collectiveObservabilityQueryKeys.preparedEffects.detail(preparedEffectId)
      : ["collective", "prepared-effects", "detail", "absent"] as const,
    queryFn: () => createPreparedEffectRepository().detail(preparedEffectId!),
    enabled: showPreparedEffectContext,
    staleTime: 0,
  });
  const eligibility = useQuery({
    queryKey: preparedEffectId
      ? collectiveObservabilityQueryKeys.executionEligibility.detail(preparedEffectId)
      : ["collective", "execution-eligibility", "detail", "absent"] as const,
    queryFn: () => createExecutionEligibilityRepository().evaluate(preparedEffectId!),
    enabled: showPreparedEffectContext,
    staleTime: 0,
  });
  const activation = useQuery({
    queryKey: preparedEffect.data?.activationId
      ? collectiveObservabilityQueryKeys.authorityActivations.detail(preparedEffect.data.activationId)
      : ["collective", "authority-activations", "detail", "absent"] as const,
    queryFn: () => createAuthorityActivationRepository().detail(preparedEffect.data!.activationId),
    enabled: showPreparedEffectContext && Boolean(preparedEffect.data?.activationId),
    staleTime: 0,
  });
  const permission = useQuery({
    queryKey: preparedEffect.data?.permissionGrantId
      ? collectiveObservabilityQueryKeys.agentPermissions.detail(preparedEffect.data.permissionGrantId)
      : ["collective", "agent-permissions", "detail", "absent"] as const,
    queryFn: () => createAgentPermissionRepository().detail(preparedEffect.data!.permissionGrantId),
    enabled: showPreparedEffectContext && Boolean(preparedEffect.data?.permissionGrantId),
    staleTime: 0,
  });
  const delegation = useQuery({
    queryKey: preparedEffect.data?.delegationGrantId
      ? collectiveObservabilityQueryKeys.delegatedAuthority.detail(preparedEffect.data.delegationGrantId)
      : ["collective", "delegated-authority", "detail", "absent"] as const,
    queryFn: () => createDelegatedAuthorityRepository().detail(preparedEffect.data!.delegationGrantId),
    enabled: showPreparedEffectContext && Boolean(preparedEffect.data?.delegationGrantId),
    staleTime: 0,
  });
  const invocationPreview = useQuery({
    queryKey: preparedEffectId
      ? collectiveObservabilityQueryKeys.invocationPreview.detail(preparedEffectId)
      : ["collective", "invocation-preview", "detail", "absent"] as const,
    queryFn: () =>
      createInvocationPreviewRepository().preview({
        preparedEffect: preparedEffect.data!,
        activation: activation.data ?? null,
        permission: permission.data ?? null,
        delegation: delegation.data ?? null,
        eligibility: eligibility.data!,
        evaluatedAtUtc: eligibility.data!.evaluatedAtUtc,
      }),
    enabled: showPreparedEffectContext && Boolean(preparedEffect.data) && Boolean(eligibility.data),
    staleTime: 0,
  });
  const invocationDescriptor = useQuery({
    queryKey: preparedEffectId
      ? collectiveObservabilityQueryKeys.invocationDescriptor.detail(preparedEffectId)
      : ["collective", "invocation-descriptor", "detail", "absent"] as const,
    queryFn: () =>
      createInvocationDescriptorRepository().describe({
        preparedEffect: preparedEffect.data!,
        activation: activation.data ?? null,
        permission: permission.data ?? null,
        delegation: delegation.data ?? null,
        eligibility: eligibility.data!,
        preview: invocationPreview.data!,
      }),
    enabled:
      showPreparedEffectContext
      && Boolean(preparedEffect.data)
      && Boolean(eligibility.data)
      && Boolean(invocationPreview.data),
    staleTime: 0,
  });

  if (!content) return null;

  const stageLabel = content.title;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === TOTAL_STEPS - 1;
  const isDescriptorStep = content.key === "invocationDescriptor";
  const stagePresent = isDescriptorStep ? Boolean(preparedEffectId) : isStagePresentInChain;

  return (
    <Panel className="w-full border-[--reactor-blue]/30">
      <PanelContent className="space-y-4 p-4">
        {/* Combined header: STEP N OF 8 — STAGE NAME */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[--steel]">
              Step {stepIndex + 1} of {TOTAL_STEPS}
            </span>
            <span className="text-[--tungsten]">&mdash;</span>
            <h3 className="text-sm font-semibold font-mono uppercase tracking-wide text-[--flash]">
              {stageLabel}
            </h3>
            {!stagePresent && (
              <Badge variant="offline">NOT PRESENT</Badge>
            )}
          </div>
          <button
            type="button"
            onClick={onExit}
            className="text-[--tungsten] hover:text-[--steel] transition-colors p-1"
            aria-label="Exit guided tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Missing stage notice */}
        {!stagePresent && (
          <div className="rounded-sm border border-dashed border-[--tungsten] p-2">
            <p className="text-[10px] font-mono text-[--tungsten] leading-relaxed">
              This stage is not present in the current chain. Partial chains are
              constitutionally normal.
            </p>
          </div>
        )}

        {/* Content grid — horizontal on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[--steel] mb-1">
              Meaning
            </p>
            <p className="text-xs font-mono text-[--flash] leading-relaxed">
              {content.meaning}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[--steel] mb-1">
              Why it matters
            </p>
            <p className="text-xs font-mono text-[--flash] leading-relaxed">
              {content.whyItMatters}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[--steel] mb-1">
              Connection
            </p>
            <p className="text-xs font-mono text-[--flash] leading-relaxed">
              {content.connection}
            </p>
          </div>
        </div>

        {/* Constitutional note (prepared effect) */}
        {content.constitutionalNote && (
          <div className="rounded-sm border border-dashed border-[--safety-orange]/40 bg-[--safety-orange]/5 p-2">
            <p className="text-[10px] font-mono font-semibold text-[--safety-orange] leading-relaxed">
              {content.constitutionalNote}
            </p>
          </div>
        )}

        {showPreparedEffectContext && content.key === "preparedEffect" && eligibility.data && (
          <div className="rounded-sm border border-[--tungsten]/30 p-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-[--steel]">
              Execution Eligibility
            </p>
            <p className="mt-1 text-xs font-mono text-[--flash]">
              {eligibility.data.statusPresentation.label}
            </p>
          </div>
        )}

        {showPreparedEffectContext && content.key === "preparedEffect" && invocationPreview.data && (
          <div className="rounded-sm border border-[--tungsten]/30 p-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-[--steel]">
              Invocation Preview
            </p>
            <p className="mt-1 text-xs font-mono text-[--flash]">
              {invocationPreview.data.statusPresentation.label}
            </p>
          </div>
        )}

        {showPreparedEffectContext && isDescriptorStep && invocationDescriptor.data && (
          <div className="rounded-sm border border-[--tungsten]/30 p-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-[--steel]">
              Invocation Descriptor
            </p>
            <p className="mt-1 text-xs font-mono text-[--flash]">
              {buildInvocationDescriptorPresentation(invocationDescriptor.data.status).label}
            </p>
            <p className="mt-1 text-[10px] font-mono text-[--safety-orange]">
              This defines structure, not capability.
            </p>
          </div>
        )}

        {/* Tour closing statement on final step */}
        {isLast && (
          <div className="border-t border-[--tungsten]/30 pt-3 space-y-2">
            <p className="text-[11px] font-mono text-[--steel] text-center leading-relaxed">
              This system lets you trace how authority forms — without ever granting it accidentally.
            </p>
            <p className="text-[10px] font-mono font-semibold text-[--safety-orange] text-center">
              Viewing a chain does not authorize action.
            </p>
          </div>
        )}

        {/* Navigation controls — centered, prominent */}
        <div className="flex items-center justify-center gap-6 border-t border-[--tungsten]/30 pt-4">
          <button
            type="button"
            onClick={onBack}
            disabled={isFirst}
            className={cn(
              "inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded-sm transition-colors",
              isFirst
                ? "text-[--tungsten]/40 cursor-not-allowed"
                : "text-[--steel] hover:text-[--flash] hover:bg-[--tungsten]/10",
            )}
            aria-label="Previous stage"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5" aria-hidden>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  i === stepIndex
                    ? "bg-[--reactor-glow] shadow-[0_0_4px_rgba(102,252,241,0.5)]"
                    : i < stepIndex
                      ? "bg-[--reactor-blue]/50"
                      : "bg-[--tungsten]/40",
                )}
              />
            ))}
          </div>

          {isLast ? (
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-4 py-1.5 rounded-sm border border-[--reactor-glow]/50 bg-[--reactor-blue]/15 text-[--reactor-glow] hover:bg-[--reactor-blue]/25 hover:border-[--reactor-glow]/70 transition-colors"
              aria-label="Finish tour"
            >
              <Check className="h-3.5 w-3.5" />
              Finish Tour
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-1.5 font-mono text-xs font-medium px-4 py-1.5 rounded-sm border border-[--reactor-blue]/50 bg-[--reactor-blue]/10 text-[--reactor-glow] hover:bg-[--reactor-blue]/20 hover:border-[--reactor-glow]/60 transition-colors group"
              aria-label="Next stage"
            >
              Next
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </PanelContent>
    </Panel>
  );
}

export { GUIDED_CONTENT, TOTAL_STEPS };
export type { GuidedStageContent };
