"use client";

import { StepShell } from "@/components/onboarding/step-shell";
import { Button } from "@/components/ui/button";
import { useTenantBinding } from "@/lib/control-plane/tenant-binding";
import { useOnboardingState } from "@/lib/onboarding/store";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import * as React from "react";

type ScopeViewState = "loading" | "recoverable_failure" | "ready_to_confirm" | "confirmed";

function getScopeViewState(input: {
  isLoading: boolean;
  isError: boolean;
  hasTenants: boolean;
  hasSelectedTenant: boolean;
  isConfirming: boolean;
  isRetrying: boolean;
}): ScopeViewState {
  if (input.isConfirming) {
    return "confirmed";
  }

  if (input.isLoading || input.isRetrying || (input.hasTenants && !input.hasSelectedTenant)) {
    return "loading";
  }

  if (input.isError || !input.hasTenants) {
    return "recoverable_failure";
  }

  return "ready_to_confirm";
}

function LoadingPulse() {
  return (
    <div className="flex items-center gap-3 text-sm text-white/66">
      <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#7EE8E0]" />
      <span>Checking workspace access...</span>
    </div>
  );
}

export function ScopeConfirmationStep() {
  const router = useRouter();
  const {
    tenants,
    isLoading,
    isError,
    retry,
    selectedTenantId,
    selectTenant,
    environment,
    setEnvironment,
    confirmBinding,
    isTestMode,
  } = useTenantBinding();
  const { confirmAccess } = useOnboardingState();
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [isRetrying, setIsRetrying] = React.useState(false);

  React.useEffect(() => {
    if (!selectedTenantId && tenants.length > 0) {
      selectTenant(tenants[0].id);
    }
  }, [selectTenant, selectedTenantId, tenants]);

  React.useEffect(() => {
    if (isRetrying && !isLoading) {
      setIsRetrying(false);
    }
  }, [isLoading, isRetrying]);

  const selectedTenant = tenants.find((tenant) => tenant.id === selectedTenantId) ?? null;
  const viewState = getScopeViewState({
    isLoading,
    isError,
    hasTenants: tenants.length > 0,
    hasSelectedTenant: !!selectedTenant,
    isConfirming,
    isRetrying,
  });

  React.useEffect(() => {
    if (viewState !== "confirmed" || !selectedTenant) {
      return;
    }

    const timer = window.setTimeout(() => {
      confirmBinding();
      confirmAccess(selectedTenant.id);
      router.replace("/setup?step=integration");
    }, 450);

    return () => window.clearTimeout(timer);
  }, [confirmAccess, confirmBinding, router, selectedTenant, viewState]);

  return (
    <StepShell
      eyebrow="Step 2"
      title="Confirm your workspace access"
      description="Choose the workspace and environment Keon should prepare. This determines where guardrails, receipts, and later integrations will apply."
      footer={
        viewState === "ready_to_confirm" ? (
          <Button
            size="lg"
            onClick={() => {
              if (!selectedTenant) {
                return;
              }

              setIsConfirming(true);
            }}
          >
            Confirm and continue
          </Button>
        ) : viewState === "recoverable_failure" ? (
          <Button
            variant="secondary"
            onClick={() => {
              setIsRetrying(true);
              retry();
            }}
          >
            Retry
          </Button>
        ) : null
      }
    >
      {viewState === "loading" ? (
        <div className="space-y-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
          <div>
            <div className="font-display text-2xl font-semibold text-white">Loading your available workspaces</div>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
              We are checking which workspaces are available to this access link.
            </p>
          </div>
          <LoadingPulse />
          <div className="space-y-4">
            {[0, 1].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.04]" />
            ))}
          </div>
        </div>
      ) : viewState === "recoverable_failure" ? (
        <div className="space-y-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
          <div>
            <div className="font-display text-2xl font-semibold text-white">We&apos;re still checking access.</div>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
              Retry in a moment. Once access details are available, you&apos;ll be able to confirm the right workspace and continue.
            </p>
            <p className="mt-3 text-sm leading-6 text-white/58">You can continue once your workspace is available.</p>
          </div>
        </div>
      ) : viewState === "confirmed" ? (
        <div className="space-y-5 rounded-[24px] border border-[#7EE8E0]/30 bg-[#7EE8E0]/10 p-6">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#7EE8E0]">Workspace confirmed</div>
          <div className="font-display text-3xl font-semibold text-white">{selectedTenant?.name}</div>
          <p className="text-sm leading-7 text-white/74">
            Keon is preparing {environment} for this workspace now.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {isTestMode && (
            <div className="rounded-[24px] border border-[#F4D35E]/30 bg-[#F4D35E]/10 p-6">
              <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#F4D35E]">Test activation mode</div>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
                This internal test path is pinned to the Keon internal test workspace in sandbox. It does not represent a real invitation or tenant provisioning run.
              </p>
            </div>
          )}
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#7EE8E0]">Environment</div>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
              Choose where you want to start. Most teams begin in sandbox, then return later to prepare production.
            </p>
            <div className="mt-5 inline-flex rounded-full border border-white/10 bg-black/20 p-1">
              {(["sandbox", "production"] as const).map((option) => {
                const active = environment === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setEnvironment(option)}
                    disabled={isTestMode && option !== "sandbox"}
                    className={cn(
                      "rounded-full px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] transition",
                      active ? "bg-white text-[#061117]" : "text-white/60 hover:text-white",
                      isTestMode && option !== "sandbox" && "cursor-not-allowed opacity-40 hover:text-white/60"
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          {tenants.length === 1 ? (
            <div className="rounded-[24px] border border-[#7EE8E0]/30 bg-[#7EE8E0]/10 p-6">
              <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#7EE8E0]">Detected workspace</div>
              <div className="mt-3 font-display text-3xl font-semibold text-white">{tenants[0]?.name}</div>
              <p className="mt-3 text-sm leading-7 text-white/72">
                This is the workspace tied to your access. Confirm it so setup stays aligned with the right environment and later evidence.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {tenants.map((tenant) => {
                const active = tenant.id === selectedTenantId;
                return (
                  <button
                    key={tenant.id}
                    type="button"
                    onClick={() => selectTenant(tenant.id)}
                    className={cn(
                      "rounded-[24px] border p-6 text-left transition-all duration-200",
                      active
                        ? "border-[#7EE8E0] bg-[linear-gradient(180deg,rgba(126,232,224,0.16),rgba(126,232,224,0.06))]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]"
                    )}
                  >
                    <div className="font-display text-2xl font-semibold text-white">{tenant.name}</div>
                    <p className="mt-3 text-sm leading-7 text-white/72">
                      Keon will use this workspace to keep setup, evidence, and approvals aligned.
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </StepShell>
  );
}
