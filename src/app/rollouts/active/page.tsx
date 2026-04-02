"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader, Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { ActiveRolloutsTable } from "@/components/rollouts";
import { AlertCircle } from "lucide-react";

type GovernanceEnvelope = { data: Record<string, unknown>[] };

export default function ActiveRolloutsPage() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["rollouts", "active", "list"],
    queryFn: async () => {
      const res = await fetch("/api/rollouts/active");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 60_000,
  });

  return (
    <PageContainer>
      <PageHeader
        title="Active Rollouts"
        description="Ongoing deployments and canary rollouts"
      />
      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
          ))}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="font-mono text-sm">Failed to load rollouts</span>
        </div>
      )}
      {data && (
        <Card>
          <CardHeader
            title="Rollout Queue"
            description={`${data.data.length} rollout${data.data.length !== 1 ? "s" : ""}`}
          />
          <CardContent>
            <ActiveRolloutsTable
              rollouts={
                data.data as Array<{
                  rolloutId: string;
                  name: string;
                  status: string;
                  canaryPercentage?: number;
                  startedAt?: string;
                  scheduledFor?: string;
                  targetVersion?: string;
                  currentVersion?: string;
                }>
              }
            />
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
