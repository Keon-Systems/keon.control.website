"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { ChurnRiskTable } from "@/components/support/churn-risk-table";
import { Loader2 } from "lucide-react";

interface ChurnRiskTenant {
  tenantId: string;
  displayName: string;
  churnRiskScore: number;
  trend: string;
  signals: string[];
  lastActiveAt: string;
}

export default function ChurnRiskPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["support-churn-risk"],
    queryFn: async () => {
      const res = await fetch("/api/support/churn-risk");
      if (!res.ok) throw new Error("Failed to load churn risk data");
      const json = await res.json() as { data: ChurnRiskTenant[] };
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex h-48 items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#66FCF1]" />
          <span className="font-mono text-sm text-[#C5C6C7] opacity-60">Loading churn risk data…</span>
        </div>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer>
        <p className="font-mono text-sm text-red-400">Churn risk data unavailable.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Churn Risk"
        description="Tenants at risk of churning, ranked by risk score"
      />
      <div className="mt-6">
        <ChurnRiskTable tenants={data ?? []} />
      </div>
    </PageContainer>
  );
}
