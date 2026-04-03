"use client";

import { StepShell } from "@/components/onboarding/step-shell";
import { Button } from "@/components/ui/button";
import { useTenantBinding } from "@/lib/control-plane/tenant-binding";
import { useOnboardingState } from "@/lib/onboarding/store";
import { cn } from "@/lib/utils";
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
      <span>Checking workspace...</span>
    </div>
  );
}

export function ScopeConfirmationStep() {
  const {
    tenants,
    isLoading,
    isError,
    retry,
    selectedTenantId,
    selectTenant,
    confirmBinding,
  } = useTenantBinding();
  const { confirmScope } = useOnboardingState();
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
      confirmScope(selectedTenant.id);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [confirmBinding, confirmScope, selectedTenant, viewState]);

  return (
    <StepShell
      eyebrow="Step 3"
      title="Confirm your workspace"
      description="We use this to load your policies, receipts, and configuration."
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
            <div className="font-display text-2xl font-semibold text-white">Loading your workspace</div>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
              We are checking which workspace should receive your policies, receipts, and configuration.
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
            <div className="font-display text-2xl font-semibold text-white">We&apos;re preparing your workspace.</div>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
              This usually takes a moment. Retry to check again. Once your workspace is ready, you&apos;ll be able to confirm and continue.
            </p>
            <p className="mt-3 text-sm leading-6 text-white/58">You can continue once your workspace is available.</p>
          </div>
        </div>
      ) : viewState === "confirmed" ? (
        <div className="space-y-5 rounded-[24px] border border-[#7EE8E0]/30 bg-[#7EE8E0]/10 p-6">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#7EE8E0]">Workspace confirmed</div>
          <div className="font-display text-3xl font-semibold text-white">{selectedTenant?.name}</div>
          <p className="text-sm leading-7 text-white/74">
            Workspace confirmed. Preparing the right policies, receipts, and configuration now.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tenants.length === 1 ? (
            <div className="rounded-[24px] border border-[#7EE8E0]/30 bg-[#7EE8E0]/10 p-6">
              <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#7EE8E0]">Detected workspace</div>
              <div className="mt-3 font-display text-3xl font-semibold text-white">{tenants[0]?.name}</div>
              <p className="mt-3 text-sm leading-7 text-white/72">
                This is the workspace tied to your access. Confirm it to keep setup aligned with the right policies and receipts.
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
                      Keon will use this workspace to keep setup, receipts, and governance aligned.
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
