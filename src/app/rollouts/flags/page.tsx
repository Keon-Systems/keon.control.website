"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader, Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { FeatureFlagsTable } from "@/components/rollouts";
import { AlertCircle } from "lucide-react";

type GovernanceEnvelope = { data: Record<string, unknown>[] };

export default function FeatureFlagsPage() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["rollouts", "flags"],
    queryFn: async () => {
      const res = await fetch("/api/rollouts/flags");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 60_000,
  });

  return (
    <PageContainer>
      <PageHeader
        title="Feature Flags"
        description="Global feature flags with per-tenant overrides (read-only)"
      />
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
          <span className="font-mono text-sm">Failed to load feature flags</span>
        </div>
      )}
      {data && (
        <Card>
          <CardHeader
            title="Feature Flags"
            description={`${data.data.length} flag${data.data.length !== 1 ? "s" : ""} configured`}
          />
          <CardContent>
            <FeatureFlagsTable
              flags={
                data.data as Array<{
                  flagId: string;
                  name: string;
                  description?: string;
                  enabled: boolean;
                  rolloutPercentage?: number;
                  tenantOverrides?: Array<{ tenantId: string; enabled?: boolean; value?: boolean }>;
                }>
              }
            />
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
