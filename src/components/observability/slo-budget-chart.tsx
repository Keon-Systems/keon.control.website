"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/format";
import type { SloEntry } from "./slo-table";

interface SloBudgetChartProps {
  entries: SloEntry[];
}

export function SloBudgetChart({ entries }: SloBudgetChartProps) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
        const budgetPct = entry.errorBudgetRemaining * 100;
        const isHealthy = entry.status === "healthy";
        const isBurning = entry.status === "burning";
        const isCritical = entry.status === "critical";

        const barColor = isCritical
          ? "bg-red-400"
          : isBurning
          ? "bg-amber-400"
          : "bg-[#45A29E]";

        const labelColor = isCritical
          ? "text-red-400"
          : isBurning
          ? "text-amber-400"
          : "text-[#45A29E]";

        return (
          <div key={entry.sloId} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#C5C6C7]">{entry.name}</span>
              <span className={cn("font-mono text-xs tabular-nums", labelColor)}>
                {formatPercent(budgetPct)} remaining
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#384656]">
              <div
                className={cn("h-full rounded-full transition-all", barColor)}
                style={{ width: `${Math.max(0, Math.min(100, budgetPct))}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#C5C6C7] opacity-40">
                target: {formatPercent(entry.target * 100, 2)}
              </span>
              <span className="font-mono text-[10px] text-[#C5C6C7] opacity-40">
                burn: {entry.burnRate.toFixed(2)}x
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
