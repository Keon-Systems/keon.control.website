"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface JobEntry {
  jobId: string;
  queue: string;
  name: string;
  status: "pending" | "running" | "succeeded" | "failed" | "stuck";
  attempts: number;
  startedAt?: string;
  completedAt?: string;
}

interface JobRunTableProps {
  entries: JobEntry[];
}

type BadgeVariant = "healthy" | "warning" | "critical" | "default";

const statusBadgeVariant: Record<JobEntry["status"], BadgeVariant> = {
  succeeded: "healthy",
  running: "default",
  pending: "default",
  failed: "critical",
  stuck: "warning",
};

const statusLabel: Record<JobEntry["status"], string> = {
  succeeded: "Succeeded",
  running: "Running",
  pending: "Pending",
  failed: "Failed",
  stuck: "Stuck",
};

export function JobRunTable({ entries }: JobRunTableProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 opacity-50">
        <p className="font-mono text-sm text-[#C5C6C7]">No job runs available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-[#384656] bg-[#0B0C10]">
          <tr>
            <th className="p-3 text-left font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
              Job
            </th>
            <th className="p-3 text-left font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
              Queue
            </th>
            <th className="p-3 text-left font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
              Attempts
            </th>
            <th className="p-3 text-left font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#384656]">
          {entries.map((entry) => (
            <tr
              key={entry.jobId}
              className="transition-colors hover:bg-[#384656]/20"
            >
              <td className="p-3">
                <span className="font-mono text-sm text-[#C5C6C7]">{entry.name}</span>
                <div className="font-mono text-xs text-[#C5C6C7] opacity-40">{entry.jobId}</div>
              </td>
              <td className="p-3">
                <span className="font-mono text-xs text-[#C5C6C7] opacity-70">{entry.queue}</span>
              </td>
              <td className="p-3">
                <span
                  className={cn(
                    "font-mono text-sm tabular-nums",
                    entry.attempts > 3 ? "text-amber-400" : "text-[#C5C6C7]"
                  )}
                >
                  {entry.attempts}
                </span>
              </td>
              <td className="p-3">
                <Badge
                  variant={statusBadgeVariant[entry.status]}
                  className={cn(
                    "font-mono text-xs uppercase",
                    entry.status === "running" && "border-[#66FCF1] text-[#66FCF1]"
                  )}
                >
                  {statusLabel[entry.status]}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
