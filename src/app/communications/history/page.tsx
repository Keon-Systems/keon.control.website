"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader, Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { MessageHistoryTable } from "@/components/communications";
import { AlertCircle } from "lucide-react";

type GovernanceEnvelope = { data: Record<string, unknown>[] };

export default function MessageHistoryPage() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["communications", "history"],
    queryFn: async () => {
      const res = await fetch("/api/communications/history");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 60_000,
  });

  return (
    <PageContainer>
      <PageHeader
        title="Message History"
        description="All sent communications to tenants"
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
          <span className="font-mono text-sm">Failed to load message history</span>
        </div>
      )}
      {data && (
        <Card>
          <CardHeader
            title="Sent Messages"
            description={`${data.data.length} message${data.data.length !== 1 ? "s" : ""} in history`}
          />
          <CardContent>
            <MessageHistoryTable
              messages={
                data.data as Array<{
                  messageId: string;
                  subject: string;
                  tenantIds: string[] | string;
                  channel: string;
                  status: string;
                  sentAt: string;
                }>
              }
            />
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
