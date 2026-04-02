"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader, Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { RolloutScheduleCalendar } from "@/components/rollouts";
import { AlertCircle } from "lucide-react";

type GovernanceEnvelope = { data: Record<string, unknown>[] };

export default function RolloutSchedulePage() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["rollouts", "windows"],
    queryFn: async () => {
      const res = await fetch("/api/rollouts/active");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 60_000,
  });

  return (
    <PageContainer>
      <PageHeader
        title="Maintenance Schedule"
        description="Upcoming and past maintenance windows"
      />
      {isLoading && (
        <div className="h-32 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
      )}
      {error && (
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="font-mono text-sm">Failed to load schedule</span>
        </div>
      )}
      {data && (
        <Card>
          <CardHeader
            title="Maintenance Windows"
            description="Scheduled downtime and upgrade windows"
          />
          <CardContent>
            <RolloutScheduleCalendar
              windows={
                data.data
                  .filter(
                    (r) =>
                      (r as Record<string, unknown>).scheduledStart !== undefined ||
                      (r as Record<string, unknown>).scheduledFor !== undefined
                  )
                  .map((r) => {
                    const record = r as Record<string, unknown>;
                    return {
                      windowId: (record.windowId ?? record.rolloutId ?? record.id ?? "") as string,
                      name: record.name as string | undefined,
                      scheduledStart: (record.scheduledStart ?? record.scheduledFor ?? "") as string,
                      scheduledEnd: (record.scheduledEnd ?? "") as string,
                      affectedServices: record.affectedServices as string[] | undefined,
                      status: record.status as string | undefined,
                    };
                  })
              }
            />
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
