"use client";

/**
 * Alerts Mode — Operational teeth.
 * Active alerts with severity, acknowledgment status, source.
 *
 * Data: Real via alerts.adapter with mock fallback.
 */

import { fetchAlerts, type AlertRow } from "@/lib/cockpit/adapters/alerts.adapter";
import type { Selection } from "@/lib/cockpit/types";
import { useCockpitRealtime } from "@/lib/cockpit/use-cockpit-realtime";
import { useFocusSelection, useSelectionActions } from "@/lib/cockpit/use-focus";
import { formatHash, formatTimestamp } from "@/lib/format";
import { useCallback, useEffect, useMemo, useState } from "react";

const SEVERITY_CONFIG: Record<string, { label: string; color: string; heat: string; dot: string }> = {
  critical: { label: "CRIT", color: "text-[#E94560]", heat: "bg-[#E94560]", dot: "bg-[#E94560] animate-pulse" },
  high:     { label: "HIGH", color: "text-orange-400", heat: "bg-orange-400", dot: "bg-orange-400" },
  medium:   { label: "MED",  color: "text-amber-400", heat: "bg-amber-400", dot: "bg-amber-400" },
  low:      { label: "LOW",  color: "text-[#C5C6C7]/50", heat: "bg-[#C5C6C7]", dot: "bg-[#C5C6C7]/40" },
};

export function AlertsMode() {
  const { selection } = useFocusSelection();
  const { select } = useSelectionActions();
  const [rows, setRows] = useState<AlertRow[]>([]);
  const { streamingAlerts } = useCockpitRealtime();

  const loadData = useCallback(async () => {
    const result = await fetchAlerts();
    setRows(result.rows);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Merge streaming alerts (newest first) with adapter-fetched rows
  // Deduplicate by alertId — streaming alerts take precedence
  const mergedRows = useMemo(() => {
    const seen = new Set<string>();
    const merged: AlertRow[] = [];
    for (const row of [...streamingAlerts, ...rows]) {
      if (!seen.has(row.alertId)) {
        seen.add(row.alertId);
        merged.push(row);
      }
    }
    return merged;
  }, [streamingAlerts, rows]);

  const handleClick = (row: AlertRow) => {
    const sel: Selection = {
      kind: "alert",
      id: row.alertId,
      correlationId: row.correlationId,
      source: "center",
      anchorType: "derived",
    };
    select(sel);
  };

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="flex shrink-0 border-b border-[#1F2833]/40 bg-[#0B0C10]">
        <div className="w-1 shrink-0" />
        <div className="flex-1 grid grid-cols-[0.3fr_2.5fr_1fr_1.5fr_0.7fr] gap-2 px-3 py-2">
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Sev</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Alert</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Source</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Fired</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Ack</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {mergedRows.map((row) => {
          const isSelected = selection?.id === row.alertId;
          const config = SEVERITY_CONFIG[row.severity] ?? SEVERITY_CONFIG.medium;
          return (
            <button
              key={row.alertId}
              onClick={() => handleClick(row)}
              className={`flex w-full text-left border-b border-[#1F2833]/20 transition-colors ${isSelected ? "bg-[#1F2833]/50" : "hover:bg-[#1F2833]/20"}`}
            >
              <div className={`w-1 shrink-0 ${isSelected ? config.heat : config.heat + "/30"}`} />
              <div className="flex-1 grid grid-cols-[0.3fr_2.5fr_1fr_1.5fr_0.7fr] gap-2 px-3 py-2.5 items-center">
                <div className="flex items-center">
                  <div className={`h-2 w-2 rounded-full ${config.dot}`} />
                </div>
                <div className="min-w-0">
                  <div className={`text-[11px] font-mono truncate ${config.color}`}>{row.title}</div>
                  <div className="text-[9px] font-mono text-[#C5C6C7]/25 truncate">{formatHash(row.alertId)}</div>
                </div>
                <span className="text-[10px] font-mono text-[#C5C6C7]/50">{row.source}</span>
                <span className="text-[10px] font-mono text-[#C5C6C7]/40">{formatTimestamp(new Date(row.firedAt))}</span>
                <span className={`text-[10px] font-mono ${row.acknowledged ? "text-[#66FCF1]/50" : "text-[#E94560]/60"}`}>
                  {row.acknowledged ? "ACK" : "OPEN"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

