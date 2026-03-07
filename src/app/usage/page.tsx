"use client";

import * as React from "react";
import { Shell } from "@/components/layout";
import { PageContainer, PageHeader, Card, CardContent, CardHeader } from "@/components/layout/page-container";
import { getBillingSummary, getUsageSummary, listControlTenants } from "@/lib/api/control-plane";
import type { BillingSummary, UsageSummary } from "@/lib/api/types";

export default function UsagePage() {
  const [usage, setUsage] = React.useState<UsageSummary | null>(null);
  const [billing, setBilling] = React.useState<BillingSummary | null>(null);

  React.useEffect(() => {
    async function load() {
      const tenants = await listControlTenants();
      if (!tenants[0]) return;
      const tenantId = tenants[0].id;
      const [usageSummary, billingSummary] = await Promise.all([
        getUsageSummary(tenantId),
        getBillingSummary(tenantId),
      ]);
      setUsage(usageSummary);
      setBilling(billingSummary);
    }

    load().catch(() => {
      setUsage(null);
      setBilling(null);
    });
  }, []);

  return (
    <Shell>
      <PageContainer>
        <PageHeader title="Usage & Billing" description="Included quota, denied consumption, and authorized overage exposure." />
        {usage && billing && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Current Billing Period" />
              <CardContent className="font-mono text-sm text-[#C5C6C7]">
                <div>Plan: {billing.planName}</div>
                <div>State: {billing.billingState}</div>
                <div>Included: {billing.includedExecutions.toLocaleString()}</div>
                <div>Quota Consumed: {usage.totalQuotaConsumed.toLocaleString()}</div>
                <div>Authorized: {usage.authorizedExecutions.toLocaleString()}</div>
                <div>Denied: {usage.deniedExecutions.toLocaleString()}</div>
                <div>Estimated Overage: ${billing.estimatedOverageUsd.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader title="Daily Usage" />
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
        )}
      </PageContainer>
    </Shell>
  );
}
