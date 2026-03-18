"use client";

import type { CollectiveChainStage } from "@/lib/collective/chain.dto";
import { getCollectiveChainStageLabel } from "@/lib/collective/chain.normalization";
import { Panel, PanelContent } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────
// Guided content for each of the 8 canonical stages
// ──────────────────────────────────────────────

type GuidedStageContent = {
  stage: CollectiveChainStage;
  meaning: string;
  whyItMatters: string;
  connection: string;
  constitutionalNote?: string;
};

const GUIDED_CONTENT: readonly GuidedStageContent[] = [
  {
    stage: "reform",
    meaning: "This is where proposed change enters the system.",
    whyItMatters:
      "Reforms are the origin point for constitutional change.",
    connection:
      "A reform may be assessed for legitimacy before anything is adopted.",
  },
  {
    stage: "legitimacy",
    meaning:
      "This stage evaluates whether the proposed change is sound and supportable.",
    whyItMatters:
      "Legitimacy helps distinguish serious change from weak or unsafe change.",
    connection:
      "A legitimacy assessment can inform, but does not itself adopt, the reform.",
  },
  {
    stage: "adoption",
    meaning:
      "This stage records whether a proposed reform was accepted, rejected, superseded, or revoked.",
    whyItMatters: "Adoption is where reform outcomes become explicit.",
    connection:
      "An adopted reform may lead to downstream strategic mutation records.",
  },
  {
    stage: "mutation",
    meaning: "This stage records strategic state changes caused by adoption.",
    whyItMatters: "It shows what changed after a reform decision.",
    connection:
      "Mutation records consequences; they do not grant runtime authority by themselves.",
  },
  {
    stage: "delegation",
    meaning:
      "This stage defines bounded authority passed from one authority holder to another.",
    whyItMatters:
      "Delegation establishes who may act within specific limits.",
    connection: "Delegation is upstream of permission and activation.",
  },
  {
    stage: "permission",
    meaning:
      "This stage scopes what an agent is allowed to do under a delegation.",
    whyItMatters:
      "Permissions narrow authority into specific capabilities and actions.",
    connection: "Permissions must remain within delegation bounds.",
  },
  {
    stage: "activation",
    meaning:
      "This stage records whether a granted permission is eligible or active at runtime.",
    whyItMatters:
      "Activation reflects runtime posture, not broad authority creation.",
    connection:
      "Activation must remain within permission and delegation bounds.",
  },
  {
    stage: "preparedEffect",
    meaning:
      "This stage represents a staged effect that remains inert and non-executable from this surface.",
    whyItMatters:
      "It shows what has been prepared without granting execution authority.",
    connection:
      "A prepared effect may sit at the edge of execution governance, but it is still not an execution command.",
    constitutionalNote:
      "Prepared effects are staged only. They do not carry execution authority.",
  },
];

const TOTAL_STEPS = GUIDED_CONTENT.length;

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface CollectiveChainGuidedPanelProps {
  readonly stepIndex: number;
  readonly isStagePresentInChain: boolean;
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
  onNext,
  onBack,
  onExit,
}: CollectiveChainGuidedPanelProps) {
  const content = GUIDED_CONTENT[stepIndex];
  if (!content) return null;

  const stageLabel = getCollectiveChainStageLabel(content.stage);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === TOTAL_STEPS - 1;

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
            {!isStagePresentInChain && (
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
        {!isStagePresentInChain && (
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

        {/* Tour closing — system insight + constitutional statement */}
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
