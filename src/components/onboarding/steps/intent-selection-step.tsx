"use client";

import { StepShell } from "@/components/onboarding/step-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingState } from "@/lib/onboarding/store";
import type { OnboardingIntent } from "@/lib/onboarding/state-machine";
import * as React from "react";

const intentOptions: { id: OnboardingIntent; title: string; description: string }[] = [
  {
    id: "govern-ai-actions",
    title: "Govern AI actions",
    description: "Make high-impact actions run through clear decisions and receipts.",
  },
  {
    id: "memory-and-context",
    title: "Add memory and context",
    description: "Keep the right context available so work stays grounded and consistent.",
  },
  {
    id: "oversight-and-collaboration",
    title: "Enable oversight and collaboration",
    description: "Bring the right people into review when actions need shared visibility.",
  },
];

export function IntentSelectionStep() {
  const {
    state: { selectedIntent },
    saveIntentSelection,
  } = useOnboardingState();
  const [selection, setSelection] = React.useState<OnboardingIntent[]>(selectedIntent);

  const toggleIntent = (intent: OnboardingIntent) => {
    setSelection((current) =>
      current.includes(intent) ? current.filter((item) => item !== intent) : [...current, intent]
    );
  };

  return (
    <StepShell
      eyebrow="Step 1"
      title="What do you want Keon Control to turn on first?"
      description="Choose the outcomes you want from day one. Your selections shape the rest of setup so the next decisions stay relevant."
      footer={
        <Button size="lg" disabled={selection.length === 0} onClick={() => saveIntentSelection(selection)}>
          Continue
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        {intentOptions.map((option) => {
          const active = selection.includes(option.id);

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggleIntent(option.id)}
              className={cn(
                "rounded-[24px] border p-6 text-left transition-all duration-200",
                active
                  ? "border-[#7EE8E0] bg-[linear-gradient(180deg,rgba(126,232,224,0.16),rgba(126,232,224,0.06))]"
                  : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]"
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="font-display text-2xl font-semibold text-white">{option.title}</div>
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border font-mono text-xs uppercase",
                    active ? "border-[#7EE8E0] bg-[#7EE8E0] text-[#062125]" : "border-white/20 text-white/55"
                  )}
                >
                  {active ? "On" : "Off"}
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-white/72">{option.description}</p>
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}
