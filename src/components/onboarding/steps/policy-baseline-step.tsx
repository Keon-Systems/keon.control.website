"use client";

import { StepShell } from "@/components/onboarding/step-shell";
import { Button } from "@/components/ui/button";
import { useOnboardingState } from "@/lib/onboarding/store";
import { cn } from "@/lib/utils";
import type { GuardrailPreset } from "@/lib/onboarding/state-machine";
import { useRouter } from "next/navigation";
import * as React from "react";

const guardrailOptions: {
  id: GuardrailPreset;
  title: string;
  description: string;
  outcome: string;
}[] = [
  {
    id: "strict",
    title: "Strict",
    description: "Block sensitive actions until the right proof or review is present.",
    outcome: "Best when high-impact changes should stop unless everything is in place.",
  },
  {
    id: "balanced",
    title: "Balanced",
    description: "Let routine work keep moving while protecting riskier actions.",
    outcome: "Best when you want trust and momentum without heavy friction.",
  },
  {
    id: "flexible",
    title: "Flexible",
    description: "Keep decisions visible while allowing more actions to proceed.",
    outcome: "Best when your team needs lighter guardrails and fast iteration.",
  },
];

export function PolicyBaselineStep() {
  const router = useRouter();
  const {
    state: { guardrailPreset },
    applyGuardrails,
  } = useOnboardingState();
  const [selection, setSelection] = React.useState<GuardrailPreset | null>(guardrailPreset);

  return (
    <StepShell
      eyebrow="Step 3"
      title="Choose your starter guardrails"
      description="This is the default review posture for your workspace. You can refine it later, but choosing it now makes the product ready for first use."
      footer={
        <Button
          size="lg"
          disabled={!selection}
          onClick={() => {
            if (!selection) {
              return;
            }

            applyGuardrails(selection);
            router.replace("/setup?step=ready");
          }}
        >
          Review ready state
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        {guardrailOptions.map((option) => {
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
