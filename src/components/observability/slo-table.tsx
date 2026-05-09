"use client";

import { Badge } from "@/components/ui/badge";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface SloEntry {
  sloId: string;
  name: string;
  target: number;
  burnRate: number;
  errorBudgetRemaining: number;
  errorBudgetTotal: number;
  currentErrorRate: number;
  status: "healthy" | "burning" | "critical";
  window: string;
}

interface SloTableProps {
  entries: SloEntry[];
}

function statusBadgeVariant(status: SloEntry["status"]): "healthy" | "warning" | "critical" {
  if (status === "healthy") return "healthy";
  if (status === "burning") return "warning";
  return "critical";
}

function burnRateColor(burnRate: number): string {
  if (burnRate > 2) return "text-red-400";
  if (burnRate > 1) return "text-amber-400";
  return "text-[#45A29E]";
}

export function SloTable({ entries }: SloTableProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 opacity-50">
        <p className="font-mono text-sm text-[#C5C6C7]">No SLO data available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-[#384656]">
      <table className="w-full min-w-[820px]">
        <thead className="border-b border-[#384656] bg-[#0B0C10]">
          <tr>
            <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wider">
              SLO Name
            </th>
            <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wider">
              Target
            </th>
            <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wider">
              Burn Rate
            </th>
            <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wider">
              Budget Remaining
            </th>
            <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wider">
              Window
            </th>
            <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-[#C5C6C7] opacity-60 sm:text-xs sm:tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#384656]">
          {entries.map((entry) => (
            <tr
              key={entry.sloId}
              className="transition-colors hover:bg-[#384656]/20"
            >
              <td className="px-4 py-3.5">
                <span className="font-mono text-[13px] text-[#C5C6C7] sm:text-sm">{entry.name}</span>
                <div className="font-mono text-[12px] text-[#C5C6C7] opacity-40 sm:text-xs">{entry.sloId}</div>
              </td>
              <td className="px-4 py-3.5">
                <span className="font-mono text-[13px] text-[#C5C6C7] sm:text-sm">
                  {formatPercent(entry.target * 100, 2)}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <span className={cn("font-mono text-[13px] tabular-nums sm:text-sm", burnRateColor(entry.burnRate))}>
                  {entry.burnRate.toFixed(2)}x
                </span>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-28 overflow-hidden rounded-full bg-[#384656]">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        entry.errorBudgetRemaining > 0.5
                          ? "bg-[#45A29E]"
                          : entry.errorBudgetRemaining > 0.2
                          ? "bg-amber-400"
                          : "bg-red-400"
                      )}
                      style={{ width: `${Math.max(0, Math.min(100, entry.errorBudgetRemaining * 100))}%` }}
                    />
                  </div>
                  <span className="font-mono text-[12px] text-[#C5C6C7] opacity-70 sm:text-xs">
                    {formatPercent(entry.errorBudgetRemaining * 100)}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <span className="font-mono text-[12px] text-[#C5C6C7] opacity-60 sm:text-xs">{entry.window}</span>
              </td>
              <td className="px-4 py-3.5">
                <Badge variant={statusBadgeVariant(entry.status)} className="font-mono">
                  {entry.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
