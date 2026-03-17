"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader, Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { AlertCircle, Server, CheckCircle, AlertTriangle } from "lucide-react";

type GovernanceEnvelope = { data: Record<string, unknown>[] };

export default function InfrastructurePage() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["infrastructure", "resources"],
    queryFn: async () => {
      const res = await fetch("/api/infrastructure/resources");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 60_000,
  });

  const resources = (data?.data ?? []) as Array<{ status: string; monthlyCost?: number; monthlyCostUsd?: number }>;
  const healthy = resources.filter((r) => r.status === "healthy").length;
  const degraded = resources.filter((r) => r.status === "degraded").length;
  const totalCost = resources.reduce(
    (sum, r) => sum + ((r.monthlyCost ?? r.monthlyCostUsd ?? 0) as number),
    0
  );

  return (
    <PageContainer>
      <PageHeader
        title="Infrastructure"
        description="Azure resource inventory and health status"
      />
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
          ))}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="font-mono text-sm">Failed to load infrastructure data</span>
        </div>
      )}
      {data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-[#66FCF1]" />
                  <span className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-70">
                    Total Resources
                  </span>
                </div>
              }
            />
            <CardContent>
              <p className="font-mono text-2xl font-bold text-[#66FCF1]">{resources.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[#66FCF1]" />
                  <span className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-70">
                    Healthy
                  </span>
                </div>
              }
            />
            <CardContent>
              <p className="font-mono text-2xl font-bold text-[#66FCF1]">{healthy}</p>
              {degraded > 0 && (
                <p className="font-mono text-xs text-[#FF6B00] mt-1">{degraded} degraded</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[#66FCF1]" />
                  <span className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-70">
                    Est. Monthly Cost
                  </span>
                </div>
              }
            />
            <CardContent>
              <p className="font-mono text-2xl font-bold text-[#C5C6C7]">
                ${totalCost.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
