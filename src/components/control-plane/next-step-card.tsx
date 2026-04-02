"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { useOnboardingPreferences } from "@/lib/control-plane/onboarding-preferences";
import { useTenantContext } from "@/lib/control-plane/tenant-context";
import { useTenantBinding } from "@/lib/control-plane/tenant-binding";

function getNextStep(input: {
  hasPreferences: boolean;
  hasTenants: boolean;
  isConfirmed: boolean;
  tenantStatus?: string;
  operatorModeEnabled?: boolean;
  selectedTracks: string[];
}) {
  if (!input.hasPreferences) {
    return {
      title: "Choose your setup path",
      body: "Select the capabilities you are setting up first so Keon can build the right onboarding checklist instead of forcing every user through the same flow.",
      href: "/",
      label: "Choose setup path",
    };
  }

  if (!input.hasTenants) {
    return {
      title: "Create or connect a tenant",
      body: "No tenant memberships are visible yet. Tenant creation is the first governance boundary.",
      href: "/tenants",
      label: "Open tenants",
    };
  }

  if (!input.isConfirmed) {
    return {
      title: "Confirm tenant scope",
      body: "Bind the tenant and environment you intend to inspect before opening usage, policy, or receipt views.",
      href: "/get-started",
      label: "Confirm scope",
    };
  }

  if (input.selectedTracks.includes("governed-execution") && input.tenantStatus !== "active") {
    return {
      title: "Publish the governance baseline",
      body: "The selected tenant is not active yet. Complete the baseline and consequences flow before live execution.",
      href: "/policies",
      label: "Review policy baseline",
    };
  }

  if (input.selectedTracks.includes("collective-oversight")) {
    return {
      title: "Configure collective oversight",
      body: "Your chosen setup path includes collective governance. Establish deliberation and legitimacy posture next.",
      href: "/collective",
      label: "Open Collective",
    };
  }

  if (input.selectedTracks.includes("memory-context")) {
    return {
      title: "Prepare memory and context boundaries",
      body: "Your setup path includes memory-backed workflows. Establish boundaries and inspect downstream context surfaces next.",
      href: "/get-started",
      label: "Continue onboarding",
    };
  }

  if (!input.operatorModeEnabled) {
    return {
      title: "Run first governed action",
      body: "The scope is bound, but expert inspection is still secondary until the first governed action is completed.",
      href: "/get-started",
      label: "Continue onboarding",
    };
  }

  return {
    title: "Open expert inspection",
    body: "The tenant is active and operator mode is enabled. Continue from the verified system-state surface.",
    href: "/cockpit",
    label: "Open System State",
  };
}

export function NextStepCard() {
  const { me } = useTenantContext();
  const { tenants, isConfirmed, confirmedTenant, confirmedEnvironment } = useTenantBinding();
  const { hasPreferences, selectedTracks } = useOnboardingPreferences();
  const nextStep = getNextStep({
    hasPreferences,
    hasTenants: tenants.length > 0,
    isConfirmed,
    tenantStatus: confirmedTenant?.status,
    operatorModeEnabled: me?.operatorModeEnabled,
    selectedTracks,
  });

  return (
    <Card className="border-[#66FCF1]/20 bg-[#66FCF1]/5">
      <CardHeader title="Next step" description="One clear path stays visible until this tenant is fully onboarded." />
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="font-['Rajdhani'] text-xl font-semibold text-[#C5C6C7]">{nextStep.title}</div>
          <p className="max-w-3xl font-mono text-sm leading-6 text-[#C5C6C7] opacity-80">{nextStep.body}</p>
          {confirmedTenant && confirmedEnvironment && (
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#66FCF1]">
              Bound scope: {confirmedTenant.name} / {confirmedEnvironment}
            </div>
          )}
        </div>
        <Button asChild>
          <Link href={nextStep.href}>{nextStep.label}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
