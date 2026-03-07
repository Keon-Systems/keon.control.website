"use client";

import Link from "next/link";
import * as React from "react";
import { Shell } from "@/components/layout";
import { Card, CardContent, CardHeader, PageContainer, PageHeader } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { getBillingSummary, listControlTenants } from "@/lib/api/control-plane";
import type { BillingSummary } from "@/lib/api/types";

export default function BillingSuccessPage() {
  const [billing, setBilling] = React.useState<BillingSummary | null>(null);

  React.useEffect(() => {
    async function load() {
      const tenants = await listControlTenants();
      if (!tenants[0]) return;
      setBilling(await getBillingSummary(tenants[0].id));
    }

    load().catch(() => setBilling(null));
  }, []);

  return (
    <Shell>
      <PageContainer>
        <PageHeader
          title="Billing success"
          description="Payment return completed. Final plan state is confirmed from internal billing projection, not from the redirect alone."
        />
        <Card>
          <CardHeader title="Current state" description="The subscription page should reflect webhook-processed state." />
          <CardContent className="space-y-3 font-mono text-sm text-[#C5C6C7]">
            <div>Plan: {billing?.planName ?? "Refreshing"}</div>
            <div>Billing state: {billing?.billingState ?? "Refreshing"}</div>
            <div>Included executions: {billing?.includedExecutions.toLocaleString() ?? "Refreshing"}</div>
            <div className="flex gap-2 pt-2">
              <Button asChild>
                <Link href="/admin/subscription">Return to subscription</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/usage">Review usage</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </Shell>
  );
}
