"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";

interface ThreatSignal {
  signalId: string;
  type: string;
  severity: string;
  tenantId?: string | null;
  actorId?: string | null;
  ip?: string | null;
  timestamp: string;
  // resolved (spec interface) or mitigated (existing mock data)
  resolved?: boolean;
  mitigated?: boolean;
}

interface ThreatSignalTableProps {
  signals: ThreatSignal[];
}

function severityBadgeClass(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return "bg-red-950 text-red-400 border border-red-800";
    case "high":
      return "bg-amber-950 text-amber-400 border border-amber-800";
    case "medium":
      return "bg-yellow-950 text-yellow-400 border border-yellow-800";
    case "low":
    default:
      return "bg-[#1F2833] text-[#C5C6C7] border border-[#384656]";
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

function isResolved(signal: ThreatSignal): boolean {
  if (signal.resolved !== undefined) return signal.resolved;
  if (signal.mitigated !== undefined) return signal.mitigated;
  return false;
}

export function ThreatSignalTable({ signals }: ThreatSignalTableProps) {
  if (signals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 opacity-50">
        <ShieldAlert className="mb-3 h-8 w-8 text-[#384656]" />
        <p className="font-mono text-sm text-[#C5C6C7]">No threat signals</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-[#384656]">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-[#384656] bg-[#0B0C10]">
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Signal ID</th>
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Type</th>
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Severity</th>
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Tenant</th>
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">IP</th>
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Age</th>
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Status</th>
          </tr>
        </thead>
        <tbody>
          {signals.map((signal) => (
            <tr
              key={signal.signalId}
              className="border-b border-[#384656] last:border-0 hover:bg-[#1F2833] transition-colors"
            >
              <td className="px-4 py-3 font-mono text-xs text-[#66FCF1]">{signal.signalId}</td>
              <td className="px-4 py-3">
                <span className="rounded bg-[#0B0C10] px-2 py-0.5 font-mono text-xs text-[#C5C6C7] border border-[#384656]">
                  {signal.type}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={cn("rounded px-2 py-0.5 font-mono text-xs", severityBadgeClass(signal.severity))}>
                  {signal.severity}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-[#C5C6C7] opacity-70">
                {signal.tenantId ?? <span className="opacity-40">—</span>}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-[#C5C6C7] opacity-70">
                {signal.ip ?? <span className="opacity-40">—</span>}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-[#C5C6C7] opacity-70">
                {formatAge(signal.timestamp)}
              </td>
              <td className="px-4 py-3">
                {isResolved(signal) ? (
                  <span className="rounded bg-emerald-950 px-2 py-0.5 font-mono text-xs text-emerald-400 border border-emerald-800">
                    resolved
                  </span>
                ) : (
                  <span className="rounded bg-red-950 px-2 py-0.5 font-mono text-xs text-red-400 border border-red-800">
                    open
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
