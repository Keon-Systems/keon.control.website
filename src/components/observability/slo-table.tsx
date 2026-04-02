"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatPercent } from "@/lib/format";

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
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-[#384656] bg-[#0B0C10]">
          <tr>
            <th className="p-3 text-left font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
              SLO Name
            </th>
            <th className="p-3 text-left font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
              Target
            </th>
            <th className="p-3 text-left font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
              Burn Rate
            </th>
            <th className="p-3 text-left font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
              Budget Remaining
            </th>
            <th className="p-3 text-left font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
              Window
            </th>
            <th className="p-3 text-left font-mono text-xs uppercase tracking-wider text-[#C5C6C7] opacity-60">
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
              <td className="p-3">
                <span className="font-mono text-sm text-[#C5C6C7]">{entry.name}</span>
                <div className="font-mono text-xs text-[#C5C6C7] opacity-40">{entry.sloId}</div>
              </td>
              <td className="p-3">
                <span className="font-mono text-sm text-[#C5C6C7]">
                  {formatPercent(entry.target * 100, 2)}
                </span>
              </td>
              <td className="p-3">
                <span className={cn("font-mono text-sm tabular-nums", burnRateColor(entry.burnRate))}>
                  {entry.burnRate.toFixed(2)}x
                </span>
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#384656]">
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
                  <span className="font-mono text-xs text-[#C5C6C7] opacity-70">
                    {formatPercent(entry.errorBudgetRemaining * 100)}
                  </span>
                </div>
              </td>
              <td className="p-3">
                <span className="font-mono text-xs text-[#C5C6C7] opacity-60">{entry.window}</span>
              </td>
              <td className="p-3">
                <Badge variant={statusBadgeVariant(entry.status)} className="font-mono text-xs uppercase">
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
