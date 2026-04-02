"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { TenantHeader } from "@/components/tenants/tenant-header";
import { UsageChart } from "@/components/tenants/usage-chart";
import { ChurnRiskBadge } from "@/components/tenants/churn-risk-badge";
import { Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UsageData {
  tenantId: string;
  storage: { usedGb: number; quotaGb: number; percentUsed: number };
  apiCalls: { used: number; quota: number; percentUsed: number };
  seats: { used: number; total: number; percentUsed: number };
}

const TABS = [
  { label: "Overview", href: "" },
  { label: "Subscription", href: "/subscription" },
  { label: "Usage", href: "/usage" },
  { label: "Support", href: "/support" },
  { label: "Security", href: "/security" },
  { label: "Entitlements", href: "/entitlements" },
  { label: "Audit", href: "/audit" },
];

interface TenantDetailData {
  tenantId: string;
  displayName: string;
  plan: string;
  status: string;
  mrr: number;
  seats: number;
  usedSeats: number;
  storageQuotaGb: number;
  usedStorageGb: number;
  apiCallsQuota: number;
  apiCallsUsed: number;
  trialEndDate: string | null;
  billingCycleAnchor: number;
  createdAt: string;
  churnRiskScore: number;
  healthScore: number;
}

export default function TenantDetailPage() {
  const params = useParams<{ id: string }>();
  const tenantId = params.id;
  const pathname = usePathname();
  const basePath = `/tenants/${tenantId}`;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tenant-detail", tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/tenants/${tenantId}`);
      if (!res.ok) throw new Error("Tenant not found");
      const json = await res.json() as { data: TenantDetailData };
      return json.data;
    },
  });

  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ["tenant-usage", tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/tenants/${tenantId}/usage`);
      if (!res.ok) throw new Error("Usage data unavailable");
      const json = await res.json() as { data: UsageData };
      return json.data;
    },
    enabled: !!data,
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex h-48 items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#66FCF1]" />
          <span className="font-mono text-sm text-[#C5C6C7] opacity-60">Loading tenant…</span>
        </div>
      </PageContainer>
    );
  }

  if (isError || !data) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="font-mono text-sm text-red-400">Tenant not found: {tenantId}</p>
          <Button variant="outline" asChild>
            <Link href="/tenants">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tenants
            </Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Back link */}
      <div className="mb-4">
        <Link
          href="/tenants"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-[#C5C6C7] opacity-60 hover:opacity-100 hover:text-[#66FCF1] transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          All Tenants
        </Link>
      </div>

      {/* Tenant header */}
      <TenantHeader
        tenantId={data.tenantId}
        displayName={data.displayName}
        plan={data.plan}
        status={data.status}
        mrr={data.mrr}
        healthScore={data.healthScore}
      />

      {/* Tab navigation */}
      <nav className="mt-6 flex gap-0 border-b border-[#384656]" aria-label="Tenant workspace tabs">
        {TABS.map((tab) => {
          const href = `${basePath}${tab.href}`;
          const isActive = tab.href === ""
            ? pathname === basePath
            : pathname.startsWith(href);
          return (
            <Link
              key={tab.label}
              href={href}
              className={`border-b-2 px-4 pb-3 pt-2 font-mono text-sm transition-colors ${
                isActive
                  ? "border-[#66FCF1] text-[#66FCF1]"
                  : "border-transparent text-[#C5C6C7] opacity-60 hover:opacity-100 hover:text-[#C5C6C7]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Overview content (shown only on exact /tenants/[id]) */}
      <div className="mt-6 space-y-6">
        {/* Quick stats row */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent>
              <div className="text-center">
                <div className="font-mono text-2xl font-bold text-[#66FCF1]">${data.mrr.toLocaleString()}</div>
                <div className="mt-1 font-mono text-xs text-[#C5C6C7] opacity-60">MRR</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-center">
                <div className="font-mono text-2xl font-bold text-[#C5C6C7]">{data.usedSeats}/{data.seats}</div>
                <div className="mt-1 font-mono text-xs text-[#C5C6C7] opacity-60">Seats Used</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-center">
                <div className="font-mono text-2xl font-bold text-[#C5C6C7]">
                  {Math.round(data.healthScore * 100)}%
                </div>
                <div className="mt-1 font-mono text-xs text-[#C5C6C7] opacity-60">Health Score</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex flex-col items-center gap-1">
                <ChurnRiskBadge score={data.churnRiskScore} />
                <div className="font-mono text-xs text-[#C5C6C7] opacity-60">Churn Risk</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage preview */}
        {!usageLoading && usageData && (
          <UsageChart data={usageData} />
        )}

        {/* Sub-navigation hint */}
        <Card>
          <CardHeader title="Workspace Sections" description="Navigate to a tab above for detailed views" />
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
              {TABS.filter((t) => t.href !== "").map((tab) => (
                <Link
                  key={tab.label}
                  href={`${basePath}${tab.href}`}
                  className="flex items-center gap-2 rounded border border-[#384656] p-3 text-[#C5C6C7] opacity-70 transition-colors hover:border-[#66FCF1]/40 hover:opacity-100"
                >
                  <span className="font-mono text-xs">{tab.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
