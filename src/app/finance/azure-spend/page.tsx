"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader, Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { FinanceGateBanner, AzureSpendChart } from "@/components/finance";
import { AlertCircle } from "lucide-react";

type GovernanceEnvelope = { data: Record<string, unknown>[] };

export default function AzureSpendPage() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["finance", "azure-spend"],
    queryFn: async () => {
      const res = await fetch("/api/finance/azure-spend");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 60_000,
  });

  const spendData = data?.data?.[0] as Record<string, unknown> | undefined;

  return (
    <PageContainer>
      <PageHeader
        title="Azure Spend"
        description="Cost by service, budget vs actual"
      />
      <FinanceGateBanner>
        {isLoading && (
          <div className="h-64 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="font-mono text-sm">Failed to load Azure spend data</span>
          </div>
        )}
        {spendData && (
          <Card>
            <CardHeader
              title="Azure Cost by Service"
              description={(spendData.period as string) ?? "Current period"}
            />
            <CardContent>
              <AzureSpendChart
                data={
                  (spendData.byService as Array<{ service: string; spend?: number; spendUsd?: number }>) ?? []
                }
                totalSpend={(spendData.totalSpend as number) ?? undefined}
                budgetAmount={(spendData.budgetAmount as number) ?? undefined}
              />
            </CardContent>
          </Card>
        )}
      </FinanceGateBanner>
    </PageContainer>
  );
}
