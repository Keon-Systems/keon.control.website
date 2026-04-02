"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Siren } from "lucide-react";
import { PageContainer, PageHeader, Card } from "@/components/layout/page-container";
import { IncidentWorkspaceHeader } from "@/components/incidents";
import { cn } from "@/lib/utils";

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
  data: Incident;
}

type TabKey = "overview" | "timeline" | "blast-radius" | "comms";

const tabs: { key: TabKey; label: string; href: (id: string) => string }[] = [
  { key: "overview", label: "Overview", href: (id) => `/incidents/${id}` },
  { key: "timeline", label: "Timeline", href: (id) => `/incidents/${id}/timeline` },
  { key: "blast-radius", label: "Blast Radius", href: (id) => `/incidents/${id}/blast-radius` },
  { key: "comms", label: "Comms", href: (id) => `/incidents/${id}/comms` },
];

export default function IncidentWorkspacePage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, error } = useQuery<GovernanceEnvelope>({
    queryKey: ["incidents", id],
    queryFn: async () => {
      const res = await fetch(`/api/incidents/${id}`);
      if (!res.ok) throw new Error("Failed to load incident");
      return res.json();
    },
    staleTime: 30_000,
  });

  const incident = data?.data;

  return (
    <PageContainer>
      <PageHeader
        title="Incident Workspace"
        description={id}
      />

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-0 border-b border-[#384656]">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href(id)}
            className={cn(
              "border-b-2 px-4 py-2.5 font-mono text-sm transition-colors",
              tab.key === "overview"
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
          <div className="h-28 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded border border-red-500/40 bg-red-500/10 p-4 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span className="font-mono text-sm">Failed to load incident</span>
        </div>
      )}

      {!isLoading && !error && !incident && (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <Siren className="mb-4 h-12 w-12 text-[#384656]" />
          <p className="font-mono text-base text-[#C5C6C7]">Incident not found</p>
        </div>
      )}

      {!isLoading && !error && incident && (
        <div className="space-y-6">
          {/* Header Bar */}
          <IncidentWorkspaceHeader incident={incident} />

          {/* Key Facts Grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card className="p-4">
              <div className="font-mono text-2xl font-bold tabular-nums text-[#C5C6C7]">
                {incident.tenantIds.length}
              </div>
              <div className="mt-1 font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-50">
                Tenants Affected
              </div>
            </Card>
            <Card className="p-4">
              <div className="font-mono text-2xl font-bold tabular-nums text-[#C5C6C7]">
                {incident.affectedSubsystems.length}
              </div>
              <div className="mt-1 font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-50">
                Subsystems
              </div>
            </Card>
            <Card className="p-4">
              <div className="font-mono text-sm font-medium text-[#C5C6C7] uppercase">
                {incident.severity}
              </div>
              <div className="mt-1 font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-50">
                Severity
              </div>
            </Card>
            <Card className="p-4">
              <div className="font-mono text-sm font-medium text-[#C5C6C7] capitalize">
                {incident.status}
              </div>
              <div className="mt-1 font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-50">
                Status
              </div>
            </Card>
          </div>

          {/* Affected Details */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {incident.tenantIds.length > 0 && (
              <Card>
                <div className="mb-3 font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
                  Affected Tenants
                </div>
                <div className="flex flex-wrap gap-2">
                  {incident.tenantIds.map((tid) => (
                    <span
                      key={tid}
                      className="rounded border border-[#384656] bg-[#0B0C10] px-2 py-1 font-mono text-xs text-[#C5C6C7]"
                    >
                      {tid}
                    </span>
                  ))}
                </div>
              </Card>
            )}
            {incident.affectedSubsystems.length > 0 && (
              <Card>
                <div className="mb-3 font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
                  Affected Subsystems
                </div>
                <div className="flex flex-wrap gap-2">
                  {incident.affectedSubsystems.map((sys) => (
                    <span
                      key={sys}
                      className="rounded border border-amber-400/40 bg-amber-400/10 px-2 py-1 font-mono text-xs text-amber-400"
                    >
                      {sys}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
