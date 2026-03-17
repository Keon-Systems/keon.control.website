"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { SecurityGateBanner, ThreatSignalTable } from "@/components/security";
import { AlertCircle } from "lucide-react";

type GovernanceEnvelope = { data: Record<string, unknown>[] };

export default function SecurityThreatsPage() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["security", "threats"],
    queryFn: async () => {
      const res = await fetch("/api/security/threats");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const signals = (data?.data ?? []) as {
    signalId: string;
    type: string;
    severity: string;
    tenantId?: string | null;
    actorId?: string | null;
    ip?: string | null;
    timestamp: string;
    resolved?: boolean;
    mitigated?: boolean;
  }[];

  return (
    <PageContainer>
      <PageHeader
        title="Threat Signals"
        description="Live threat signal feed — brute force, credential spray, data exfil"
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
            <span className="font-mono text-sm">Failed to load threat signals</span>
          </div>
        )}
        {!isLoading && !error && <ThreatSignalTable signals={signals} />}
      </SecurityGateBanner>
    </PageContainer>
  );
}
