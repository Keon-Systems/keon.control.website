"use client";

import * as React from "react";
import { DoctrineExplainer, TenantScopeGuard } from "@/components/control-plane";
import { Shell } from "@/components/layout";
import { Card, CardContent, CardHeader, PageContainer, PageHeader } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { getBillingSummary } from "@/lib/api/control-plane";
import { useTenantBinding } from "@/lib/control-plane/tenant-binding";
import { Bell, ShieldCheck, User } from "lucide-react";

export default function SettingsPage() {
  const { isConfirmed, confirmedTenant, confirmedEnvironment } = useTenantBinding();
  const [billingState, setBillingState] = React.useState<string>("loading");

  React.useEffect(() => {
    async function load() {
      if (!confirmedTenant) {
        setBillingState("scope required");
        return;
      }

      const billing = await getBillingSummary(confirmedTenant.id);
      setBillingState(billing.billingState);
    }

    load().catch(() => setBillingState("unavailable"));
  }, [confirmedTenant]);

  return (
    <Shell>
      <PageContainer>
        <PageHeader
          title="Settings"
          description="Operator preferences are secondary to governance-critical setup. This page now focuses on verified scope, notification posture, and account hygiene."
        />

        {!isConfirmed && <TenantScopeGuard description="Settings that depend on tenant context require an explicitly confirmed scope first." />}

        {isConfirmed && confirmedTenant && (
          <div className="space-y-6 max-w-4xl">
            <Card>
              <CardHeader
                title={
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#66FCF1]" />
                    <span>Verified scope</span>
                  </div>
                }
                description="Settings no longer imply tenant authority. They reflect the scope you have already confirmed."
              />
              <CardContent className="space-y-3 font-mono text-sm text-[#C5C6C7]">
                <div>Tenant: {confirmedTenant.name}</div>
                <div>Environment: {confirmedEnvironment}</div>
                <div>Billing state: {billingState}</div>
                <div className="pt-2">
                  <Button size="sm">Refresh scope metadata</Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader
                  title={
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-[#66FCF1]" />
                      <span>Governance notifications</span>
                    </div>
                  }
                  description="Alert posture matters more than theme toggles during tenant activation."
                />
                <CardContent className="space-y-4 font-mono text-sm text-[#C5C6C7]">
                  <div>Policy violations: enabled</div>
                  <div>Escalation notices: enabled</div>
                  <div>Weekly digest: optional</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader
                  title={
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[#66FCF1]" />
                      <span>Account hygiene</span>
                    </div>
                  }
                  description="Keep identity and session state clean without confusing this screen for the governance baseline itself."
                />
                <CardContent className="space-y-4 font-mono text-sm text-[#C5C6C7]">
                  <div>Session posture: verified</div>
                  <div>Scope drift protection: active</div>
                  <Button variant="outline" size="sm">Sign out all sessions</Button>
                </CardContent>
              </Card>
            </div>

            <DoctrineExplainer
              title="Why settings moved down"
              description="Generic SaaS preferences are no longer positioned ahead of governance-critical setup."
              points={[
                {
                  label: "Scope first",
                  detail: "Settings should never be the screen that quietly chooses enterprise context on the user’s behalf.",
                },
                {
                  label: "Governance before cosmetics",
                  detail: "Notification posture and verified scope matter more than visual preferences during initial activation.",
                },
              ]}
            />
          </div>
        )}
      </PageContainer>
    </Shell>
  );
}
