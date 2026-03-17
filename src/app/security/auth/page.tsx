"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { SecurityGateBanner, AuthAnomalyTable } from "@/components/security";
import { AlertCircle } from "lucide-react";

type GovernanceEnvelope = { data: Record<string, unknown>[] };

export default function SecurityAuthPage() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["security", "auth"],
    queryFn: async () => {
      const res = await fetch("/api/security/auth");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const anomalies = (data?.data ?? []) as {
    anomalyId: string;
    type: string;
    confidence: number;
    tenantId?: string | null;
    actorId?: string | null;
    detectedAt: string;
    mitigated?: boolean;
    reviewStatus?: string;
  }[];

  return (
    <PageContainer>
      <PageHeader
        title="Auth Anomalies"
        description="Authentication anomaly detection — geo jumps, impossible travel, session hijack"
      />
      <SecurityGateBanner>
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
            ))}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="font-mono text-sm">Failed to load auth anomalies</span>
          </div>
        )}
        {!isLoading && !error && <AuthAnomalyTable anomalies={anomalies} />}
      </SecurityGateBanner>
    </PageContainer>
  );
}
