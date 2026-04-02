"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { TicketQueue } from "@/components/support/ticket-queue";
import { Loader2 } from "lucide-react";

interface SupportTicket {
  ticketId: string;
  tenantId: string;
  tenantName: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  lastReplyAt: string;
  assignee: string | null;
}

export default function SupportQueuePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["support-queue"],
    queryFn: async () => {
      const res = await fetch("/api/support/queue");
      if (!res.ok) throw new Error("Failed to load support queue");
      const json = await res.json() as { data: SupportTicket[] };
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex h-48 items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#66FCF1]" />
          <span className="font-mono text-sm text-[#C5C6C7] opacity-60">Loading queue…</span>
        </div>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer>
        <p className="font-mono text-sm text-red-400">Support queue unavailable.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Support Queue"
        description="All open and pending tickets across tenants"
      />
      <div className="mt-6">
        <TicketQueue tickets={data ?? []} />
      </div>
    </PageContainer>
  );
}
