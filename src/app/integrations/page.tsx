"use client";

import * as React from "react";
import Link from "next/link";
import { DoctrineExplainer, TenantScopeGuard } from "@/components/control-plane";
import { Shell } from "@/components/layout";
import { Card, CardContent, CardHeader, PageContainer, PageHeader } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getBillingSummary, listApiKeys } from "@/lib/api/control-plane";
import type { ApiKeyPreview, BillingSummary } from "@/lib/api/types";
import { useTenantBinding } from "@/lib/control-plane/tenant-binding";

export default function IntegrationsPage() {
  const { isConfirmed, confirmedTenant, confirmedEnvironment } = useTenantBinding();
  const [billing, setBilling] = React.useState<BillingSummary | null>(null);
  const [keys, setKeys] = React.useState<ApiKeyPreview[]>([]);

  React.useEffect(() => {
    async function load() {
      if (!confirmedTenant) {
        setBilling(null);
        setKeys([]);
        return;
      }

      const [billingSummary, apiKeys] = await Promise.all([
        getBillingSummary(confirmedTenant.id),
        listApiKeys(confirmedTenant.id),
      ]);

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
          title="Developer Setup"
          description="Issue API credentials, connect your runtime through the governed boundary, and validate your first receipt-backed request."
          actions={
            <Button asChild variant="secondary">
              <Link href="/get-started">Back to product onboarding</Link>
            </Button>
          }
        />

        {!isConfirmed && <TenantScopeGuard description="Developer setup still depends on an explicitly confirmed tenant and environment." />}

        {isConfirmed && confirmedTenant && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
            <div className="space-y-6">
              <Card>
                <CardHeader title="Integration path" description="Technical setup starts only after the tenant and execution boundary are already bound." />
                <CardContent className="space-y-4">
                  {[
                    {
                      title: "1. Issue credentials",
                      body: `${keys.length} API credential record(s) exist for ${confirmedTenant.name}. Use runtime credentials that match the bound ${confirmedEnvironment} environment.`,
                      href: "/api-keys",
                      label: "Manage API keys",
                    },
                    {
                      title: "2. Connect runtime",
                      body: "Route the integration through the governed boundary so request evaluation and policy consequences remain receipt-backed.",
                      href: "/policies",
                      label: "Review policy boundary",
                    },
                    {
                      title: "3. Validate receipt-backed request",
                      body: "Run a first implementation request and confirm the resulting receipt chain from the control plane.",
                      href: "/receipts",
                      label: "Inspect receipts",
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

              <DoctrineExplainer
                title="Why this moved"
                description="The developer path is now an explicit branch instead of the default authenticated landing experience."
                points={[
                  {
                    label: "Product-first entry",
                    detail: "Primary users need to understand governed execution, scope, and baseline consequences before the product reads like an API console.",
                  },
                  {
                    label: "Receipt-backed validation",
                    detail: "Integration success is not just a 200 response. It is a receipt-backed request observed under the correct policy boundary.",
                  },
                ]}
              />
            </div>

            <Card>
              <CardHeader title="Bound environment snapshot" description="Developer setup stays tied to the confirmed product scope." />
              <CardContent className="space-y-3 font-mono text-sm text-[#C5C6C7]">
                <div>Tenant: {confirmedTenant.name}</div>
                <div>Environment: {confirmedEnvironment}</div>
                <div>Plan: {billing?.planName ?? "Loading"}</div>
                <div>Billing state: {billing?.billingState ?? "Loading"}</div>
                <div>API keys: {keys.length}</div>
                <div className="pt-2">
                  <Badge variant="healthy">Scope confirmed</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </PageContainer>
    </Shell>
  );
}
