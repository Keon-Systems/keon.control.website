"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader, Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { HealthStatusGrid } from "@/components/infrastructure";
import { AlertCircle } from "lucide-react";

type GovernanceEnvelope = { data: Record<string, unknown>[] };

export default function InfraHealthPage() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["infrastructure", "health"],
    queryFn: async () => {
      const res = await fetch("/api/infrastructure/health");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 60_000,
  });

  return (
    <PageContainer>
      <PageHeader
        title="Infrastructure Health"
        description="Status by resource group"
      />
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
          ))}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="font-mono text-sm">Failed to load health data</span>
        </div>
      )}
      {data && (
        <Card>
          <CardHeader
            title="Resource Group Health"
            description="Live status across all resource groups"
          />
          <CardContent>
            <HealthStatusGrid
              groups={
                data.data as Array<{
                  resourceGroup: string;
                  region?: string;
                  status: string;
                  resourceCount?: number;
                  unhealthyCount?: number;
                  totalMonthlyCostUsd?: number;
                  lastCheckedAt?: string;
                }>
              }
            />
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
