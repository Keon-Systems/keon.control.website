"use client";

import { StepShell } from "@/components/onboarding/step-shell";
import { Button } from "@/components/ui/button";
import { useOnboardingState } from "@/lib/onboarding/store";
import { cn } from "@/lib/utils";
import type { PolicyBaseline } from "@/lib/onboarding/state-machine";
import * as React from "react";

const baselineOptions: {
  id: PolicyBaseline;
  title: string;
  description: string;
  outcome: string;
}[] = [
  {
    id: "strict",
    title: "Strict",
    description: "Blocks sensitive actions until the right proof or review is present.",
    outcome: "Best when high-impact changes should stop unless everything is in place.",
  },
  {
    id: "balanced",
    title: "Balanced",
    description: "Lets routine work keep moving while protecting riskier actions.",
    outcome: "Best when you want trust and momentum without heavy friction.",
  },
  {
    id: "flexible",
    title: "Flexible",
    description: "Keeps decisions visible while allowing more actions to proceed.",
    outcome: "Best when your team needs lighter guardrails and fast iteration.",
  },
];

export function PolicyBaselineStep() {
  const {
    state: { policyBaseline },
    applyPolicyBaseline,
  } = useOnboardingState();
  const [selection, setSelection] = React.useState<PolicyBaseline | null>(policyBaseline);

  return (
    <StepShell
      eyebrow="Step 3"
      title="Choose your governance baseline"
      description="This sets the starting posture for how actions are evaluated in your workspace. You can refine it later, but this gives Keon a clear default right now."
      footer={
        <Button size="lg" disabled={!selection} onClick={() => selection && applyPolicyBaseline(selection)}>
          Apply and continue
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        {baselineOptions.map((option) => {
          const active = selection === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelection(option.id)}
              className={cn(
                "rounded-[24px] border p-6 text-left transition-all duration-200",
                active
                  ? "border-[#B6F09C] bg-[linear-gradient(180deg,rgba(182,240,156,0.18),rgba(126,232,224,0.06))]"
                  : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]"
              )}
            >
              <div className="font-display text-3xl font-semibold text-white">{option.title}</div>
              <p className="mt-4 text-sm leading-7 text-white/72">{option.description}</p>
              <p className="mt-5 border-t border-white/10 pt-5 text-xs uppercase tracking-[0.2em] text-[#B6F09C]">{option.outcome}</p>
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}
