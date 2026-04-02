"use client";

import { Card, CardContent, CardHeader } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTenantBinding } from "@/lib/control-plane/tenant-binding";

const environmentOptions = [
  {
    value: "sandbox",
    label: "Prepare safely",
    description: "Use a governed dry-run path while you validate policies, setup steps, and expected outcomes.",
  },
  {
    value: "production",
    label: "Go live",
    description: "Use the live governed boundary when you are ready for receipt-backed actions in your workspace.",
  },
] as const;

export function TenantBindingCard({
  title = "Confirm your workspace",
  description = "We need to confirm your workspace before personalized setup can continue. This loads the right policies, receipts, and configuration steps.",
  compact = false,
}: {
  title?: string;
  description?: string;
  compact?: boolean;
}) {
  const {
    tenants,
    isLoading,
    isError,
    selectedTenantId,
    confirmedTenantId,
    environment,
    confirmedEnvironment,
    isConfirmed,
    selectTenant,
    setEnvironment,
    confirmBinding,
    retry,
  } = useTenantBinding();

  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardContent className={cn("space-y-4", compact && "space-y-3")}>
        {isLoading && (
          <div className="rounded border border-[#384656] bg-[#0B0C10] p-4 font-mono text-sm leading-6 text-[#C5C6C7] opacity-80">
            Loading your workspace details so we can personalize the next setup steps.
          </div>
        )}

        {isError && !isLoading && (
          <div className="rounded border border-[#384656] bg-[#0B0C10] p-4">
            <p className="font-mono text-sm leading-6 text-[#C5C6C7] opacity-80">
              We couldn’t load your workspace details yet. Try again, or contact your administrator if this continues.
            </p>
            <Button className="mt-4" size="sm" variant="secondary" onClick={retry}>Try again</Button>
          </div>
        )}

        {!isLoading && !isError && tenants.length === 0 && (
          <div className="rounded border border-[#384656] bg-[#0B0C10] p-4 font-mono text-sm leading-6 text-[#C5C6C7] opacity-80">
            No workspace is available for this sign-in yet. Ask your administrator to grant access, then return to continue setup.
          </div>
        )}

        {!isLoading && !isError && tenants.length > 0 && (
          <>
            <div className="space-y-2">
              <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#66FCF1]">1. Select your workspace</div>
              <div className="grid gap-2 md:grid-cols-2">
                {tenants.map((tenant) => {
                  const isSelected = tenant.id === selectedTenantId;
                  const isBound = tenant.id === confirmedTenantId;

                  return (
                    <button
                      key={tenant.id}
                      type="button"
                      onClick={() => selectTenant(tenant.id)}
                      className={cn(
                        "rounded border p-4 text-left transition-colors",
                        isSelected
                          ? "border-[#66FCF1] bg-[#66FCF1]/8"
                          : "border-[#384656] bg-[#0B0C10] hover:border-[#66FCF1]/40"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-['Rajdhani'] text-lg font-semibold text-[#C5C6C7]">{tenant.name}</div>
                        {isBound && <Badge variant="healthy">Confirmed</Badge>}
                      </div>
                      <p className="mt-2 font-mono text-xs leading-5 text-[#C5C6C7] opacity-70">
                        Keon will use this workspace to load the right policies, receipts, and configuration steps.
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#66FCF1]">2. Choose how you want to begin</div>
              <div className="grid gap-2 md:grid-cols-2">
                {environmentOptions.map((option) => {
                  const active = option.value === environment;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setEnvironment(option.value)}
                      className={cn(
                        "rounded border p-4 text-left transition-colors",
                        active
                          ? "border-[#66FCF1] bg-[#66FCF1]/8"
                          : "border-[#384656] bg-[#0B0C10] hover:border-[#66FCF1]/40"
                      )}
                    >
                      <div className="font-['Rajdhani'] text-lg font-semibold text-[#C5C6C7]">{option.label}</div>
                      <p className="mt-2 font-mono text-xs leading-5 text-[#C5C6C7] opacity-75">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded border border-[#384656] bg-[#0B0C10] p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#66FCF1]">3. Confirm workspace scope</div>
                  <p className="mt-2 font-mono text-sm leading-6 text-[#C5C6C7] opacity-80">
                    Once confirmed, Keon can safely personalize setup without guessing the wrong workspace or governed boundary.
                  </p>
                  {isConfirmed && confirmedTenantId && confirmedEnvironment && (
                    <p className="mt-2 font-mono text-xs text-[#C5C6C7] opacity-60">
                      Ready for personalized setup in this workspace.
                    </p>
                  )}
                </div>
                <Button onClick={confirmBinding} disabled={!selectedTenantId}>
                  {isConfirmed ? "Workspace confirmed" : "Confirm workspace"}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
