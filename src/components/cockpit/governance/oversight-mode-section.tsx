"use client";

/**
 * Oversight Mode — Dominant section. Top of rail.
 * Shows the current constitutional operating mode.
 * Not informational. Authoritative.
 */

import type { OversightMode } from "@/lib/cockpit/types";

const MODE_CONFIG: Record<OversightMode, { color: string; bgColor: string; borderColor: string; description: string }> = {
  autonomous:  { color: "text-[#66FCF1]",   bgColor: "bg-[#66FCF1]/5",  borderColor: "border-[#66FCF1]/30", description: "System operates within policy bounds without human intervention" },
  supervised:  { color: "text-[#45A29E]",   bgColor: "bg-[#45A29E]/5",  borderColor: "border-[#45A29E]/30", description: "Human oversight active on escalation-eligible actions" },
  restricted:  { color: "text-amber-400",   bgColor: "bg-amber-400/5",  borderColor: "border-amber-400/30", description: "Only acknowledge-alert and declare-incident permitted" },
  locked:      { color: "text-[#E94560]",   bgColor: "bg-[#E94560]/5",  borderColor: "border-[#E94560]/30", description: "All autonomous actions suspended" },
};

interface OversightModeSectionProps {
  mode: OversightMode;
}

export function OversightModeSection({ mode }: OversightModeSectionProps) {
  const config = MODE_CONFIG[mode];

  return (
    <div className={`border-b ${config.borderColor} ${config.bgColor} px-3 py-3`}>
      <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#C5C6C7]/40 mb-1.5">
        Oversight Mode
      </div>
      <div className={`text-sm font-mono font-bold uppercase tracking-wider ${config.color}`}>
        {mode}
      </div>
      <div className="text-[9px] font-mono text-[#C5C6C7]/30 mt-1 leading-relaxed">
        {config.description}
      </div>
    </div>
  );
}

