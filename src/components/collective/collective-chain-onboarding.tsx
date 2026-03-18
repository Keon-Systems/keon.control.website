"use client";

import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface CollectiveChainOnboardingProps {
  readonly onDismiss: () => void;
}

type OnboardingStep = {
  id: string;
  title: string;
  description: string;
};

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "reform",
    title: "Reform",
    description:
      "Proposals or artifacts of change. A reform enters the pipeline as a hosted artifact anchored to deliberation evidence.",
  },
  {
    id: "legitimacy",
    title: "Legitimacy",
    description:
      "Assesses whether the proposed change is sound. Legitimacy evaluations are dimension-backed and may be contested.",
  },
  {
    id: "adoption",
    title: "Adoption",
    description:
      "Records whether the change was accepted or rejected. Adoption decisions preserve anchored lineage and constitutional posture.",
  },
  {
    id: "mutation",
    title: "Strategy Mutation",
    description:
      "Records resulting strategic state changes. A mutation receipt captures the shift that precedes operational delegation.",
  },
  {
    id: "delegation",
    title: "Delegation",
    description:
      "Defines bounded authority. Delegation narrows a strategy mutation into a specific actor-bound observation grant.",
  },
  {
    id: "permission",
    title: "Permission",
    description:
      "Scopes what an agent may do. Permission reduces delegation into specific read and observe categories.",
  },
  {
    id: "activation",
    title: "Activation",
    description:
      "Records runtime eligibility. Activation confirms eligibility within delegated scope but does not imply execution.",
  },
  {
    id: "prepared-effect",
    title: "Prepared Effect",
    description:
      "Staged only and remains inert. A prepared effect materializes an intent for downstream observation. It authorizes no execution flow.",
  },
];

export function CollectiveChainOnboarding({ onDismiss }: CollectiveChainOnboardingProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  return (
    <Panel className="w-full border-[--reactor-blue]/20">
      <PanelHeader>
        <PanelTitle>Understanding This Chain</PanelTitle>
        <button
          type="button"
          onClick={onDismiss}
          className="text-[--tungsten] hover:text-[--steel] transition-colors"
          aria-label="Dismiss onboarding"
        >
          <X className="h-4 w-4" />
        </button>
      </PanelHeader>

      <PanelContent className="space-y-1 p-2">
        <p className="px-2 pb-2 text-[10px] font-mono text-[--steel] leading-relaxed">
          Each stage in the chain represents a distinct constitutional step.
          Some stages may be missing if later pipeline steps have not occurred.
        </p>

        {ONBOARDING_STEPS.map((step) => {
          const isExpanded = expandedStep === step.id;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setExpandedStep(isExpanded ? null : step.id)}
              className={cn(
                "w-full rounded-sm px-3 py-2 text-left transition-colors",
                "hover:bg-[--tungsten]/10",
                isExpanded && "bg-[--tungsten]/10",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[--flash]">
                  {step.title}
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3 text-[--tungsten]" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-[--tungsten]" />
                )}
              </div>
              {isExpanded && (
                <p className="mt-1 text-[10px] font-mono text-[--steel] leading-relaxed">
                  {step.description}
                </p>
              )}
            </button>
          );
        })}

        <div className="mt-3 border-t border-[--tungsten]/30 pt-3 px-2">
          <p className="text-[10px] font-mono text-[--tungsten] leading-relaxed">
            Missing stages are expected when the constitutional pipeline has not
            advanced beyond a certain point. Prepared effects are always inert.
          </p>
          <p className="mt-2 text-[10px] font-mono font-semibold text-[--safety-orange]">
            This dashboard observes authority. It does not grant it.
          </p>
        </div>
      </PanelContent>
    </Panel>
  );
}
