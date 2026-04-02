"use client";

/**
 * Depth Drawer — Tier 3 (Verify)
 *
 * Bottom section of center theater. max-h-[40vh]. Collapsible.
 * Appears at inspectionDepth === "verify".
 *
 * Courtroom-style verification surface:
 *   - Entity identity + anchor proof
 *   - Receipt chain (if anchored)
 *   - Governance context at time of execution
 *   - Stage timeline placeholder
 */

import { useFocusDepth, useFocusSelection } from "@/lib/cockpit/use-focus";
import { useSelectionGovernance } from "@/lib/cockpit/use-selection-governance";
import { formatHash } from "@/lib/format";

export function DepthDrawer() {
  const { selection } = useFocusSelection();
  const { inspectionDepth, canForensic } = useFocusDepth();
  const selectionGov = useSelectionGovernance();

  if (!selection) return null;

  return (
    <div className="flex max-h-[40vh] shrink-0 flex-col border-t border-[#66FCF1]/20 bg-[#0B0C10]/98">
      {/* Drawer Header */}
      <div className="flex h-7 shrink-0 items-center justify-between border-b border-[#1F2833]/30 px-3">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#66FCF1]/60">
            Verify
          </span>
          <span className="text-[10px] font-mono text-[#C5C6C7]/50">
            {selection.kind}:{formatHash(selection.id)}
          </span>
          <span className={`text-[9px] font-mono px-1 rounded ${
            selection.anchorType === "anchored" ? "text-[#66FCF1] bg-[#66FCF1]/10" :
            selection.anchorType === "ephemeral" ? "text-amber-400 bg-amber-400/10" :
            "text-[#C5C6C7]/50 bg-[#C5C6C7]/5"
          }`}>
            {selection.anchorType}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {canForensic && (
            <span className="text-[9px] font-mono text-[#C5C6C7]/30">
              f → forensic
            </span>
          )}
          <span className="text-[9px] font-mono text-[#C5C6C7]/30">
            v → close
          </span>
        </div>
      </div>

      {/* Drawer Content — Three-column verification */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-3 gap-px bg-[#1F2833]/20 min-h-[120px]">
          {/* Column 1: Identity + Anchor Proof */}
          <div className="bg-[#0B0C10] p-3 space-y-2">
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#45A29E]/60 mb-2">
              Identity
            </div>
            <div className="space-y-1.5 text-[10px] font-mono">
              <div className="text-[#C5C6C7]/40">Kind: <span className="text-[#C5C6C7]/70">{selection.kind}</span></div>
              <div className="text-[#C5C6C7]/40">ID: <span className="text-[#66FCF1]/80">{formatHash(selection.id)}</span></div>
              {selection.correlationId && (
                <div className="text-[#C5C6C7]/40">Corr: <span className="text-[#45A29E]/70">{formatHash(selection.correlationId)}</span></div>
              )}
              <div className="text-[#C5C6C7]/40">Source: <span className="text-[#C5C6C7]/50">{selection.source}</span></div>
            </div>
          </div>

          {/* Column 2: Receipt Chain */}
          <div className="bg-[#0B0C10] p-3 space-y-2">
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#45A29E]/60 mb-2">
              Receipt Chain
            </div>
            {selection.anchorType === "anchored" ? (
              <div className="space-y-1.5 text-[10px] font-mono">
                <div className="text-[#66FCF1]/60">Decision Receipt: <span className="text-[#66FCF1]/40">pending…</span></div>
                <div className="text-[#66FCF1]/60">Outcome Receipt: <span className="text-[#66FCF1]/40">pending…</span></div>
                <div className="text-[#66FCF1]/60">Evidence Pack: <span className="text-[#66FCF1]/40">pending…</span></div>
                <div className="text-[#C5C6C7]/30 mt-2 pt-2 border-t border-[#1F2833]/20">
                  Phase 4: Live receipt data
                </div>
              </div>
            ) : (
              <div className="text-[10px] font-mono text-[#C5C6C7]/30">
                {selection.anchorType === "ephemeral"
                  ? "In-flight — no receipts yet"
                  : "Derived entity — no direct receipts"}
              </div>
            )}
          </div>

          {/* Column 3: Governance Context */}
          <div className="bg-[#0B0C10] p-3 space-y-2">
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#45A29E]/60 mb-2">
              Governance Context
            </div>
            <div className="space-y-1.5 text-[10px] font-mono">
              {selectionGov?.governingPolicy ? (
                <div className="text-[#C5C6C7]/50">
                  Policy: <span className="text-[#45A29E]">{selectionGov.governingPolicy.policyId}</span>
                </div>
              ) : (
                <div className="text-[#C5C6C7]/30">Policy: awaiting data…</div>
              )}
              {selectionGov?.oversightModeAtCreation ? (
                <div className="text-[#C5C6C7]/50">
                  Oversight: <span className="text-[#45A29E]">{selectionGov.oversightModeAtCreation}</span>
                </div>
              ) : (
                <div className="text-[#C5C6C7]/30">Oversight: awaiting data…</div>
              )}
              {selectionGov?.drift && selectionGov.drift.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[#E94560]/20">
                  <div className="text-[9px] text-[#E94560]/60 uppercase">
                    {selectionGov.drift.length} drift signal(s)
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

