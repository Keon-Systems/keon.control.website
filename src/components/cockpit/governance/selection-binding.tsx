"use client";

/**
 * Selection Governance Binding — What governed this specific entity.
 *
 * Shows:
 *   - Which policy governed it
 *   - Which authority signed it
 *   - What oversight mode was active at creation
 *   - Whether this would still be allowed today
 *
 * Only renders when a selection is active.
 * Layers BELOW global governance — never replaces it.
 */

import { useFocusSelection } from "@/lib/cockpit/use-focus";
import { useGovernance } from "@/lib/cockpit/use-governance";
import { useSelectionGovernance } from "@/lib/cockpit/use-selection-governance";
import { formatHash } from "@/lib/format";

export function SelectionBinding() {
  const { selection, isSelectionActive } = useFocusSelection();
  const selGov = useSelectionGovernance();
  const { posture } = useGovernance();

  if (!isSelectionActive || !selection || !selGov) return null;

  // Would this still be allowed today?
  const modeMatch = selGov.oversightModeAtCreation === posture.oversightMode;
  const policyMatch = !selGov.governingPolicy ||
    selGov.governingPolicy.version === posture.activePolicyProfile;
  const stillAllowed = modeMatch && policyMatch;

  return (
    <div className="border-b border-[#66FCF1]/10 bg-[#66FCF1]/[0.02] px-3 py-2.5">
      <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#66FCF1]/40 mb-2">
        Selection Governance
      </div>

      <div className="space-y-1.5">
        {/* Governing Policy */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#C5C6C7]/50">Policy</span>
          {selGov.governingPolicy ? (
            <span className="text-[10px] font-mono text-[#45A29E]">
              v{selGov.governingPolicy.version}
              <span className="text-[#C5C6C7]/25 ml-1">
                {formatHash(selGov.governingPolicy.hash)}
              </span>
            </span>
          ) : (
            <span className="text-[10px] font-mono text-[#C5C6C7]/25">
              {selection.anchorType === "ephemeral" ? "in-flight" : "none"}
            </span>
          )}
        </div>

        {/* Governing Authority */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#C5C6C7]/50">Authority</span>
          <span className="text-[10px] font-mono text-[#C5C6C7]/60">
            {selGov.governingAuthority ?? "—"}
          </span>
        </div>

        {/* Oversight Mode at Creation */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#C5C6C7]/50">Mode at creation</span>
          <span className={`text-[10px] font-mono ${
            selGov.oversightModeAtCreation
              ? modeMatch ? "text-[#45A29E]" : "text-amber-400"
              : "text-[#C5C6C7]/25"
          }`}>
            {selGov.oversightModeAtCreation ?? "—"}
          </span>
        </div>

        {/* Still Allowed Today */}
        <div className="flex items-center justify-between pt-1 mt-1 border-t border-[#1F2833]/15">
          <span className="text-[10px] font-mono text-[#C5C6C7]/50">Allowed today?</span>
          <span className={`text-[10px] font-mono font-bold ${
            stillAllowed ? "text-[#66FCF1]" : "text-amber-400"
          }`}>
            {selection.anchorType === "ephemeral"
              ? "pending"
              : stillAllowed ? "yes" : "policy changed"}
          </span>
        </div>
      </div>
    </div>
  );
}

