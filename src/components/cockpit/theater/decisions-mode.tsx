"use client";

/**
 * Governance Decisions Mode — Why things were allowed or denied.
 * Policy ref, outcome, rationale summary.
 */

import { useFocusSelection, useSelectionActions } from "@/lib/cockpit/use-focus";
import { formatHash, formatTimestamp } from "@/lib/format";
import type { Selection } from "@/lib/cockpit/types";

interface DecisionRow {
  decisionId: string;
  outcome: "permit" | "deny" | "escalate" | "defer";
  action: string;
  actor: string;
  policyRef: string;
  rationale: string;
  decidedAt: string;
}

const MOCK_DECISIONS: DecisionRow[] = [
  { decisionId: "dec_001", outcome: "permit", action: "data.export", actor: "agent-gpt4", policyRef: "pol:data-access:v2.3.1", rationale: "Within budget, actor authorized, no constraint breached", decidedAt: "2026-03-23T14:00:00.000Z" },
  { decisionId: "dec_002", outcome: "deny", action: "budget.approve", actor: "agent-claude", policyRef: "pol:budget:v1.0.0", rationale: "Amount exceeds agent authority threshold ($50k)", decidedAt: "2026-03-23T13:30:00.000Z" },
  { decisionId: "dec_003", outcome: "permit", action: "policy.evaluate", actor: "agent-gemini", policyRef: "pol:meta-governance:v2.3.0", rationale: "Read-only evaluation, no side effects", decidedAt: "2026-03-23T12:00:00.000Z" },
  { decisionId: "dec_004", outcome: "escalate", action: "admin.override", actor: "agent-gpt4", policyRef: "pol:admin:v1.2.0", rationale: "Override requires human approval under supervised mode", decidedAt: "2026-03-23T11:00:00.000Z" },
  { decisionId: "dec_005", outcome: "defer", action: "incident.declare", actor: "agent-claude", policyRef: "pol:incident:v1.0.0", rationale: "Incident declaration requires incident commander confirmation", decidedAt: "2026-03-23T10:30:00.000Z" },
];

const OUTCOME_CONFIG: Record<string, { label: string; color: string; heat: string }> = {
  permit:   { label: "PERMIT",   color: "text-[#66FCF1]", heat: "bg-[#66FCF1]" },
  deny:     { label: "DENY",     color: "text-[#E94560]", heat: "bg-[#E94560]" },
  escalate: { label: "ESCALATE", color: "text-amber-400", heat: "bg-amber-400" },
  defer:    { label: "DEFER",    color: "text-[#C5C6C7]/50", heat: "bg-[#C5C6C7]" },
};

export function DecisionsMode() {
  const { selection } = useFocusSelection();
  const { select } = useSelectionActions();

  const handleClick = (row: DecisionRow) => {
    const sel: Selection = {
      kind: "decision",
      id: row.decisionId,
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
        <div className="flex-1 grid grid-cols-[0.7fr_1.5fr_1fr_2fr] gap-2 px-3 py-2">
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Outcome</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Action</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Policy</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Rationale</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {MOCK_DECISIONS.map((row) => {
          const isSelected = selection?.id === row.decisionId;
          const config = OUTCOME_CONFIG[row.outcome] ?? OUTCOME_CONFIG.permit;
          return (
            <button
              key={row.decisionId}
              onClick={() => handleClick(row)}
              className={`flex w-full text-left border-b border-[#1F2833]/20 transition-colors ${isSelected ? "bg-[#1F2833]/50" : "hover:bg-[#1F2833]/20"}`}
            >
              <div className={`w-1 shrink-0 ${isSelected ? config.heat : config.heat + "/30"}`} />
              <div className="flex-1 grid grid-cols-[0.7fr_1.5fr_1fr_2fr] gap-2 px-3 py-2.5 items-center">
                <span className={`text-[10px] font-mono font-bold ${config.color}`}>{config.label}</span>
                <div className="min-w-0">
                  <div className="text-[11px] font-mono text-[#66FCF1]/70 truncate">{row.action}</div>
                  <div className="text-[9px] font-mono text-[#C5C6C7]/25">{row.actor} · {formatTimestamp(new Date(row.decidedAt))}</div>
                </div>
                <span className="text-[10px] font-mono text-[#45A29E]/60 truncate">{row.policyRef}</span>
                <span className="text-[10px] font-mono text-[#C5C6C7]/40 truncate">{row.rationale}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

