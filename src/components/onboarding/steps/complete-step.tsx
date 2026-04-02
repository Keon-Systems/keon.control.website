"use client";

import { StepShell } from "@/components/onboarding/step-shell";
import { Button } from "@/components/ui/button";
import { useTenantBinding } from "@/lib/control-plane/tenant-binding";
import { useOnboardingState } from "@/lib/onboarding/store";
import { useRouter } from "next/navigation";

const intentLabels: Record<string, string> = {
  "govern-ai-actions": "Govern AI actions",
  "memory-and-context": "Add memory and context",
  "oversight-and-collaboration": "Enable oversight and collaboration",
};

const baselineLabels: Record<string, string> = {
  strict: "Strict",
  balanced: "Balanced",
  flexible: "Flexible",
};

export function CompleteStep() {
  const router = useRouter();
  const { confirmedTenant } = useTenantBinding();
  const {
    state: { selectedIntent, policyBaseline },
    finishOnboarding,
  } = useOnboardingState();

  return (
    <StepShell
      eyebrow="Step 5"
      title="Your system is now governed"
      description="Keon Control is configured for this workspace, with traceability in place from the first governed decision onward."
      footer={
        <Button
          size="lg"
          onClick={() => {
            finishOnboarding();
            router.replace("/control");
          }}
        >
          Enter Control Plane
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#7EE8E0]">Workspace</div>
          <div className="mt-4 font-display text-3xl font-semibold text-white">{confirmedTenant?.name ?? "Confirmed"}</div>
          <p className="mt-3 text-sm leading-7 text-white/72">Policies, receipts, and configuration are now tied to this workspace.</p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#7EE8E0]">Baseline</div>
          <div className="mt-4 font-display text-3xl font-semibold text-white">
            {policyBaseline ? baselineLabels[policyBaseline] : "Ready"}
          </div>
          <p className="mt-3 text-sm leading-7 text-white/72">Your starting governance posture is active and can be refined later from the control plane.</p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#7EE8E0]">Enabled outcomes</div>
          <div className="mt-4 space-y-2 text-sm leading-7 text-white/72">
            {selectedIntent.map((intent) => (
              <div key={intent}>{intentLabels[intent] ?? intent}</div>
            ))}
          </div>
        </div>
      </div>
    </StepShell>
  );
}
