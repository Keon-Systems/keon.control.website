"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Layers } from "lucide-react";
import { PageContainer, PageHeader, Card, CardContent } from "@/components/layout/page-container";
import { JobRunTable } from "@/components/observability";
import type { JobEntry } from "@/components/observability";
import { cn } from "@/lib/utils";

interface QueueHealth {
  depth: number;
  processingRate: number;
  failureRate: number;
  oldestPendingAge: number;
  stuckCount: number;
}

interface GovernanceEnvelope {
  data: {
    queueHealth: QueueHealth;
    jobs: JobEntry[];
  };
}

export default function JobsPage() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["observability", "jobs"],
    queryFn: async () => {
      const res = await fetch("/api/observability/jobs");
      if (!res.ok) throw new Error("Failed to load jobs data");
      return res.json();
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const queueHealth: QueueHealth | null = data?.data?.queueHealth ?? null;
  const jobs: JobEntry[] = data?.data?.jobs ?? [];

  return (
    <PageContainer>
      <PageHeader
        title="Job Queue Health"
        description="Worker queue depth, failure rates, and individual job run status"
      />

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
          <span className="font-mono text-sm">Failed to load jobs data</span>
        </div>
      )}

      {!isLoading && !error && !queueHealth && jobs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <Layers className="mb-4 h-12 w-12 text-[#384656]" />
          <p className="font-mono text-base text-[#C5C6C7]">No job data available</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="space-y-6">
          {/* Queue Health Summary */}
          {queueHealth && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded border border-[#384656] bg-[#1F2833] p-4">
                <div className="font-mono text-2xl font-bold tabular-nums text-[#C5C6C7]">
                  {queueHealth.depth}
                </div>
                <div className="mt-1 font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-50">
                  Queue Depth
                </div>
              </div>
              <div className="rounded border border-[#384656] bg-[#1F2833] p-4">
                <div
                  className={cn(
                    "font-mono text-2xl font-bold tabular-nums",
                    queueHealth.failureRate > 5 ? "text-red-400" : queueHealth.failureRate > 2 ? "text-amber-400" : "text-[#45A29E]"
                  )}
                >
                  {queueHealth.failureRate.toFixed(1)}%
                </div>
                <div className="mt-1 font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-50">
                  Failure Rate
                </div>
              </div>
              <div className="rounded border border-[#384656] bg-[#1F2833] p-4">
                <div
                  className={cn(
                    "font-mono text-2xl font-bold tabular-nums",
                    queueHealth.stuckCount > 0 ? "text-amber-400" : "text-[#C5C6C7]"
                  )}
                >
                  {queueHealth.stuckCount}
                </div>
                <div className="mt-1 font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-50">
                  Stuck Jobs
                </div>
              </div>
              <div className="rounded border border-[#384656] bg-[#1F2833] p-4">
                <div className="font-mono text-2xl font-bold tabular-nums text-[#C5C6C7]">
                  {queueHealth.processingRate.toFixed(0)}/s
                </div>
                <div className="mt-1 font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-50">
                  Processing Rate
                </div>
              </div>
            </div>
          )}

          {/* Jobs Table */}
          <Card className="p-0">
            <div className="border-b border-[#384656] p-4">
              <h2 className="font-mono text-sm uppercase tracking-wider text-[#C5C6C7] opacity-70">
                Job Runs
              </h2>
            </div>
            <CardContent className="p-0">
              <JobRunTable entries={jobs} />
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
