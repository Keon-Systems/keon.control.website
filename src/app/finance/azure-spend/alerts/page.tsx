"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader, Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { FinanceGateBanner, SpendAlertsList } from "@/components/finance";
import { AlertCircle } from "lucide-react";

type GovernanceEnvelope = { data: Record<string, unknown>[] };

export default function AzureSpendAlertsPage() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["finance", "azure-spend", "alerts"],
    queryFn: async () => {
      const res = await fetch("/api/finance/azure-spend/alerts");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 60_000,
  });

  return (
    <PageContainer>
      <PageHeader
        title="Budget Anomaly Alerts"
        description="Azure spend alerts and threshold breaches"
      />
      <FinanceGateBanner>
        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
            ))}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="font-mono text-sm">Failed to load budget alerts</span>
          </div>
        )}
        {data && (
          <Card>
            <CardHeader
              title="Budget Alerts"
              description={`${data.data.length} active alert${data.data.length !== 1 ? "s" : ""}`}
            />
            <CardContent>
              <SpendAlertsList
                alerts={
                  data.data as Array<{
                    alertId: string;
                    budgetName?: string;
                    severity: string;
                    currentSpendUsd?: number;
                    budgetAmountUsd?: number;
                    percentUsed?: number;
                    triggeredAt?: string;
                    period?: string;
                  }>
                }
              />
            </CardContent>
          </Card>
        )}
      </FinanceGateBanner>
    </PageContainer>
  );
}
