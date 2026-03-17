"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { SubscriptionPanel } from "@/components/tenants/subscription-panel";
import { Loader2 } from "lucide-react";

interface SubscriptionData {
  tenantId: string;
  plan: string;
  status: string;
  mrr: number;
  seats: number;
  usedSeats: number;
  billingCycleAnchor: number;
  trialEndDate: string | null;
  createdAt: string;
}

export default function TenantSubscriptionPage() {
  const params = useParams<{ id: string }>();
  const tenantId = params.id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tenant-subscription", tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/tenants/${tenantId}/subscription`);
      if (!res.ok) throw new Error("Subscription data unavailable");
      const json = await res.json() as { data: SubscriptionData };
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex h-48 items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#66FCF1]" />
          <span className="font-mono text-sm text-[#C5C6C7] opacity-60">Loading subscription…</span>
        </div>
      </PageContainer>
    );
  }

  if (isError || !data) {
    return (
      <PageContainer>
        <p className="font-mono text-sm text-red-400">Subscription data unavailable.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SubscriptionPanel data={data} />
    </PageContainer>
  );
}
