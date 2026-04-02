"use client";

import { StepShell } from "@/components/onboarding/step-shell";
import { Button } from "@/components/ui/button";
import { useOnboardingState } from "@/lib/onboarding/store";

export function ArrivalStep() {
  const { beginSetup } = useOnboardingState();

  return (
    <StepShell
      eyebrow="Step 0"
      title="Welcome to Keon Control"
      description="Set up your governed workspace in a few guided steps. We will keep the path clear and handle the complexity behind the scenes."
      footer={<Button size="lg" onClick={beginSetup}>Begin Setup</Button>}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          "Choose what you want to enable first.",
          "Confirm the right workspace for your setup.",
          "Watch your first governed decision produce a receipt.",
        ].map((item, index) => (
          <div key={item} className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5">
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#B6F09C]">0{index + 1}</div>
            <p className="mt-4 text-sm leading-6 text-white/74">{item}</p>
          </div>
        ))}
      </div>
    </StepShell>
  );
}
