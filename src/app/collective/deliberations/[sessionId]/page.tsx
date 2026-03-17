"use client";

import { DeliberationDetailView } from "@/components/collective/deliberation-detail-view";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  DeliberationSession,
  DeliberationRecord,
  DeliberationSummary,
} from "@/lib/contracts/collective";
import {
  toUIDeliberationSession,
  toUIDeliberationRecord,
} from "@/lib/mappers/collective";
import { PageHeader } from "@/ui-kit/components/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export default function DeliberationDetailPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;

  const { data, isLoading, error } = useQuery({
    queryKey: ["collective-deliberation", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/collective/deliberations/${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch deliberation detail");
      const envelope = await res.json();
      const detail = envelope.data?.[0] as {
        session: DeliberationSession;
        records: DeliberationRecord[];
        summary?: DeliberationSummary;
      } | undefined;

      if (!detail) throw new Error("No deliberation data in response");

      return {
        session: toUIDeliberationSession(detail.session),
        records: detail.records.map(toUIDeliberationRecord),
        summary: detail.summary,
      };
    },
    enabled: !!sessionId,
  });

  return (
    <div className="flex flex-col h-full bg-[#0B0C10]">
      <PageHeader
        title={data?.session.topic ?? "Deliberation Detail"}
        description="Read-only deliberation session view with lineage anchors"
      />

      <ScrollArea className="flex-1">
        <div className="p-6">
          {isLoading && (
            <div className="font-mono text-xs opacity-40">
              Loading deliberation detail...
            </div>
          )}

          {error && (
            <div className="font-mono text-xs text-red-400">
              Failed to load deliberation: {(error as Error).message}
            </div>
          )}

          {data && (
            <DeliberationDetailView
              session={data.session}
              records={data.records}
              summary={data.summary}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
