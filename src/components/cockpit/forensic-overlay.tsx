"use client";

/**
 * Forensic Overlay — Tier 3 (Depth 4)
 *
 * Full-screen takeover. z-50. Dismissible with Escape.
 * Appears at inspectionDepth === "forensic".
 * Only available for anchored entities.
 *
 * Phase 1: Debug state readout only.
 */

import { useFocusSelection, useFocusDepth } from "@/lib/cockpit/use-focus";

export function ForensicOverlay() {
  const { selection } = useFocusSelection();
  const { inspectionDepth } = useFocusDepth();

  if (!selection) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0B0C10]/98 backdrop-blur-sm">
      {/* Overlay Header */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#E94560]/20 px-6">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[#E94560] animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E94560]">
            Forensic Investigation
          </span>
          <span className="text-[10px] font-mono text-[#C5C6C7]/40">
            {selection.kind}:{selection.id}
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#C5C6C7]/30">
          press Esc to exit forensic mode
        </span>
      </div>

      {/* Overlay Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded border border-[#E94560]/20 bg-[#0B0C10]/80 p-6">
            <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#E94560]/60 mb-4">
              Forensic Reconstruction Surface
            </div>
            <div className="space-y-3 text-[10px] font-mono text-[#C5C6C7]/50">
              <div>Entity: <span className="text-[#66FCF1]">{selection.id}</span></div>
              <div>Kind: <span className="text-[#45A29E]">{selection.kind}</span></div>
              <div>Anchor Type: <span className="text-[#45A29E]">{selection.anchorType}</span></div>
              <div>Depth: <span className="text-[#E94560]">{inspectionDepth}</span></div>
              <div>Correlation: <span className="text-[#C5C6C7]/40">{selection.correlationId ?? "none"}</span></div>

              <div className="mt-6 pt-4 border-t border-[#1F2833]/20 space-y-2 text-[#C5C6C7]/30">
                <div>Phase 6: Causal lineage graph</div>
                <div>Phase 6: Raw payload inspector</div>
                <div>Phase 6: Signature verification chain</div>
                <div>Phase 6: Cross-system linkage</div>
                <div>Phase 6: Reconstructive anchors</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

