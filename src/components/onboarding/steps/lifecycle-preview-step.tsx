"use client";

import { StepShell } from "@/components/onboarding/step-shell";
import { Button } from "@/components/ui/button";
import { useOnboardingState } from "@/lib/onboarding/store";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const LIFECYCLE_STAGES = [
  {
    label: "Intent submitted",
    detail: "An AI-driven action is proposed and enters the governance pipeline.",
    color: "text-[#7EE8E0]",
    border: "border-[#7EE8E0]/40",
    bg: "bg-[#7EE8E0]/08",
  },
  {
    label: "Branches evaluate",
    detail: "Multiple agents assess the action independently across parallel branches.",
    color: "text-white/70",
    border: "border-white/15",
    bg: "bg-white/[0.03]",
  },
  {
    label: "Adversarial challenge",
    detail: "One branch is required to argue against — surfacing risk the others may have missed.",
    color: "text-[#F4D35E]",
    border: "border-[#F4D35E]/35",
    bg: "bg-[#F4D35E]/06",
  },
  {
    label: "Vote & converge",
    detail: "Branches cast weighted votes. The outcome with the strongest governed case wins.",
    color: "text-white/70",
    border: "border-white/15",
    bg: "bg-white/[0.03]",
  },
  {
    label: "Sealed outcome",
    detail: "The winning decision is cryptographically sealed. It cannot be altered or replayed.",
    color: "text-[#B6F09C]",
    border: "border-[#B6F09C]/35",
    bg: "bg-[#B6F09C]/06",
  },
  {
    label: "Receipt issued",
    detail: "An immutable receipt records what happened, why it was authorized, and the policy hash.",
    color: "text-[#7EE8E0]",
    border: "border-[#7EE8E0]/40",
    bg: "bg-[#7EE8E0]/08",
  },
] as const;

export function LifecyclePreviewStep() {
  const router = useRouter();
  const { advanceLifecyclePreview } = useOnboardingState();

  const handleContinue = () => {
    advanceLifecyclePreview();
    router.replace("/setup?step=guardrails");
  };

  return (
    <StepShell
      eyebrow="How Keon governs decisions"
      title="Every governed action follows the same lifecycle."
      description="This is what makes Keon different from a monitoring tool. Actions do not just complete — they branch, get challenged, converge through a governed process, and seal a receipt before anything executes."
      footer={
        <div className="flex flex-wrap items-center gap-4">
          <Button size="lg" onClick={handleContinue}>
            Continue to guardrails
          </Button>
          <a
            href="/collective/showcase"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#7EE8E0] border border-[#7EE8E0]/28 rounded-[6px] px-4 py-2 bg-[#7EE8E0]/05 hover:bg-[#7EE8E0]/11 hover:border-[#7EE8E0]/48 transition-colors"
          >
            Explore full walkthrough ↗
          </a>
        </div>
      }
    >
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute left-5 top-10 bottom-10 w-px bg-gradient-to-b from-[#7EE8E0]/30 via-white/10 to-[#7EE8E0]/30 hidden sm:block" />
        <div className="space-y-3">
          {LIFECYCLE_STAGES.map((stage, i) => (
            <div key={stage.label} className="flex items-start gap-4">
              <div
                className={cn(
                  "relative z-10 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-bold",
                  stage.border,
                  stage.bg,
                  stage.color
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className={cn("flex-1 rounded-[14px] border p-4", stage.border, stage.bg)}>
                <div className={cn("font-mono text-[10px] uppercase tracking-[0.18em]", stage.color)}>
                  {stage.label}
                </div>
                <p className="mt-1.5 text-sm leading-6 text-white/65">{stage.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </StepShell>
  );
}
