"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    <div className="overflow-x-auto rounded border border-[#384656]">
      <table className="w-full min-w-[720px]">
        <thead className="border-b border-[#384656] bg-[#0B0C10]">
          <tr>
            <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wider">
              Job
            </th>
            <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wider">
              Queue
            </th>
            <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wider">
              Attempts
            </th>
            <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wider">
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
              <td className="px-4 py-3.5">
                <span className="font-mono text-[13px] text-[#C5C6C7] sm:text-sm">{entry.name}</span>
                <div className="font-mono text-[12px] text-[#C5C6C7] opacity-40 sm:text-xs">{entry.jobId}</div>
              </td>
              <td className="px-4 py-3.5">
                <span className="font-mono text-[12px] text-[#C5C6C7] opacity-70 sm:text-xs">{entry.queue}</span>
              </td>
              <td className="px-4 py-3.5">
                <span
                  className={cn(
                    "font-mono text-[13px] tabular-nums sm:text-sm",
                    entry.attempts > 3 ? "text-amber-400" : "text-[#C5C6C7]"
                  )}
                >
                  {entry.attempts}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <Badge
                  variant={statusBadgeVariant[entry.status]}
                  className={cn(
                    "font-mono",
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
