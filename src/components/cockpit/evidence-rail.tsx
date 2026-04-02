"use client";

/**
 * Evidence Rail — Zone 4 (Right)
 *
 * w-80. Scrollable. Reactive evidence surface.
 * Shows proof for whatever is selected.
 *
 * Composition:
 *   - No selection: EvidenceNullState
 *   - Selection invalid: InvalidationBanner
 *   - Selection active: TrustSummary + EvidenceContent
 *
 * Epoch-guarded via useEvidenceData.
 */

import { useFocusSelection } from "@/lib/cockpit/use-focus";
import { EvidenceContent, EvidenceNullState, TrustSummary, useEvidenceData } from "./evidence";

export function EvidenceRail() {
  const { selectionEpoch, isSelectionActive, selectionInvalidReason } = useFocusSelection();
  const evidenceData = useEvidenceData();

  return (
    <div className="flex w-80 shrink-0 flex-col border-l border-[#1F2833]/60 bg-[#0B0C10]/95 overflow-hidden">
      {/* Zone Label */}
      <div className="flex h-8 shrink-0 items-center border-b border-[#1F2833]/40 px-3">
        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#45A29E]/60">
          Evidence Rail
        </span>
        <span className="text-[9px] font-mono text-[#C5C6C7]/30 ml-auto">
          epoch:{selectionEpoch}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Selection Invalid Reason */}
        {selectionInvalidReason && (
          <div className="mx-3 mt-2 rounded border border-[#E94560]/30 bg-[#E94560]/5 px-3 py-2">
            <div className="text-[9px] font-mono text-[#E94560]/80 uppercase">Selection Invalid</div>
            <div className="text-[10px] font-mono text-[#E94560]/60 mt-1">
              {selectionInvalidReason === "not-found" && "Entity not found in current context"}
              {selectionInvalidReason === "out-of-time-context" && "Entity does not exist at selected time"}
              {selectionInvalidReason === "access-denied" && "Access denied for this entity"}
            </div>
          </div>
        )}

        {/* Null State */}
        {!isSelectionActive && !selectionInvalidReason && <EvidenceNullState />}

        {/* Selection Active — Trust + Evidence */}
        {isSelectionActive && evidenceData && (
          <div className="p-3 space-y-3">
            <TrustSummary trust={evidenceData.trust} isLoading={evidenceData.isLoading} />
            <EvidenceContent data={evidenceData} />
          </div>
        )}
      </div>
    </div>
  );
}

