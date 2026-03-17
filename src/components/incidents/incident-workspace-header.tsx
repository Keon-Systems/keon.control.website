"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";

export interface IncidentHeaderData {
  id: string;
  title: string;
  severity: "sev1" | "sev2" | "sev3" | "sev4";
  status: "investigating" | "mitigated" | "resolved";
  incidentCommander: string;
  startedAt: string;
  resolvedAt?: string | null;
}

interface IncidentWorkspaceHeaderProps {
  incident: IncidentHeaderData;
}

const severityVariant: Record<string, "critical" | "warning" | "default"> = {
  sev1: "critical",
  sev2: "warning",
  sev3: "warning",
  sev4: "default",
};

const statusVariant: Record<string, "critical" | "warning" | "healthy" | "default"> = {
  investigating: "critical",
  mitigated: "warning",
  resolved: "healthy",
};

function formatAge(startedAt: string, resolvedAt: string | null | undefined): string {
  const end = resolvedAt ? new Date(resolvedAt) : new Date();
  const ms = end.getTime() - new Date(startedAt).getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function IncidentWorkspaceHeader({ incident }: IncidentWorkspaceHeaderProps) {
  return (
    <div className="rounded border border-[#384656] bg-[#1F2833] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={severityVariant[incident.severity]}
              className="font-mono text-xs uppercase"
            >
              {incident.severity}
            </Badge>
            <Badge
              variant={statusVariant[incident.status]}
              className="font-mono text-xs capitalize"
            >
              {incident.status}
            </Badge>
            <span className="font-mono text-xs text-[#C5C6C7] opacity-40">{incident.id}</span>
          </div>
          <h1 className="font-['Rajdhani'] text-2xl font-bold tracking-tight text-[#C5C6C7]">
            {incident.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#C5C6C7] opacity-60">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="font-mono">IC: {incident.incidentCommander}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="font-mono">
                {formatAge(incident.startedAt, incident.resolvedAt)} ago
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
