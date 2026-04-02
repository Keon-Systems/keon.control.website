"use client";

/**
 * Traces Mode — Distributed trace inspection.
 * Span count, duration, error flag, execution correlation.
 */

import { useFocusSelection, useSelectionActions } from "@/lib/cockpit/use-focus";
import { formatDuration, formatHash, formatTimestamp } from "@/lib/format";
import type { Selection } from "@/lib/cockpit/types";

interface TraceRow {
  traceId: string;
  rootSpan: string;
  spanCount: number;
  duration: number;
  hasError: boolean;
  executionId: string | null;
  startedAt: string;
}

const MOCK_TRACES: TraceRow[] = [
  { traceId: "trace_001", rootSpan: "data.export.pipeline", spanCount: 12, duration: 2340, hasError: false, executionId: "exec_01923e6a46a977f29cba9c9f2f8a8f7c", startedAt: "2026-03-23T14:00:00.000Z" },
  { traceId: "trace_002", rootSpan: "budget.approve.flow", spanCount: 5, duration: 890, hasError: true, executionId: "exec_01923e5b2c8a77f29cba9c9f2f8a8f7d", startedAt: "2026-03-23T13:30:00.000Z" },
  { traceId: "trace_003", rootSpan: "policy.evaluate.chain", spanCount: 8, duration: 1560, hasError: false, executionId: "exec_01923e4d1b7a77f29cba9c9f2f8a8f7e", startedAt: "2026-03-23T12:00:00.000Z" },
  { traceId: "trace_004", rootSpan: "report.generate.batch", spanCount: 23, duration: 4200, hasError: false, executionId: null, startedAt: "2026-03-23T11:00:00.000Z" },
  { traceId: "trace_005", rootSpan: "seal.validate.batch", spanCount: 3, duration: 120, hasError: false, executionId: null, startedAt: "2026-03-23T10:00:00.000Z" },
  { traceId: "trace_006", rootSpan: "governance.sync.full", spanCount: 45, duration: 8900, hasError: true, executionId: null, startedAt: "2026-03-23T09:00:00.000Z" },
];

export function TracesMode() {
  const { selection } = useFocusSelection();
  const { select } = useSelectionActions();

  const handleClick = (row: TraceRow) => {
    const sel: Selection = {
      kind: "trace",
      id: row.traceId,
      correlationId: row.executionId,
      source: "center",
      anchorType: row.executionId ? "anchored" : "ephemeral",
    };
    select(sel);
  };

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="flex shrink-0 border-b border-[#1F2833]/40 bg-[#0B0C10]">
        <div className="w-1 shrink-0" />
        <div className="flex-1 grid grid-cols-[2fr_0.5fr_1fr_1.5fr_1fr] gap-2 px-3 py-2">
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Root Span</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Spans</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Duration</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Started</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Execution</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {MOCK_TRACES.map((row) => {
          const isSelected = selection?.id === row.traceId;
          const heatColor = row.hasError ? "bg-[#E94560]" : "bg-[#66FCF1]";
          return (
            <button
              key={row.traceId}
              onClick={() => handleClick(row)}
              className={`flex w-full text-left border-b border-[#1F2833]/20 transition-colors ${isSelected ? "bg-[#1F2833]/50" : "hover:bg-[#1F2833]/20"}`}
            >
              <div className={`w-1 shrink-0 ${isSelected ? heatColor : heatColor + "/30"}`} />
              <div className="flex-1 grid grid-cols-[2fr_0.5fr_1fr_1.5fr_1fr] gap-2 px-3 py-2.5 items-center">
                <div className="min-w-0">
                  <div className={`text-[11px] font-mono truncate ${row.hasError ? "text-[#E94560]/80" : "text-[#C5C6C7]/70"}`}>
                    {row.hasError && <span className="mr-1">✕</span>}
                    {row.rootSpan}
                  </div>
                  <div className="text-[9px] font-mono text-[#C5C6C7]/25">{formatHash(row.traceId)}</div>
                </div>
                <span className="text-[10px] font-mono text-[#C5C6C7]/40 tabular-nums">{row.spanCount}</span>
                <span className="text-[10px] font-mono text-[#C5C6C7]/40 tabular-nums">{formatDuration(row.duration)}</span>
                <span className="text-[10px] font-mono text-[#C5C6C7]/40">{formatTimestamp(new Date(row.startedAt))}</span>
                <span className="text-[10px] font-mono text-[#45A29E]/50 truncate">
                  {row.executionId ? formatHash(row.executionId) : "—"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

