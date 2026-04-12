"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { getCurrentBlocker, getEntryRoute, getReadinessLabel } from "@/lib/onboarding/experience";
import { useOnboardingState } from "@/lib/onboarding/store";
import { useTenantBinding } from "@/lib/control-plane/tenant-binding";

export function NextStepCard() {
  const { state } = useOnboardingState();
  const { confirmedTenant, confirmedEnvironment } = useTenantBinding();
  const href = state.completed ? "/integrations" : getEntryRoute(state);
  const label = state.completed ? "Connect an integration" : "Continue setup";
  const body = state.completed
    ? "Your workspace is ready. Connect your first runtime or service to start governing real AI actions."
    : getCurrentBlocker(state);

  return (
    <Card className="border-[#66FCF1]/20 bg-[#66FCF1]/5">
      <CardHeader title="Next step" description={getReadinessLabel(state)} />
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="font-['Rajdhani'] text-xl font-semibold text-[#C5C6C7]">
            {state.completed ? "Move from setup into day-to-day use" : "Finish the required setup path"}
          </div>
          <p className="max-w-3xl font-mono text-sm leading-6 text-[#C5C6C7] opacity-80">{body}</p>
          {confirmedTenant && confirmedEnvironment && (
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#66FCF1]">
              Workspace: {confirmedTenant.name} / {confirmedEnvironment}
            </div>
          )}
        </div>
        <Button asChild>
          <Link href={href}>{label}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
