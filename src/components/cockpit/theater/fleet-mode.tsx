"use client";

/**
 * Fleet Mode — Agent fleet overview.
 * Status, last action, health, authority level.
 */

import { useFocusSelection, useSelectionActions } from "@/lib/cockpit/use-focus";
import { formatTimestamp } from "@/lib/format";
import type { Selection } from "@/lib/cockpit/types";

interface AgentRow {
  agentId: string;
  name: string;
  status: "active" | "idle" | "degraded" | "offline";
  lastAction: string;
  lastActiveAt: string;
  authorityLevel: string;
  executionCount: number;
}

const MOCK_AGENTS: AgentRow[] = [
  { agentId: "agent-gpt4", name: "GPT-4 Agent", status: "active", lastAction: "data.export", lastActiveAt: "2026-03-23T14:55:00.000Z", authorityLevel: "standard", executionCount: 142 },
  { agentId: "agent-claude", name: "Claude Agent", status: "active", lastAction: "report.generate", lastActiveAt: "2026-03-23T14:50:00.000Z", authorityLevel: "standard", executionCount: 98 },
  { agentId: "agent-gemini", name: "Gemini Agent", status: "idle", lastAction: "policy.evaluate", lastActiveAt: "2026-03-23T12:00:00.000Z", authorityLevel: "elevated", executionCount: 76 },
  { agentId: "agent-grok", name: "Grok Agent", status: "degraded", lastAction: "test.execute", lastActiveAt: "2026-03-23T11:30:00.000Z", authorityLevel: "standard", executionCount: 34 },
  { agentId: "agent-local", name: "Local Runner", status: "offline", lastAction: "build.deploy", lastActiveAt: "2026-03-22T18:00:00.000Z", authorityLevel: "restricted", executionCount: 12 },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; heat: string; dot: string }> = {
  active:   { label: "ACTIVE",   color: "text-[#66FCF1]", heat: "bg-[#66FCF1]", dot: "bg-[#66FCF1]" },
  idle:     { label: "IDLE",     color: "text-[#C5C6C7]/50", heat: "bg-[#C5C6C7]", dot: "bg-[#C5C6C7]/40" },
  degraded: { label: "DEGRADED", color: "text-amber-400", heat: "bg-amber-400", dot: "bg-amber-400 animate-pulse" },
  offline:  { label: "OFFLINE",  color: "text-[#C5C6C7]/30", heat: "bg-[#C5C6C7]", dot: "bg-[#C5C6C7]/20" },
};

export function FleetMode() {
  const { selection } = useFocusSelection();
  const { select } = useSelectionActions();

  const handleClick = (row: AgentRow) => {
    const sel: Selection = {
      kind: "agent",
      id: row.agentId,
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
        <div className="flex-1 grid grid-cols-[2fr_0.7fr_1.5fr_1.5fr_0.5fr] gap-2 px-3 py-2">
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Agent</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Status</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Last Action</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Last Active</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Runs</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {MOCK_AGENTS.map((row) => {
          const isSelected = selection?.id === row.agentId;
          const config = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.idle;
          return (
            <button
              key={row.agentId}
              onClick={() => handleClick(row)}
              className={`flex w-full text-left border-b border-[#1F2833]/20 transition-colors ${isSelected ? "bg-[#1F2833]/50" : "hover:bg-[#1F2833]/20"}`}
            >
              <div className={`w-1 shrink-0 ${isSelected ? config.heat : config.heat + "/30"}`} />
              <div className="flex-1 grid grid-cols-[2fr_0.7fr_1.5fr_1.5fr_0.5fr] gap-2 px-3 py-2.5 items-center">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${config.dot}`} />
                  <div className="min-w-0">
                    <div className="text-[11px] font-mono text-[#C5C6C7]/70 truncate">{row.name}</div>
                    <div className="text-[9px] font-mono text-[#C5C6C7]/25">{row.agentId} · {row.authorityLevel}</div>
                  </div>
                </div>
                <span className={`text-[10px] font-mono font-bold ${config.color}`}>{config.label}</span>
                <span className="text-[10px] font-mono text-[#66FCF1]/60 truncate">{row.lastAction}</span>
                <span className="text-[10px] font-mono text-[#C5C6C7]/40">{formatTimestamp(new Date(row.lastActiveAt))}</span>
                <span className="text-[10px] font-mono text-[#C5C6C7]/40 tabular-nums">{row.executionCount}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

