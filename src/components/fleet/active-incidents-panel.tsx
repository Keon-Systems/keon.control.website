"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Siren } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  startedAt: string;
  tenantIds: string[];
  incidentCommander: string;
}

interface GovernanceEnvelope {
  data: Incident[];
}

const severityColors: Record<string, string> = {
  sev1: "text-red-400 border-red-500/40 bg-red-500/10",
  sev2: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  sev3: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
  sev4: "text-[#C5C6C7] border-[#384656] bg-[#1F2833]",
};

const statusColors: Record<string, string> = {
  investigating: "text-red-400",
  mitigated: "text-amber-400",
  resolved: "text-[#66FCF1]",
};

function formatAge(startedAt: string): string {
  const ms = Date.now() - new Date(startedAt).getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function ActiveIncidentsPanel() {
  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["incidents"],
    queryFn: async () => {
      const res = await fetch("/api/incidents");
      if (!res.ok) throw new Error("Failed to fetch incidents");
      return res.json();
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const activeIncidents =
    data?.data?.filter((i) => i.status !== "resolved") ?? [];
  const total = data?.data?.length ?? 0;

  return (
    <div className="flex flex-col rounded border border-[#384656] bg-[#1F2833]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#384656] px-4 py-3">
        <div className="flex items-center gap-2">
          <Siren className="h-4 w-4 text-[#66FCF1]" />
          <span className="font-mono text-sm font-medium text-[#C5C6C7]">Active Incidents</span>
        </div>
        <div className="flex items-center gap-2">
          {activeIncidents.length > 0 && (
            <span className="rounded bg-red-500/20 px-2 py-0.5 font-mono text-xs text-red-400">
              {activeIncidents.length} open
            </span>
          )}
          <Link
            href="/incidents"
            className="font-mono text-xs text-[#66FCF1] hover:underline"
          >
            All ({total}) →
          </Link>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 divide-y divide-[#384656]">
        {isLoading && (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-[#384656]" />
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="font-mono text-xs">Failed to load incidents</span>
          </div>
        )}

        {!isLoading && !error && activeIncidents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Siren className="mb-2 h-8 w-8 text-[#384656]" />
            <p className="font-mono text-sm text-[#C5C6C7] opacity-50">No active incidents</p>
          </div>
        )}

        {activeIncidents.slice(0, 5).map((incident) => (
          <Link
            key={incident.id}
            href={`/incidents/${incident.id}`}
            className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[#384656]"
          >
            <span
              className={cn(
                "mt-0.5 shrink-0 rounded border px-1.5 py-0.5 font-mono text-xs font-bold uppercase",
                severityColors[incident.severity] ?? severityColors.sev4
              )}
            >
              {incident.severity}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-sm text-[#C5C6C7]">{incident.title}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span
                  className={cn(
                    "font-mono text-xs capitalize",
                    statusColors[incident.status] ?? "text-[#C5C6C7]"
                  )}
                >
                  {incident.status}
                </span>
                <span className="font-mono text-xs text-[#C5C6C7] opacity-40">
                  {formatAge(incident.startedAt)} ago
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
