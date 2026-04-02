"use client";

/**
 * Executions Mode — The doctrinal center of the cockpit.
 *
 * Renders governed executions as selectable rows.
 * Each row emits SELECT with computed anchorType.
 * Heat overlay from day one.
 * No route change on click.
 *
 * Data: Real via executions.adapter with mock fallback.
 */

import { computeExecutionAnchorType, fetchExecutions, type ExecutionRow } from "@/lib/cockpit/adapters/executions.adapter";
import type { Selection } from "@/lib/cockpit/types";
import { useFocusSelection, useSelectionActions } from "@/lib/cockpit/use-focus";
import { formatDuration, formatHash } from "@/lib/format";
import { useCallback, useEffect, useState } from "react";

// ============================================================
// STATUS → VISUAL MAPPING
// ============================================================

const STATUS_CONFIG: Record<string, { label: string; color: string; heatColor: string }> = {
  completed: { label: "COMPLETED", color: "text-[#66FCF1]", heatColor: "bg-[#66FCF1]" },
  failed:    { label: "FAILED",    color: "text-[#E94560]", heatColor: "bg-[#E94560]" },
  running:   { label: "RUNNING",   color: "text-amber-400", heatColor: "bg-amber-400" },
  denied:    { label: "DENIED",    color: "text-[#E94560]", heatColor: "bg-[#E94560]" },
};

export function ExecutionsMode() {
  const { selection } = useFocusSelection();
  const { select } = useSelectionActions();
  const [rows, setRows] = useState<ExecutionRow[]>([]);
  const [dataSource, setDataSource] = useState<"live" | "mock">("mock");

  const loadData = useCallback(async () => {
    const result = await fetchExecutions();
    setRows(result.rows);
    setDataSource(result.source);
  }, []);

  // Initial load + periodic refresh (15s)
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15_000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleRowClick = (row: ExecutionRow) => {
    const sel: Selection = {
      kind: "execution",
      id: row.executionId,
      correlationId: row.receiptId || null,
      source: "center",
      anchorType: computeExecutionAnchorType(row.status),
    };
    select(sel);
  };

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Column headers */}
      <div className="flex shrink-0 border-b border-[#1F2833]/40 bg-[#0B0C10]">
        <div className="w-1 shrink-0" /> {/* Heat bar column */}
        <div className="flex-1 grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_0.5fr] gap-2 px-3 py-2">
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Execution ID</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Status</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Actor</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Action</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Duration</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Traces</span>
        </div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {rows.map((row) => {
          const isSelected = selection?.id === row.executionId;
          const config = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.completed;

          return (
            <button
              key={row.executionId}
              onClick={() => handleRowClick(row)}
              className={`flex w-full text-left border-b border-[#1F2833]/20 transition-colors ${
                isSelected
                  ? "bg-[#1F2833]/50"
                  : "hover:bg-[#1F2833]/20"
              }`}
            >
              {/* Heat bar — left edge color */}
              <div className={`w-1 shrink-0 ${isSelected ? config.heatColor : config.heatColor + "/30"}`} />

              {/* Row content */}
              <div className="flex-1 grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_0.5fr] gap-2 px-3 py-2.5 items-center">
                <span className="text-[11px] font-mono text-[#C5C6C7]/70 truncate">
                  {formatHash(row.executionId)}
                </span>
                <span className={`text-[10px] font-mono font-bold ${config.color}`}>
                  {config.label}
                </span>
                <span className="text-[11px] font-mono text-[#C5C6C7]/50 truncate">
                  {row.actor}
                </span>
                <span className="text-[11px] font-mono text-[#66FCF1]/70 truncate">
                  {row.action}
                </span>
                <span className="text-[10px] font-mono text-[#C5C6C7]/40 tabular-nums">
                  {row.status === "running" ? "in-flight" : formatDuration(row.duration)}
                </span>
                <span className="text-[10px] font-mono text-[#C5C6C7]/40 tabular-nums">
                  {row.traceCount}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

