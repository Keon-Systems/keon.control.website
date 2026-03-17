"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
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

export default function TenantSupportPage() {
  const params = useParams<{ id: string }>();
  const tenantId = params.id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tenant-support", tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/tenants/${tenantId}/support`);
      if (!res.ok) throw new Error("Support data unavailable");
      const json = await res.json() as { data: SupportTicket[] };
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex h-48 items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#66FCF1]" />
          <span className="font-mono text-sm text-[#C5C6C7] opacity-60">Loading tickets…</span>
        </div>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer>
        <p className="font-mono text-sm text-red-400">Support data unavailable.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <TicketQueue tickets={data ?? []} />
    </PageContainer>
  );
}
