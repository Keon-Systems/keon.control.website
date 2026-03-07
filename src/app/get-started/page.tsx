"use client";

import * as React from "react";
import Link from "next/link";
import { Shell } from "@/components/layout";
import { Card, CardContent, CardHeader, PageContainer, PageHeader } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { getBillingSummary, listApiKeys, listControlTenants } from "@/lib/api/control-plane";
import type { ApiKeyPreview, BillingSummary, Tenant } from "@/lib/api/types";

export default function GetStartedPage() {
  const [tenant, setTenant] = React.useState<Tenant | null>(null);
  const [billing, setBilling] = React.useState<BillingSummary | null>(null);
  const [keys, setKeys] = React.useState<ApiKeyPreview[]>([]);

  React.useEffect(() => {
    async function load() {
      const tenants = await listControlTenants();
      if (!tenants[0]) {
        return;
      }

      const firstTenant = tenants[0];
      setTenant(firstTenant);

      const [billingSummary, apiKeys] = await Promise.all([
        getBillingSummary(firstTenant.id),
        listApiKeys(firstTenant.id),
      ]);

      setBilling(billingSummary);
      setKeys(apiKeys);
    }

    load().catch(() => {
      setTenant(null);
      setBilling(null);
      setKeys([]);
    });
  }, []);

  const hasKeys = keys.length > 0;

  return (
    <Shell>
      <PageContainer>
        <PageHeader
          title="Get Started"
          description="Magic-link onboarding should land here first: confirm tenant context, create an API key, run a governed request, and inspect the first receipt."
          actions={
            <Button asChild>
              <Link href="/api-keys">Open API Keys</Link>
            </Button>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
          <Card>
            <CardHeader
              title="First-run checklist"
              description="This is the canonical authenticated onboarding path after signup email delivery."
            />
            <CardContent className="space-y-4">
              {[
                {
                  title: "1. Confirm tenant context",
                  body: tenant
                    ? `Signed in to ${tenant.name}. Tenant state: ${tenant.status}.`
                    : "Tenant context will appear after the control plane loads your membership.",
                  cta: { href: "/tenants", label: "Review tenant" },
                },
                {
                  title: "2. Create your first API key",
                  body: hasKeys
                    ? `${keys.length} API key record(s) already exist for this tenant.`
                    : "No API keys detected yet. Issue one before sending your first governed request.",
                  cta: { href: "/api-keys", label: "Manage API keys" },
                },
                {
                  title: "3. Run a sample request",
                  body: "Use the first API key against your governed execution endpoint and confirm the request completes under tenant policy.",
                  cta: { href: "/usage", label: "Watch usage" },
                },
                {
                  title: "4. Inspect the first receipt",
                  body: "Receipts are the trust surface. The first successful run should immediately be inspectable from the control plane.",
                  cta: { href: "/receipts", label: "Open receipts" },
                },
              ].map((step) => (
                <div key={step.title} className="rounded border border-[#384656] bg-[#0B0C10] p-4">
                  <div className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-[#66FCF1]">{step.title}</div>
                  <div className="mb-3 text-sm leading-6 text-[#C5C6C7]">{step.body}</div>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={step.cta.href}>{step.cta.label}</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Provisioning snapshot"
              description="Control-plane state after free signup and magic-link authentication."
            />
            <CardContent className="font-mono text-sm text-[#C5C6C7]">
              <div>Tenant: {tenant?.name ?? "Loading"}</div>
              <div>Status: {tenant?.status ?? "Pending"}</div>
              <div>Plan: {billing?.planName ?? tenant?.currentPlanCode ?? "Free tier"}</div>
              <div>Billing state: {billing?.billingState ?? "Provisioning"}</div>
              <div>Included executions: {billing?.includedExecutions.toLocaleString() ?? "Loading"}</div>
              <div>API keys: {hasKeys ? keys.length : 0}</div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </Shell>
  );
}
