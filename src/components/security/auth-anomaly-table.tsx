"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

interface AuthAnomaly {
  anomalyId: string;
  type: string;
  confidence: number;
  tenantId?: string | null;
  actorId?: string | null;
  detectedAt: string;
  // mitigated (spec) or reviewStatus (existing mock data)
  mitigated?: boolean;
  reviewStatus?: string;
}

interface AuthAnomalyTableProps {
  anomalies: AuthAnomaly[];
}

function typeBadgeClass(type: string): string {
  switch (type) {
    case "geo_jump":
      return "bg-amber-950 text-amber-400 border border-amber-800";
    case "credential_spray":
      return "bg-red-950 text-red-400 border border-red-800";
    case "impossible_travel":
      return "bg-purple-950 text-purple-400 border border-purple-800";
    case "session_hijack":
      return "bg-orange-950 text-orange-400 border border-orange-800";
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

function isMitigated(anomaly: AuthAnomaly): boolean {
  if (anomaly.mitigated !== undefined) return anomaly.mitigated;
  if (anomaly.reviewStatus !== undefined) {
    return anomaly.reviewStatus === "confirmed" || anomaly.reviewStatus === "resolved";
  }
  return false;
}

export function AuthAnomalyTable({ anomalies }: AuthAnomalyTableProps) {
  if (anomalies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 opacity-50">
        <Eye className="mb-3 h-8 w-8 text-[#384656]" />
        <p className="font-mono text-sm text-[#C5C6C7]">No auth anomalies detected</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-[#384656]">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="border-b border-[#384656] bg-[#0B0C10]">
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Anomaly ID</th>
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Type</th>
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Confidence</th>
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Tenant</th>
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Actor</th>
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Detected</th>
            <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Status</th>
          </tr>
        </thead>
        <tbody>
          {anomalies.map((anomaly) => (
            <tr
              key={anomaly.anomalyId}
              className="border-b border-[#384656] last:border-0 hover:bg-[#1F2833] transition-colors"
            >
              <td className="px-4 py-3 font-mono text-xs text-[#66FCF1]">{anomaly.anomalyId}</td>
              <td className="px-4 py-3">
                <span className={cn("rounded px-2 py-0.5 font-mono text-xs", typeBadgeClass(anomaly.type))}>
                  {anomaly.type}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 rounded-full bg-[#0B0C10] overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        anomaly.confidence >= 0.9 ? "bg-red-500" :
                        anomaly.confidence >= 0.7 ? "bg-amber-500" : "bg-yellow-500"
                      )}
                      style={{ width: `${Math.round(anomaly.confidence * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-[#C5C6C7] opacity-70">
                    {Math.round(anomaly.confidence * 100)}%
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-[#C5C6C7] opacity-70">
                {anomaly.tenantId ?? <span className="opacity-40">—</span>}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-[#C5C6C7] opacity-70">
                {anomaly.actorId ?? <span className="opacity-40">—</span>}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-[#C5C6C7] opacity-70">
                {formatAge(anomaly.detectedAt)}
              </td>
              <td className="px-4 py-3">
                {isMitigated(anomaly) ? (
                  <span className="rounded bg-emerald-950 px-2 py-0.5 font-mono text-xs text-emerald-400 border border-emerald-800">
                    mitigated
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
