"use client";

import { StepShell } from "@/components/onboarding/step-shell";
import { Button } from "@/components/ui/button";
import { useTenantBinding } from "@/lib/control-plane/tenant-binding";
import { useOnboardingState } from "@/lib/onboarding/store";
import { useRouter } from "next/navigation";

const goalLabels: Record<string, string> = {
  "govern-ai-actions": "Governance Runtime",
  "memory-and-context": "Cortex",
  "oversight-and-collaboration": "Collective",
};

const guardrailLabels: Record<string, string> = {
  strict: "Strict",
  balanced: "Balanced",
  flexible: "Flexible",
};

export function CompleteStep() {
  const router = useRouter();
  const { confirmedTenant, confirmedEnvironment } = useTenantBinding();
  const {
    state: { selectedGoals, guardrailPreset },
    finishOnboarding,
  } = useOnboardingState();

  return (
    <StepShell
      eyebrow="Basic setup complete"
      title="Workspace prepared."
      description="Keon knows what to protect, which workspace to prepare, and which guardrails to apply. Connect your first integration to start governing real AI actions."
      footer={
        <Button
          size="lg"
          onClick={() => {
            finishOnboarding();
            router.replace("/integrations");
          }}
        >
          Connect your first integration
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#7EE8E0]">Configured now</div>
          <div className="mt-4 font-display text-3xl font-semibold text-white">{confirmedTenant?.name ?? "Selected workspace"}</div>
          <p className="mt-3 text-sm leading-7 text-white/72">
            Starting environment: {confirmedEnvironment ?? "sandbox"}.
          </p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#7EE8E0]">Starter guardrails</div>
          <div className="mt-4 font-display text-3xl font-semibold text-white">
            {guardrailPreset ? guardrailLabels[guardrailPreset] : "Selected"}
          </div>
          <p className="mt-3 text-sm leading-7 text-white/72">
            You can adjust approvals, reviews, and policy rules later from Guardrails.
          </p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#7EE8E0]">Selected goals</div>
          <div className="mt-4 space-y-2 text-sm leading-7 text-white/72">
            {selectedGoals.map((goal) => (
              <div key={goal}>{goalLabels[goal] ?? goal}</div>
            ))}
          </div>
        </div>
      </div>
    </StepShell>
  );
}
