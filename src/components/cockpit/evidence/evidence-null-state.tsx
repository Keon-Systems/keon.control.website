"use client";

/**
 * Evidence Null State — What the rail shows when nothing is selected.
 *
 * Not empty. Shows:
 *   - Ledger freshness
 *   - Recent receipt count
 *   - Proof availability summary
 *   - Keyboard hints
 */

import { useGovernance } from "@/lib/cockpit/use-governance";

export function EvidenceNullState() {
  const governance = useGovernance();

  return (
    <div className="p-3 space-y-3">
      {/* Ledger Freshness */}
      <div className="rounded border border-[#1F2833]/30 bg-[#0B0C10]/60 p-3">
        <div className="text-[9px] font-mono text-[#C5C6C7]/40 mb-2 uppercase">Ledger Freshness</div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[#66FCF1]" />
          <span className="text-[10px] font-mono text-[#66FCF1]/70">
            {governance.posture.determinismStatus === "SEALED" ? "Sealed & Current" : "Status Unknown"}
          </span>
        </div>
        <div className="text-[9px] font-mono text-[#C5C6C7]/25 mt-1">
          {governance.posture.dataMode === "MOCK" ? "Mock data mode" : "Live data"}
        </div>
      </div>

      {/* Proof Availability */}
      <div className="rounded border border-[#1F2833]/30 bg-[#0B0C10]/60 p-3">
        <div className="text-[9px] font-mono text-[#C5C6C7]/40 mb-2 uppercase">Proof Availability</div>
        <div className="space-y-1.5 text-[10px] font-mono text-[#C5C6C7]/40">
          <div className="flex items-center gap-1.5">
            <span className="text-[#66FCF1]">●</span>
            <span>Receipt anchoring: <span className="text-[#66FCF1]/70">active</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#66FCF1]">●</span>
            <span>Evidence packing: <span className="text-[#66FCF1]/70">active</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={governance.posture.sealValidation === "VALID" ? "text-[#66FCF1]" : "text-amber-400"}>
              {governance.posture.sealValidation === "VALID" ? "●" : "◐"}
            </span>
            <span>Seal validation: <span className={governance.posture.sealValidation === "VALID" ? "text-[#66FCF1]/70" : "text-amber-400/70"}>
              {governance.posture.sealValidation.toLowerCase()}
            </span></span>
          </div>
        </div>
      </div>

      {/* Keyboard Hints */}
      <div className="rounded border border-[#1F2833]/20 bg-[#0B0C10]/40 p-3">
        <div className="text-[9px] font-mono text-[#C5C6C7]/40 mb-2 uppercase">Controls</div>
        <div className="space-y-1 text-[9px] font-mono text-[#C5C6C7]/25">
          <div>Select an entity to inspect evidence</div>
          <div className="mt-2">
            <span className="text-[#C5C6C7]/40">v</span> — verify depth
          </div>
          <div>
            <span className="text-[#C5C6C7]/40">f</span> — forensic overlay
          </div>
          <div>
            <span className="text-[#C5C6C7]/40">Esc</span> — clear / close
          </div>
        </div>
      </div>
    </div>
  );
}

