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
      eyebrow="Ready to use"
      title="Your workspace is ready."
      description="Keon Control now knows what you want to protect, which workspace to prepare, and which starter guardrails to apply. You can start using the workspace overview now and return later for optional setup."
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            size="lg"
            onClick={() => {
              finishOnboarding();
              router.replace("/control");
            }}
          >
            Open workspace overview
          </Button>
          <Button size="lg" variant="secondary" onClick={() => router.push("/integrations")}>
            Connect an integration later
          </Button>
        </div>
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
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#7EE8E0]">What you can do now</div>
          <div className="mt-4 space-y-2 text-sm leading-7 text-white/72">
            {selectedGoals.map((goal) => (
              <div key={goal}>{goalLabels[goal] ?? goal}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[24px] border border-white/10 bg-black/20 p-6">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-white/60">Next best action</div>
          <p className="mt-3 text-sm leading-7 text-white/72">
            Open the workspace overview to verify readiness, review the current posture, and move into receipts or guardrails from a stable starting point.
          </p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-black/20 p-6">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-white/60">Optional later</div>
          <p className="mt-3 text-sm leading-7 text-white/72">
            Connect integrations, inspect sample receipts, and set up collaborative review when your team is ready.
          </p>
        </div>
      </div>
    </StepShell>
  );
}
