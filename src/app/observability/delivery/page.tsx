"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Send } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { DeliveryHealthPanel } from "@/components/observability";
import type { DeliveryChannel } from "@/components/observability";

interface GovernanceEnvelope {
  data: DeliveryChannel[];
}

export default function DeliveryPage() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["observability", "delivery"],
    queryFn: async () => {
      const res = await fetch("/api/observability/delivery");
      if (!res.ok) throw new Error("Failed to load delivery health");
      return res.json();
    },
    staleTime: 30_000,
  });

  const channels: DeliveryChannel[] = data?.data ?? [];

  return (
    <PageContainer>
      <PageHeader
        title="Delivery Health"
        description="Notification channel success rates, bounce counts, and retry queue depths"
      />

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded border border-red-500/40 bg-red-500/10 p-4 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span className="font-mono text-sm">Failed to load delivery health</span>
        </div>
      )}

      {!isLoading && !error && channels.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <Send className="mb-4 h-12 w-12 text-[#384656]" />
          <p className="font-mono text-base text-[#C5C6C7]">No delivery channel data available</p>
        </div>
      )}

      {!isLoading && !error && channels.length > 0 && (
        <DeliveryHealthPanel channels={channels} />
      )}
    </PageContainer>
  );
}
