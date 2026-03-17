"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader, Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { FinanceGateBanner, CollectionsTable } from "@/components/finance";
import { AlertCircle } from "lucide-react";

type GovernanceEnvelope = { data: Record<string, unknown>[] };

export default function CollectionsPage() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["finance", "collections"],
    queryFn: async () => {
      const res = await fetch("/api/finance/collections");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 60_000,
  });

  return (
    <PageContainer>
      <PageHeader
        title="Collections"
        description="Failed charge queue and dunning management"
      />
      <FinanceGateBanner>
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
            ))}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="font-mono text-sm">Failed to load collections data</span>
          </div>
        )}
        {data && (
          <Card>
            <CardHeader
              title="Failed Invoice Queue"
              description={`${data.data.length} item${data.data.length !== 1 ? "s" : ""} in dunning`}
            />
            <CardContent>
              <CollectionsTable
                items={
                  data.data as Array<{
                    tenantId: string;
                    invoiceId: string;
                    amountCents?: number;
                    amount?: number;
                    dunningStep: number;
                    status: string;
                    failedAt: string;
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
