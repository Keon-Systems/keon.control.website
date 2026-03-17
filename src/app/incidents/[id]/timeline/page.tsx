"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { PageContainer, PageHeader, Card, CardContent } from "@/components/layout/page-container";
import { IncidentTimelineView } from "@/components/incidents";
import type { TimelineEvent } from "@/components/incidents";
import { cn } from "@/lib/utils";

interface TimelineEnvelope {
  data: TimelineEvent[];
}

const tabs = [
  { key: "overview", label: "Overview", href: (id: string) => `/incidents/${id}` },
  { key: "timeline", label: "Timeline", href: (id: string) => `/incidents/${id}/timeline` },
  { key: "blast-radius", label: "Blast Radius", href: (id: string) => `/incidents/${id}/blast-radius` },
  { key: "comms", label: "Comms", href: (id: string) => `/incidents/${id}/comms` },
];

export default function TimelinePage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, error } = useQuery<TimelineEnvelope>({
    queryKey: ["incidents", id, "timeline"],
    queryFn: async () => {
      const res = await fetch(`/api/incidents/${id}/timeline`);
      if (!res.ok) throw new Error("Failed to load timeline");
      return res.json();
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const events: TimelineEvent[] = data?.data ?? [];

  return (
    <PageContainer>
      <PageHeader
        title="Incident Timeline"
        description={`Incident ${id} — chronological event log`}
      />

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-0 border-b border-[#384656]">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href(id)}
            className={cn(
              "border-b-2 px-4 py-2.5 font-mono text-sm transition-colors",
              tab.key === "timeline"
                ? "border-[#66FCF1] text-[#66FCF1]"
                : "border-transparent text-[#C5C6C7] opacity-60 hover:opacity-100 hover:text-[#C5C6C7]"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded border border-red-500/40 bg-red-500/10 p-4 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span className="font-mono text-sm">Failed to load timeline</span>
        </div>
      )}

      {!isLoading && !error && (
        <Card>
          <CardContent className="p-4">
            <IncidentTimelineView events={events} />
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
