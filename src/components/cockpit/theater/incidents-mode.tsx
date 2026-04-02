"use client";

/**
 * Incidents Mode — Sovereign operational events.
 * Severity escalation, timeline, status tracking.
 *
 * Data: Real via incidents.adapter with mock fallback.
 */

import type { IncidentRow } from "@/lib/cockpit/adapters/incidents.adapter";
import { fetchIncidents } from "@/lib/cockpit/adapters/incidents.adapter";
import type { Selection } from "@/lib/cockpit/types";
import { useFocusSelection, useSelectionActions } from "@/lib/cockpit/use-focus";
import { formatHash, formatTimestamp } from "@/lib/format";
import { useCallback, useEffect, useState } from "react";

const SEV_CONFIG: Record<string, { label: string; color: string; heat: string }> = {
  sev1: { label: "SEV1", color: "text-[#E94560]", heat: "bg-[#E94560]" },
  sev2: { label: "SEV2", color: "text-orange-400", heat: "bg-orange-400" },
  sev3: { label: "SEV3", color: "text-amber-400", heat: "bg-amber-400" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active:      { label: "ACTIVE",      color: "text-[#E94560]" },
  mitigated:   { label: "MITIGATED",   color: "text-amber-400" },
  resolved:    { label: "RESOLVED",    color: "text-[#66FCF1]" },
  "post-mortem": { label: "POST-MORTEM", color: "text-[#C5C6C7]/50" },
};

export function IncidentsMode() {
  const { selection } = useFocusSelection();
  const { select } = useSelectionActions();
  const [rows, setRows] = useState<IncidentRow[]>([]);

  const loadData = useCallback(async () => {
    const result = await fetchIncidents();
    setRows(result.rows);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClick = (row: IncidentRow) => {
    const sel: Selection = {
      kind: "incident",
      id: row.incidentId,
      correlationId: null,
      source: "center",
      anchorType: "anchored",
    };
    select(sel);
  };

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="flex shrink-0 border-b border-[#1F2833]/40 bg-[#0B0C10]">
        <div className="w-1 shrink-0" />
        <div className="flex-1 grid grid-cols-[0.5fr_2.5fr_1fr_1.5fr_1fr] gap-2 px-3 py-2">
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Sev</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Incident</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Status</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Declared</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Commander</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {rows.map((row) => {
          const isSelected = selection?.id === row.incidentId;
          const sev = SEV_CONFIG[row.severity] ?? SEV_CONFIG.sev3;
          const status = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.resolved;
          return (
            <button
              key={row.incidentId}
              onClick={() => handleClick(row)}
              className={`flex w-full text-left border-b border-[#1F2833]/20 transition-colors ${isSelected ? "bg-[#1F2833]/50" : "hover:bg-[#1F2833]/20"}`}
            >
              <div className={`w-1 shrink-0 ${isSelected ? sev.heat : sev.heat + "/30"}`} />
              <div className="flex-1 grid grid-cols-[0.5fr_2.5fr_1fr_1.5fr_1fr] gap-2 px-3 py-2.5 items-center">
                <span className={`text-[10px] font-mono font-bold ${sev.color}`}>{sev.label}</span>
                <div className="min-w-0">
                  <div className="text-[11px] font-mono text-[#C5C6C7]/70 truncate">{row.title}</div>
                  <div className="text-[9px] font-mono text-[#C5C6C7]/25">
                    {formatHash(row.incidentId)} · {row.affectedSystems.join(", ")}
                  </div>
                </div>
                <span className={`text-[10px] font-mono font-bold ${status.color}`}>{status.label}</span>
                <span className="text-[10px] font-mono text-[#C5C6C7]/40">{formatTimestamp(new Date(row.declaredAt))}</span>
                <span className="text-[10px] font-mono text-[#C5C6C7]/50">{row.commander}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

