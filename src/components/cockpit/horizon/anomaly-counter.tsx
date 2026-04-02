"use client";

/**
 * Anomaly Counter — Clickable counters for anomalies, denials, degraded deps.
 * Clicking emits a selection intent (even if downstream zones are placeholder-backed).
 */

import { useSelectionActions } from "@/lib/cockpit/use-focus";
import type { HorizonCounters } from "./use-horizon-data";

interface AnomalyCounterProps {
  counters: HorizonCounters;
}

export function AnomalyCounter({ counters }: AnomalyCounterProps) {
  const { select } = useSelectionActions();

  const items = [
    {
      label: "ANM",
      count: counters.anomalies,
      color: counters.anomalies > 0 ? "text-amber-400" : "text-[#C5C6C7]/30",
      hoverColor: "hover:text-amber-300",
      kind: "alert" as const,
      id: "anomaly_summary",
    },
    {
      label: "DEN",
      count: counters.denials,
      color: counters.denials > 0 ? "text-[#E94560]" : "text-[#C5C6C7]/30",
      hoverColor: "hover:text-[#E94560]",
      kind: "alert" as const,
      id: "denial_summary",
    },
    {
      label: "DEG",
      count: counters.degradedDeps,
      color: counters.degradedDeps > 0 ? "text-orange-400" : "text-[#C5C6C7]/30",
      hoverColor: "hover:text-orange-300",
      kind: "alert" as const,
      id: "degraded_summary",
    },
  ];

  return (
    <div className="flex items-center gap-2 mr-3 shrink-0">
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() =>
            item.count > 0 &&
            select({
              kind: item.kind,
              id: item.id,
              correlationId: null,
              source: "horizon",
              anchorType: "derived",
            })
          }
          className={`flex items-center gap-0.5 ${item.color} ${
            item.count > 0 ? `cursor-pointer ${item.hoverColor} transition-colors` : "cursor-default"
          }`}
          title={`${item.label}: ${item.count}`}
          disabled={item.count === 0}
        >
          <span className="text-[9px] font-mono font-bold">{item.count}</span>
          <span className="text-[8px] font-mono opacity-60">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

