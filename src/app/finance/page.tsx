"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader, Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { FinanceGateBanner, BillingSummary } from "@/components/finance";
import { AlertCircle, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/format";

type GovernanceEnvelope = { data: Record<string, unknown>[] };

export default function FinancePage() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["finance", "billing"],
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
        title="Finance"
        description="Revenue metrics, billing, Azure spend and collections"
      />
      <FinanceGateBanner>
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
            ))}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="font-mono text-sm">Failed to load finance data</span>
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader
                  title={
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#66FCF1]" />
                      <span className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-70">
                        New MRR (30d)
                      </span>
                    </div>
                  }
                />
                <CardContent>
                  <p className="font-mono text-xl font-bold text-[#66FCF1]">
                    {formatCurrency((summary.newMrr30d as number) ?? 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader
                  title={
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-400" />
                      <span className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-70">
                        Churned MRR (30d)
                      </span>
                    </div>
                  }
                />
                <CardContent>
                  <p className="font-mono text-xl font-bold text-red-400">
                    -{formatCurrency((summary.churned30d as number) ?? 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader
                  title={
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-[#66FCF1]" />
                      <span className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-70">
                        Expansion MRR (30d)
                      </span>
                    </div>
                  }
                />
                <CardContent>
                  <p className="font-mono text-xl font-bold text-[#66FCF1]">
                    {formatCurrency((summary.expansionMrr30d as number) ?? 0)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </FinanceGateBanner>
    </PageContainer>
  );
}
