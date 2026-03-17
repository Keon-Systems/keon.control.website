"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { SecurityGateBanner, AbuseEventTable } from "@/components/security";
import { AlertCircle } from "lucide-react";

type GovernanceEnvelope = { data: Record<string, unknown>[] };

export default function SecurityAbusePage() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["security", "abuse"],
    queryFn: async () => {
      const res = await fetch("/api/security/abuse");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 15_000,
  });

  const events = (data?.data ?? []) as {
    eventId?: string;
    abuseId?: string;
    type: string;
    tenantId?: string | null;
    actorId?: string | null;
    severity: string;
    timestamp?: string;
    detectedAt?: string;
    status?: "open" | "resolved";
    actionTaken?: string;
  }[];

  return (
    <PageContainer>
      <PageHeader
        title="Abuse Events"
        description="Rate limit breaches, API scraping, content policy and data exfil attempts"
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
            <span className="font-mono text-sm">Failed to load abuse events</span>
          </div>
        )}
        {!isLoading && !error && <AbuseEventTable events={events} />}
      </SecurityGateBanner>
    </PageContainer>
  );
}
