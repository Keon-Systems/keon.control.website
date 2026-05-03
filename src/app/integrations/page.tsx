"use client";

import * as React from "react";
import Link from "next/link";
import { TenantScopeGuard } from "@/components/control-plane";
import { Shell } from "@/components/layout";
import { Card, CardContent, CardHeader, PageContainer, PageHeader } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getBillingSummary, listApiKeys } from "@/lib/api/control-plane";
import type { ApiKeyPreview, BillingSummary } from "@/lib/api/types";
import { useTenantBinding } from "@/lib/control-plane/tenant-binding";

export default function IntegrationsPage() {
  const { isConfirmed, confirmedTenant, confirmedEnvironment, isTestMode } = useTenantBinding();
  const [billing, setBilling] = React.useState<BillingSummary | null>(null);
  const [keys, setKeys] = React.useState<ApiKeyPreview[]>([]);

  React.useEffect(() => {
    async function load() {
      if (!confirmedTenant) {
        setBilling(null);
        setKeys([]);
        return;
      }

      const [billingSummary, apiKeys] = await Promise.all([getBillingSummary(confirmedTenant.id), listApiKeys(confirmedTenant.id)]);
      setBilling(billingSummary);
      setKeys(apiKeys);
    }

    load().catch(() => {
      setBilling(null);
      setKeys([]);
    });
  }, [confirmedTenant]);

  return (
    <Shell>
      <PageContainer>
        <PageHeader
          title="Integrations"
          description="Connect your runtime through Keon, issue credentials, and validate the first evidence-backed request."
          actions={
            <Button asChild variant="secondary">
              <Link href="/setup">Back to setup</Link>
            </Button>
          }
        />

        {!isConfirmed && <TenantScopeGuard description="Connect integrations after you confirm the workspace and environment Keon should prepare." />}

        {isConfirmed && confirmedTenant && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
            <div className="space-y-6">
              <Card>
                <CardHeader
                  title="Connect in order"
                  description={
                    isTestMode
                      ? "Most teams follow this path when they are ready to start sending AI actions through Keon."
                      : "Most teams follow this path when they are ready to start sending real traffic through Keon."
                  }
                />
                <CardContent className="space-y-4">
                  {[
                    {
                      title: "1. Issue credentials",
                      body: `${keys.length} credential record(s) currently exist for ${confirmedTenant.name}. Use credentials that match the ${confirmedEnvironment} environment.`,
                      href: "/api-keys",
                      label: "Manage API keys",
                    },
                    {
                      title: "2. Review guardrails",
                      body: "Confirm the default guardrails before your runtime starts sending live requests.",
                      href: "/policies",
                      label: "Open guardrails",
                    },
                    {
                      title: "3. Validate with receipts",
                      body: "Send a first request and confirm the resulting evidence trail from Receipts.",
                      href: "/receipts",
                      label: "Review receipts",
                    },
                  ].map((step) => (
                    <div key={step.title} className="rounded border border-[#384656] bg-[#0B0C10] p-4">
                      <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#66FCF1]">{step.title}</div>
                      <p className="mt-2 text-sm leading-6 text-[#C5C6C7] opacity-80">{step.body}</p>
                      <Button asChild className="mt-4" size="sm" variant="secondary">
                        <Link href={step.href}>{step.label}</Link>
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader title="Current integration context" description="Integration setup stays tied to the confirmed workspace scope." />
              <CardContent className="space-y-3 font-mono text-sm text-[#C5C6C7]">
                <div>Workspace: {confirmedTenant.name}</div>
                <div>Environment: {confirmedEnvironment}</div>
                <div>Plan: {billing?.planName ?? (isTestMode ? "Sandbox Preview" : "—")}</div>
                <div>Billing state: {billing?.billingState ?? (isTestMode ? "Included during preview" : "—")}</div>
                <div>API keys: {keys.length}</div>
                <div className="pt-2">
                  <Badge variant="healthy">Ready for integration setup</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </PageContainer>
    </Shell>
  );
}
