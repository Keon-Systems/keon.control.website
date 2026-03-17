"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AlertCircle, Plus, Siren } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Incident {
  id: string;
  title: string;
  severity: "sev1" | "sev2" | "sev3" | "sev4";
  status: "investigating" | "mitigated" | "resolved";
  startedAt: string;
  resolvedAt: string | null;
  tenantIds: string[];
  affectedSubsystems: string[];
  incidentCommander: string;
}

interface GovernanceEnvelope {
  data: Incident[];
}

const SEVERITIES = ["sev1", "sev2", "sev3", "sev4"] as const;
const STATUSES = ["investigating", "mitigated", "resolved"] as const;

const severityBadgeVariant: Record<string, "critical" | "warning" | "healthy" | "default"> = {
  sev1: "critical",
  sev2: "warning",
  sev3: "warning",
  sev4: "default",
};

const statusBadgeVariant: Record<string, "critical" | "warning" | "healthy" | "default"> = {
  investigating: "critical",
  mitigated: "warning",
  resolved: "healthy",
};

function formatAge(startedAt: string, resolvedAt: string | null): string {
  const end = resolvedAt ? new Date(resolvedAt) : new Date();
  const ms = end.getTime() - new Date(startedAt).getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function IncidentsPage() {
  const [severityFilter, setSeverityFilter] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null);

  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["incidents"],
    queryFn: async () => {
      const res = await fetch("/api/incidents");
      if (!res.ok) throw new Error("Failed to load incidents");
      return res.json();
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const incidents = data?.data ?? [];

  const filtered = incidents.filter((i) => {
    if (severityFilter && i.severity !== severityFilter) return false;
    if (statusFilter && i.status !== statusFilter) return false;
    return true;
  });

  return (
    <PageContainer>
      <PageHeader
        title="Incidents"
        description="Active and historical incident queue"
        actions={
          <Button asChild className="gap-2">
            <Link href="/incidents/new">
              <Plus className="h-4 w-4" />
              Declare Incident
            </Link>
          </Button>
        }
      />

      {/* Filter Chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="font-mono text-xs text-[#C5C6C7] opacity-50 self-center">Severity:</span>
        <button
          onClick={() => setSeverityFilter(null)}
          className={cn(
            "rounded border px-3 py-1 font-mono text-xs transition-colors",
            !severityFilter
              ? "border-[#66FCF1] bg-[#66FCF1]/10 text-[#66FCF1]"
              : "border-[#384656] text-[#C5C6C7] hover:border-[#66FCF1]/50"
          )}
        >
          All
        </button>
        {SEVERITIES.map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev === severityFilter ? null : sev)}
            className={cn(
              "rounded border px-3 py-1 font-mono text-xs uppercase transition-colors",
              severityFilter === sev
                ? "border-[#66FCF1] bg-[#66FCF1]/10 text-[#66FCF1]"
                : "border-[#384656] text-[#C5C6C7] hover:border-[#66FCF1]/50"
            )}
          >
            {sev}
          </button>
        ))}

        <span className="ml-4 font-mono text-xs text-[#C5C6C7] opacity-50 self-center">Status:</span>
        {STATUSES.map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st === statusFilter ? null : st)}
            className={cn(
              "rounded border px-3 py-1 font-mono text-xs capitalize transition-colors",
              statusFilter === st
                ? "border-[#66FCF1] bg-[#66FCF1]/10 text-[#66FCF1]"
                : "border-[#384656] text-[#C5C6C7] hover:border-[#66FCF1]/50"
            )}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Incidents List */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded border border-red-500/40 bg-red-500/10 p-4 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span className="font-mono text-sm">Failed to load incidents</span>
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Siren className="mb-4 h-12 w-12 text-[#384656]" />
          <p className="font-mono text-base text-[#C5C6C7] opacity-50">
            {incidents.length === 0 ? "No incidents" : "No incidents match the selected filters"}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((incident) => (
          <Link
            key={incident.id}
            href={`/incidents/${incident.id}`}
            className="block rounded border border-[#384656] bg-[#1F2833] p-4 transition-colors hover:border-[#66FCF1]/30 hover:bg-[#384656]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={severityBadgeVariant[incident.severity]} className="font-mono text-xs uppercase">
                    {incident.severity}
                  </Badge>
                  <span className="font-mono text-sm font-medium text-[#C5C6C7]">
                    {incident.title}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#C5C6C7] opacity-60">
                  <span className="font-mono">{incident.id}</span>
                  <span>·</span>
                  <span className="font-mono">{formatAge(incident.startedAt, incident.resolvedAt)}</span>
                  <span>·</span>
                  <span className="font-mono">
                    {incident.tenantIds.length} tenant{incident.tenantIds.length !== 1 ? "s" : ""}
                  </span>
                  {incident.affectedSubsystems.length > 0 && (
                    <>
                      <span>·</span>
                      <span className="font-mono">{incident.affectedSubsystems.join(", ")}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                <Badge variant={statusBadgeVariant[incident.status]} className="font-mono text-xs capitalize">
                  {incident.status}
                </Badge>
              </div>
            </div>
            <div className="mt-2 text-xs text-[#C5C6C7] opacity-40">
              <span className="font-mono">IC: {incident.incidentCommander}</span>
            </div>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
