"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowRight } from "lucide-react";
import { PageContainer, PageHeader, Card } from "@/components/layout/page-container";
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

const tabs = [
  { key: "overview", label: "Overview", href: (id: string) => `/incidents/${id}` },
  { key: "timeline", label: "Timeline", href: (id: string) => `/incidents/${id}/timeline` },
  { key: "blast-radius", label: "Blast Radius", href: (id: string) => `/incidents/${id}/blast-radius` },
  { key: "comms", label: "Comms", href: (id: string) => `/incidents/${id}/comms` },
];

export default function BlastRadiusPage() {
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
        title="Blast Radius"
        description={`Incident ${id} — affected tenants and subsystems`}
      />

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-0 border-b border-[#384656]">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href(id)}
            className={cn(
              "border-b-2 px-4 py-2.5 font-mono text-sm transition-colors",
              tab.key === "blast-radius"
                ? "border-[#66FCF1] text-[#66FCF1]"
                : "border-transparent text-[#C5C6C7] opacity-60 hover:opacity-100 hover:text-[#C5C6C7]"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded border border-[#384656] bg-[#1F2833]" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded border border-red-500/40 bg-red-500/10 p-4 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span className="font-mono text-sm">Failed to load blast radius data</span>
        </div>
      )}

      {!isLoading && !error && incident && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Affected Tenants */}
          <Card>
            <div className="mb-4 border-b border-[#384656] pb-3">
              <h2 className="font-mono text-sm uppercase tracking-wider text-[#C5C6C7] opacity-70">
                Affected Tenants
                <span className="ml-2 text-[#66FCF1]">({incident.tenantIds.length})</span>
              </h2>
            </div>
            {incident.tenantIds.length === 0 ? (
              <p className="font-mono text-sm text-[#C5C6C7] opacity-40">No tenants affected</p>
            ) : (
              <div className="space-y-2">
                {incident.tenantIds.map((tid) => (
                  <div
                    key={tid}
                    className="flex items-center gap-3 rounded border border-[#384656] bg-[#0B0C10] px-3 py-2"
                  >
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#C5C6C7] opacity-40" />
                    <span className="font-mono text-sm text-[#C5C6C7]">{tid}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Affected Subsystems */}
          <Card>
            <div className="mb-4 border-b border-[#384656] pb-3">
              <h2 className="font-mono text-sm uppercase tracking-wider text-[#C5C6C7] opacity-70">
                Affected Subsystems
                <span className="ml-2 text-amber-400">({incident.affectedSubsystems.length})</span>
              </h2>
            </div>
            {incident.affectedSubsystems.length === 0 ? (
              <p className="font-mono text-sm text-[#C5C6C7] opacity-40">No subsystems affected</p>
            ) : (
              <div className="space-y-2">
                {incident.affectedSubsystems.map((sys) => (
                  <div
                    key={sys}
                    className="flex items-center gap-3 rounded border border-amber-400/30 bg-amber-400/5 px-3 py-2"
                  >
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-amber-400 opacity-70" />
                    <span className="font-mono text-sm text-amber-400">{sys}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
