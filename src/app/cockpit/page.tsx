"use client";

import Link from "next/link";
import { DoctrineExplainer, TenantScopeGuard } from "@/components/control-plane";
import { CockpitShell } from "@/components/cockpit/cockpit-shell";
import { Shell } from "@/components/layout";
import { Card, CardContent, CardHeader, PageContainer, PageHeader } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { CockpitProviders } from "@/lib/cockpit/cockpit-providers";
import { useTenantContext } from "@/lib/control-plane/tenant-context";
import { useTenantBinding } from "@/lib/control-plane/tenant-binding";

export default function CockpitPage() {
  const { me } = useTenantContext();
  const { isConfirmed, confirmedTenant } = useTenantBinding();
  const canOpenCockpit = isConfirmed && confirmedTenant?.status === "active" && me?.operatorModeEnabled;

  if (!canOpenCockpit) {
    return (
      <Shell>
        <PageContainer>
          <PageHeader
            title="System State"
            description="Expert inspection opens only after onboarding has established scope, baseline, and operator readiness."
            actions={
              <Button asChild>
                <Link href="/get-started">Continue onboarding</Link>
              </Button>
            }
          />

          {!isConfirmed && <TenantScopeGuard description="System State is reserved for explicitly bound and activated operator scope." />}

          <div className="space-y-6">
            <Card>
              <CardHeader title="Why this moved later" description="The cockpit remains available, but it is no longer the first thing every signed-in user must decode." />
              <CardContent className="space-y-3 font-mono text-sm text-[#C5C6C7]">
                <div>Confirmed scope: {isConfirmed ? "yes" : "no"}</div>
                <div>Tenant active: {confirmedTenant?.status === "active" ? "yes" : "no"}</div>
                <div>Operator mode: {me?.operatorModeEnabled ? "enabled" : "pending"}</div>
              </CardContent>
            </Card>

            <DoctrineExplainer
              title="Expert inspection surface"
              description="The cockpit is now framed as an expert mode that follows governance comprehension instead of replacing it."
              points={[
                {
                  label: "System State",
                  detail: "Use this view after the tenant is activated and the operator already understands the confirmed policy context.",
                },
                {
                  label: "Policy Context",
                  detail: "The left rail describes policy posture and constraints. It does not claim UI authority over the world just because it is visible.",
                },
                {
                  label: "Proof",
                  detail: "The right rail keeps evidence and proof subordinate to the selected governed activity rather than becoming the default landing page itself.",
                },
              ]}
            />
          </div>
        </PageContainer>
      </Shell>
    );
  }

  return (
    <CockpitProviders>
      <CockpitShell />
    </CockpitProviders>
  );
}
