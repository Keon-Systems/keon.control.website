"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Activity } from "lucide-react";
import { PageContainer, PageHeader, Card, CardContent } from "@/components/layout/page-container";
import { SloTable, SloBudgetChart } from "@/components/observability";
import type { SloEntry } from "@/components/observability";
import { cn } from "@/lib/utils";

interface GovernanceEnvelope {
  data: SloEntry[];
}

export default function SloPage() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["observability", "slo"],
    queryFn: async () => {
      const res = await fetch("/api/observability/slo");
      if (!res.ok) throw new Error("Failed to load SLO data");
      return res.json();
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const entries: SloEntry[] = data?.data ?? [];
  const healthy = entries.filter((e) => e.status === "healthy").length;
  const burning = entries.filter((e) => e.status === "burning").length;
  const critical = entries.filter((e) => e.status === "critical").length;

  return (
    <PageContainer>
      <PageHeader
        title="Service Level Objectives"
        description="SLO burn rates, error budget consumption, and health status"
      />

      {/* Summary Chips */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div
          className={cn(
            "flex items-center gap-2 rounded border px-4 py-2",
            "border-[#45A29E]/40 bg-[#45A29E]/10"
          )}
        >
          <span className="font-mono text-xs uppercase tracking-wider text-[#45A29E]">Healthy</span>
          <span className="font-mono text-lg font-bold tabular-nums text-[#45A29E]">{healthy}</span>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 rounded border px-4 py-2",
            burning > 0 ? "border-amber-400/40 bg-amber-400/10" : "border-[#384656] bg-transparent"
          )}
        >
          <span className={cn("font-mono text-xs uppercase tracking-wider", burning > 0 ? "text-amber-400" : "text-[#C5C6C7] opacity-50")}>
            Burning
          </span>
          <span className={cn("font-mono text-lg font-bold tabular-nums", burning > 0 ? "text-amber-400" : "text-[#C5C6C7] opacity-50")}>
            {burning}
          </span>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 rounded border px-4 py-2",
            critical > 0 ? "border-red-500/40 bg-red-500/10" : "border-[#384656] bg-transparent"
          )}
        >
          <span className={cn("font-mono text-xs uppercase tracking-wider", critical > 0 ? "text-red-400" : "text-[#C5C6C7] opacity-50")}>
            Critical
          </span>
          <span className={cn("font-mono text-lg font-bold tabular-nums", critical > 0 ? "text-red-400" : "text-[#C5C6C7] opacity-50")}>
            {critical}
          </span>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded border border-red-500/40 bg-red-500/10 p-4 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span className="font-mono text-sm">Failed to load SLO data</span>
        </div>
      )}

      {!isLoading && !error && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <Activity className="mb-4 h-12 w-12 text-[#384656]" />
          <p className="font-mono text-base text-[#C5C6C7]">No SLOs configured</p>
        </div>
      )}

      {!isLoading && !error && entries.length > 0 && (
        <div className="space-y-6">
          {/* Budget Chart Overview */}
          <Card>
            <div className="mb-4 border-b border-[#384656] pb-4">
              <h2 className="font-mono text-sm uppercase tracking-wider text-[#C5C6C7] opacity-70">
                Error Budget Overview
              </h2>
            </div>
            <CardContent className="p-0">
              <SloBudgetChart entries={entries} />
            </CardContent>
          </Card>

          {/* SLO Table */}
          <Card className="p-0">
            <div className="border-b border-[#384656] p-4">
              <h2 className="font-mono text-sm uppercase tracking-wider text-[#C5C6C7] opacity-70">
                SLO Detail
              </h2>
            </div>
            <CardContent className="p-0">
              <SloTable entries={entries} />
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
