"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Ban } from "lucide-react";

interface AbuseEvent {
  // eventId (spec) or abuseId (existing mock data)
  eventId?: string;
  abuseId?: string;
  type: string;
  tenantId?: string | null;
  actorId?: string | null;
  severity: string;
  // timestamp (spec) or detectedAt (existing mock data)
  timestamp?: string;
  detectedAt?: string;
  // status (spec) or actionTaken (existing mock data)
  status?: "open" | "resolved";
  actionTaken?: string;
}

interface AbuseEventTableProps {
  events: AbuseEvent[];
}

function typeBadgeClass(type: string): string {
  switch (type) {
    case "rate_limit_breach":
      return "bg-amber-950 text-amber-400 border border-amber-800";
    case "content_policy":
      return "bg-purple-950 text-purple-400 border border-purple-800";
    case "api_scraping":
      return "bg-blue-950 text-blue-400 border border-blue-800";
    case "data_exfil_attempt":
      return "bg-red-950 text-red-400 border border-red-800";
    default:
      return "bg-[#1F2833] text-[#C5C6C7] border border-[#384656]";
  }
}

function severityBadgeClass(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return "bg-red-950 text-red-400 border border-red-800";
    case "high":
      return "bg-amber-950 text-amber-400 border border-amber-800";
    case "medium":
    default:
      return "bg-yellow-950 text-yellow-400 border border-yellow-800";
  }
}

function formatAge(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function getEventId(event: AbuseEvent): string {
  return event.eventId ?? event.abuseId ?? "—";
}

function getTimestamp(event: AbuseEvent): string {
  return event.timestamp ?? event.detectedAt ?? "";
}

function getStatus(event: AbuseEvent): string {
  if (event.status) return event.status;
  if (event.actionTaken) return event.actionTaken;
  return "open";
}

export function AbuseEventTable({ events }: AbuseEventTableProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 opacity-50">
        <Ban className="mb-3 h-8 w-8 text-[#384656]" />
        <p className="font-mono text-sm text-[#C5C6C7]">No abuse events</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-[#384656]">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="border-b border-[#384656] bg-[#0B0C10]">
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Event ID</th>
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Type</th>
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Tenant</th>
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Actor</th>
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Severity</th>
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Age</th>
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Status</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, idx) => {
            const ts = getTimestamp(event);
            const status = getStatus(event);
            const isResolved = status === "resolved";
            return (
              <tr
                key={getEventId(event) + idx}
                className="border-b border-[#384656] last:border-0 hover:bg-[#1F2833] transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-[#66FCF1]">{getEventId(event)}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded px-2 py-0.5 font-mono text-xs", typeBadgeClass(event.type))}>
                    {event.type}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[#C5C6C7] opacity-70">
                  {event.tenantId ?? <span className="opacity-40">—</span>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[#C5C6C7] opacity-70">
                  {event.actorId ?? <span className="opacity-40">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={cn("rounded px-2 py-0.5 font-mono text-xs", severityBadgeClass(event.severity))}>
                    {event.severity}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[#C5C6C7] opacity-70">
                  {ts ? formatAge(ts) : <span className="opacity-40">—</span>}
                </td>
                <td className="px-4 py-3">
                  {isResolved ? (
                    <span className="rounded bg-emerald-950 px-2 py-0.5 font-mono text-xs text-emerald-400 border border-emerald-800">
                      {status}
                    </span>
                  ) : (
                    <span className="rounded bg-amber-950 px-2 py-0.5 font-mono text-xs text-amber-400 border border-amber-800">
                      {status}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
