"use client";

import { useFocusSelection } from "@/lib/cockpit/use-focus";
import { EvidenceContent, EvidenceNullState, TrustSummary, useEvidenceData } from "./evidence";

export function EvidenceRail() {
  const { selectionEpoch, isSelectionActive, selectionInvalidReason } = useFocusSelection();
  const evidenceData = useEvidenceData();

  return (
    <div className="flex w-80 shrink-0 flex-col overflow-hidden border-l border-[#1F2833]/60 bg-[#0B0C10]/95">
      <div className="flex h-8 shrink-0 items-center border-b border-[#1F2833]/40 px-3">
        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#45A29E]/60">Proof</span>
        <span className="ml-auto text-[9px] font-mono text-[#C5C6C7]/30">epoch:{selectionEpoch}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selectionInvalidReason && (
          <div className="mx-3 mt-2 rounded border border-[#E94560]/30 bg-[#E94560]/5 px-3 py-2">
            <div className="text-[9px] font-mono uppercase text-[#E94560]/80">Selection Invalid</div>
            <div className="mt-1 text-[10px] font-mono text-[#E94560]/60">
              {selectionInvalidReason === "not-found" && "Entity not found in current context"}
              {selectionInvalidReason === "out-of-time-context" && "Entity does not exist at selected time"}
              {selectionInvalidReason === "access-denied" && "Access denied for this entity"}
            </div>
          </div>
        )}

        {!isSelectionActive && !selectionInvalidReason && <EvidenceNullState />}

        {isSelectionActive && evidenceData && (
          <div className="space-y-3 p-3">
            <TrustSummary trust={evidenceData.trust} isLoading={evidenceData.isLoading} />
            <EvidenceContent data={evidenceData} />
          </div>
        )}
      </div>
    </div>
  );
}
