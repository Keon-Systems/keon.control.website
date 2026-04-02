"use client";

/**
 * Governance Posture Badge — Oversight mode + determinism seal.
 * Compact badge showing the constitutional state.
 */

import { useGovernance } from "@/lib/cockpit/use-governance";

const OVERSIGHT_COLORS: Record<string, string> = {
  autonomous: "text-[#66FCF1] border-[#66FCF1]/20",
  supervised: "text-[#45A29E] border-[#45A29E]/20",
  restricted: "text-amber-400 border-amber-400/20",
  locked: "text-[#E94560] border-[#E94560]/20",
};

const SEAL_INDICATORS: Record<string, { label: string; color: string }> = {
  SEALED: { label: "●", color: "text-[#66FCF1]" },
  DEGRADED: { label: "◐", color: "text-amber-400" },
  UNKNOWN: { label: "○", color: "text-[#C5C6C7]/30" },
};

export function GovernancePostureBadge() {
  const { posture } = useGovernance();
  const oversightColor = OVERSIGHT_COLORS[posture.oversightMode] ?? OVERSIGHT_COLORS.supervised;
  const seal = SEAL_INDICATORS[posture.determinismStatus] ?? SEAL_INDICATORS.UNKNOWN;

  return (
    <div className={`flex items-center gap-1.5 rounded border px-1.5 py-0.5 mr-3 shrink-0 ${oversightColor}`}>
      <span className={`text-[9px] ${seal.color}`} title={`Determinism: ${posture.determinismStatus}`}>
        {seal.label}
      </span>
      <span className="text-[9px] font-mono font-bold uppercase tracking-wider">
        {posture.oversightMode}
      </span>
      {posture.incidentFlag && (
        <span className="text-[9px] text-[#E94560] animate-pulse" title="Incident active">
          ⚠
        </span>
      )}
    </div>
  );
}

