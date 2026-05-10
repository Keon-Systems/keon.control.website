"use client";

import { useCallback } from "react";
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
    state: { selectedGoals, guardrailPreset, selectedIntegrationMode, workspaceId },
    finishOnboarding,
  } = useOnboardingState();

  const recordCompletion = useCallback(async () => {
    // BEST-EFFORT: Persists onboarding completion to DB via POST /api/onboarding/complete.
    // This call is fire-and-forget. The UI redirect to /integrations happens regardless
    // of whether this succeeds. A successful redirect is NOT proof that DB persistence
    // occurred — that only happens once iron-session auth is wired and the session guard
    // resolves a real tenant context. Until then the endpoint returns 401 and the DB
    // record is not written. When auth lands, replace this with an awaited call that
    // gates the redirect on a successful 200 response.
    try {
      // Omit workspaceId when null — the endpoint will resolve the tenant's single
      // default workspace automatically. If the tenant has multiple workspaces, the
      // endpoint returns 409 and the call fails silently (acceptable for now).
      const payload: Record<string, unknown> = {
        snapshot: { selectedGoals, guardrailPreset, selectedIntegrationMode },
      };
      if (workspaceId) payload.workspaceId = workspaceId;

      await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Network errors are intentionally swallowed; completion is non-blocking.
    }
  }, [workspaceId, selectedGoals, guardrailPreset, selectedIntegrationMode]);

  return (
    <StepShell
      eyebrow="Basic setup complete"
      title="Setup choices confirmed."
      description="Keon has your workspace binding, primary goal, operating model, and starter guardrails for this browser session. Connect your first integration to begin live governance in this workspace."
      footer={
        <Button
          size="lg"
          onClick={async () => {
            void recordCompletion();
            finishOnboarding();
            router.replace("/integrations");
          }}
        >
          Connect your first integration
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#7EE8E0]">Workspace</div>
          <div className="mt-4 font-display text-2xl font-semibold text-white">
            {confirmedTenant?.name ?? "Selected workspace"}
          </div>
          <p className="mt-3 text-sm leading-7 text-white/72">
            Environment: {confirmedEnvironment ?? "sandbox"}.
          </p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#7EE8E0]">Primary goal</div>
          <div className="mt-4 space-y-2 text-sm leading-7 text-white/72">
            {selectedGoals.length > 0
              ? selectedGoals.map((goal) => <div key={goal}>{goalLabels[goal] ?? goal}</div>)
              : <div className="text-white/40">None selected</div>
            }
          </div>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#7EE8E0]">Operating model</div>
          <div className="mt-4 font-display text-2xl font-semibold text-white">
            {selectedIntegrationMode === "BYO_AI"
              ? "BYO AI"
              : selectedIntegrationMode === "COLLECTIVE"
              ? "Keon Collective"
              : "Not selected"}
          </div>
          <p className="mt-3 text-sm leading-7 text-white/72">
            How Keon evaluates and seals governed decisions.
          </p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#7EE8E0]">Starter guardrails</div>
          <div className="mt-4 font-display text-2xl font-semibold text-white">
            {guardrailPreset ? guardrailLabels[guardrailPreset] : "Not selected"}
          </div>
          <p className="mt-3 text-sm leading-7 text-white/72">
            Adjustable from Guardrails after setup.
          </p>
        </div>
      </div>
    </StepShell>
  );
}
