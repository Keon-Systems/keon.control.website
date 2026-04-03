"use client";

import * as React from "react";
import { TenantScopeGuard } from "@/components/control-plane";
import { Shell } from "@/components/layout";
import { Card, CardContent, CardHeader, PageContainer, PageHeader } from "@/components/layout/page-container";
import { getBillingSummary, getUsageSummary } from "@/lib/api/control-plane";
import type { BillingSummary, UsageSummary } from "@/lib/api/types";
import { useTenantBinding } from "@/lib/control-plane/tenant-binding";

export default function UsagePage() {
  const { isConfirmed, confirmedTenant, confirmedEnvironment } = useTenantBinding();
  const [usage, setUsage] = React.useState<UsageSummary | null>(null);
  const [billing, setBilling] = React.useState<BillingSummary | null>(null);

  React.useEffect(() => {
    async function load() {
      if (!confirmedTenant) {
        setUsage(null);
        setBilling(null);
        return;
      }

      const [usageSummary, billingSummary] = await Promise.all([
        getUsageSummary(confirmedTenant.id),
        getBillingSummary(confirmedTenant.id),
      ]);
      setUsage(usageSummary);
      setBilling(billingSummary);
    }

    load().catch(() => {
      setUsage(null);
      setBilling(null);
    });
  }, [confirmedTenant]);

  return (
    <Shell>
      <PageContainer>
        <PageHeader
          title="Usage"
          description="Included quota, denied consumption, and authorized overage exposure for the explicitly bound tenant and environment."
        />

        {!isConfirmed && <TenantScopeGuard description="Usage and billing stay unpersonalized until the tenant and environment are explicitly confirmed." />}

        {isConfirmed && usage && billing && confirmedTenant && (
          <div className="space-y-6">
            <Card>
              <CardHeader title="Bound usage view" description="This usage screen is now tied to explicit scope instead of assuming the first available tenant membership." />
              <CardContent className="grid gap-4 md:grid-cols-4 font-mono text-sm text-[#C5C6C7]">
                <div>Tenant: {confirmedTenant.name}</div>
                <div>Environment: {confirmedEnvironment}</div>
                <div>Plan: {billing.planName}</div>
                <div>Billing state: {billing.billingState}</div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader title="Current billing period" />
                <CardContent className="font-mono text-sm text-[#C5C6C7]">
                  <div>Included: {billing.includedExecutions.toLocaleString()}</div>
                  <div>Quota consumed: {usage.totalQuotaConsumed.toLocaleString()}</div>
                  <div>Authorized: {usage.authorizedExecutions.toLocaleString()}</div>
                  <div>Denied: {usage.deniedExecutions.toLocaleString()}</div>
                  <div>Estimated overage: ${billing.estimatedOverageUsd.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader title="Daily usage" />
                <CardContent className="space-y-2">
                  {usage.daily.map((point) => (
                    <div key={point.date} className="grid grid-cols-4 gap-2 font-mono text-sm text-[#C5C6C7]">
                      <span>{point.date}</span>
                      <span>{point.authorizedExecutions} auth</span>
                      <span>{point.deniedExecutions} deny</span>
                      <span>{point.totalExecutions} total</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </PageContainer>
    </Shell>
  );
}
