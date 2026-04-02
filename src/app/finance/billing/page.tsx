"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader, Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { FinanceGateBanner, BillingSummary } from "@/components/finance";
import { AlertCircle, BarChart2 } from "lucide-react";

type GovernanceEnvelope = { data: Record<string, unknown>[] };

export default function BillingPage() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["finance", "billing", "detail"],
    queryFn: async () => {
      const res = await fetch("/api/finance/billing");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 60_000,
  });

  const summary = data?.data?.[0] as Record<string, unknown> | undefined;

  return (
    <PageContainer>
      <PageHeader
        title="Billing"
        description="MRR, ARR, subscription metrics and revenue analytics"
      />
      <FinanceGateBanner>
        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
            ))}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="font-mono text-sm">Failed to load billing data</span>
          </div>
        )}
        {summary && (
          <div className="space-y-6">
            <BillingSummary
              summary={{
                mrr: (summary.mrr as number) ?? 0,
                arr: (summary.arr as number) ?? 0,
                activeSubscriptions: (summary.activeSubscriptions as number) ?? 0,
                trialSubscriptions: (summary.trialSubscriptions as number) ?? 0,
              }}
            />
            <Card>
              <CardHeader
                title={
                  <div className="flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-[#66FCF1]" />
                    <span>Revenue Chart</span>
                  </div>
                }
                description="MRR trend over last 12 months"
              />
              <CardContent>
                <div className="flex h-32 items-center justify-center rounded border border-dashed border-[#384656]">
                  <p className="font-mono text-xs text-[#C5C6C7] opacity-40">
                    Chart placeholder — live data integration pending
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </FinanceGateBanner>
    </PageContainer>
  );
}
