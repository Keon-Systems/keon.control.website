"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { UsageChart } from "@/components/tenants/usage-chart";
import { Loader2 } from "lucide-react";

interface UsageData {
  tenantId: string;
  storage: { usedGb: number; quotaGb: number; percentUsed: number };
  apiCalls: { used: number; quota: number; percentUsed: number };
  seats: { used: number; total: number; percentUsed: number };
}

export default function TenantUsagePage() {
  const params = useParams<{ id: string }>();
  const tenantId = params.id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tenant-usage", tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/tenants/${tenantId}/usage`);
      if (!res.ok) throw new Error("Usage data unavailable");
      const json = await res.json() as { data: UsageData };
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex h-48 items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#66FCF1]" />
          <span className="font-mono text-sm text-[#C5C6C7] opacity-60">Loading usage data…</span>
        </div>
      </PageContainer>
    );
  }

  if (isError || !data) {
    return (
      <PageContainer>
        <p className="font-mono text-sm text-red-400">Usage data unavailable.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <UsageChart data={data} />
    </PageContainer>
  );
}
