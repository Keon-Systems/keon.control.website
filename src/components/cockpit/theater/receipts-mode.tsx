"use client";

/**
 * Governance Receipts Mode — Center of gravity for audit.
 * Immutable decision receipts. Hash-chained. Policy-bound.
 */

import { useFocusSelection, useSelectionActions } from "@/lib/cockpit/use-focus";
import { formatHash, formatTimestamp } from "@/lib/format";
import type { Selection } from "@/lib/cockpit/types";

interface ReceiptRow {
  receiptId: string;
  outcome: "approved" | "denied" | "escalated";
  actor: string;
  action: string;
  decidedAt: string;
  policyVersion: string;
  prevReceiptHash: string | null;
}

const MOCK_RECEIPTS: ReceiptRow[] = [
  { receiptId: "rcpt_01923e6a46a977f29cba9c9f2f8a8f7c", outcome: "approved", actor: "agent-gpt4", action: "data.export", decidedAt: "2026-03-23T14:00:00.000Z", policyVersion: "v2.3.1", prevReceiptHash: null },
  { receiptId: "rcpt_01923e5b2c8a77f29cba9c9f2f8a8f7d", outcome: "denied", actor: "agent-claude", action: "budget.approve", decidedAt: "2026-03-23T13:30:00.000Z", policyVersion: "v2.3.1", prevReceiptHash: "sha256:a1b2c3" },
  { receiptId: "rcpt_01923e4d1b7a77f29cba9c9f2f8a8f7e", outcome: "approved", actor: "agent-gemini", action: "policy.evaluate", decidedAt: "2026-03-23T12:00:00.000Z", policyVersion: "v2.3.0", prevReceiptHash: "sha256:d4e5f6" },
  { receiptId: "rcpt_01923e3c0a6977f29cba9c9f2f8a8f7f", outcome: "escalated", actor: "agent-gpt4", action: "admin.override", decidedAt: "2026-03-23T11:00:00.000Z", policyVersion: "v2.3.1", prevReceiptHash: "sha256:g7h8i9" },
  { receiptId: "rcpt_01923e2b1b5a77f29cba9c9f2f8a8f80", outcome: "approved", actor: "agent-claude", action: "report.generate", decidedAt: "2026-03-23T10:30:00.000Z", policyVersion: "v2.3.1", prevReceiptHash: "sha256:j0k1l2" },
];

const OUTCOME_CONFIG: Record<string, { label: string; color: string; heat: string }> = {
  approved:  { label: "APPROVED",  color: "text-[#66FCF1]", heat: "bg-[#66FCF1]" },
  denied:    { label: "DENIED",    color: "text-[#E94560]", heat: "bg-[#E94560]" },
  escalated: { label: "ESCALATED", color: "text-amber-400", heat: "bg-amber-400" },
};

export function ReceiptsMode() {
  const { selection } = useFocusSelection();
  const { select } = useSelectionActions();

  const handleClick = (row: ReceiptRow) => {
    const sel: Selection = {
      kind: "receipt",
      id: row.receiptId,
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
        <div className="flex-1 grid grid-cols-[2fr_1fr_1fr_1.5fr_1.5fr_1fr] gap-2 px-3 py-2">
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Receipt ID</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Outcome</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Actor</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Action</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Decided</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Policy</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {MOCK_RECEIPTS.map((row) => {
          const isSelected = selection?.id === row.receiptId;
          const config = OUTCOME_CONFIG[row.outcome] ?? OUTCOME_CONFIG.approved;
          return (
            <button
              key={row.receiptId}
              onClick={() => handleClick(row)}
              className={`flex w-full text-left border-b border-[#1F2833]/20 transition-colors ${isSelected ? "bg-[#1F2833]/50" : "hover:bg-[#1F2833]/20"}`}
            >
              <div className={`w-1 shrink-0 ${isSelected ? config.heat : config.heat + "/30"}`} />
              <div className="flex-1 grid grid-cols-[2fr_1fr_1fr_1.5fr_1.5fr_1fr] gap-2 px-3 py-2.5 items-center">
                <span className="text-[11px] font-mono text-[#C5C6C7]/70 truncate">
                  {formatHash(row.receiptId)}
                  {row.prevReceiptHash && <span className="text-[#C5C6C7]/25 ml-1">← {formatHash(row.prevReceiptHash)}</span>}
                </span>
                <span className={`text-[10px] font-mono font-bold ${config.color}`}>{config.label}</span>
                <span className="text-[11px] font-mono text-[#C5C6C7]/50 truncate">{row.actor}</span>
                <span className="text-[11px] font-mono text-[#66FCF1]/70 truncate">{row.action}</span>
                <span className="text-[10px] font-mono text-[#C5C6C7]/40">{formatTimestamp(new Date(row.decidedAt))}</span>
                <span className="text-[10px] font-mono text-[#45A29E]/60">{row.policyVersion}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

