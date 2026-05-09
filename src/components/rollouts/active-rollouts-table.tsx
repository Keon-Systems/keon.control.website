"use client";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

interface Rollout {
  rolloutId: string;
  name: string;
  status: string;
  canaryPercentage?: number;
  startedAt?: string;
  scheduledFor?: string;
  targetVersion?: string;
  currentVersion?: string;
}

interface ActiveRolloutsTableProps {
  rollouts: Rollout[];
}

function statusVariant(status: string): "healthy" | "warning" | "critical" | "neutral" {
  if (status === "active" || status === "completed") return "healthy";
  if (status === "paused") return "warning";
  if (status === "failed") return "critical";
  return "neutral";
}

export function ActiveRolloutsTable({ rollouts }: ActiveRolloutsTableProps) {
  if (rollouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 opacity-50">
        <AlertCircle className="mb-2 h-8 w-8 text-[#C5C6C7]" />
        <p className="font-mono text-sm text-[#C5C6C7]">No active rollouts</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-[#384656]">
      <table className="w-full min-w-[760px] font-mono text-sm">
        <thead>
          <tr className="border-b border-[#384656]">
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Name</th>
            <th className="px-4 py-3 text-center text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Status</th>
            <th className="px-4 py-3 text-center text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Canary %</th>
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Version</th>
            <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wide">Started</th>
          </tr>
        </thead>
        <tbody>
          {rollouts.map((rollout) => (
            <tr key={rollout.rolloutId} className="border-b border-[#384656]/40 hover:bg-[#1F2833]/50">
              <td className="px-4 py-3.5 text-[13px] text-[#C5C6C7] sm:text-sm">{rollout.name}</td>
              <td className="px-4 py-3.5 text-center">
                <Badge variant={statusVariant(rollout.status)}>{rollout.status}</Badge>
              </td>
              <td className="px-4 py-3.5 text-center text-[13px] text-[#66FCF1] sm:text-sm">
                {rollout.canaryPercentage !== undefined ? `${rollout.canaryPercentage}%` : "—"}
              </td>
              <td className="px-4 py-3.5 text-[13px] text-[#C5C6C7] opacity-70 sm:text-sm">
                {rollout.targetVersion ?? "—"}
              </td>
              <td className="px-4 py-3.5 text-[12px] text-[#C5C6C7] opacity-60 sm:text-xs">
                {rollout.startedAt
                  ? new Date(rollout.startedAt).toLocaleString()
                  : rollout.scheduledFor
                  ? `Scheduled: ${new Date(rollout.scheduledFor).toLocaleString()}`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
