"use client";
import * as React from "react";
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
    <div className="overflow-x-auto">
      <table className="w-full font-mono text-sm">
        <thead>
          <tr className="border-b border-[#384656]">
            <th className="pb-2 text-left text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Name</th>
            <th className="pb-2 text-center text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Status</th>
            <th className="pb-2 text-center text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Canary %</th>
            <th className="pb-2 text-left text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Version</th>
            <th className="pb-2 text-left text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Started</th>
          </tr>
        </thead>
        <tbody>
          {rollouts.map((rollout) => (
            <tr key={rollout.rolloutId} className="border-b border-[#384656]/40 hover:bg-[#1F2833]/50">
              <td className="py-3 text-[#C5C6C7]">{rollout.name}</td>
              <td className="py-3 text-center">
                <Badge variant={statusVariant(rollout.status)}>{rollout.status}</Badge>
              </td>
              <td className="py-3 text-center text-[#66FCF1]">
                {rollout.canaryPercentage !== undefined ? `${rollout.canaryPercentage}%` : "—"}
              </td>
              <td className="py-3 text-[#C5C6C7] opacity-70">
                {rollout.targetVersion ?? "—"}
              </td>
              <td className="py-3 text-xs text-[#C5C6C7] opacity-60">
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
