"use client";

/**
 * Governance Drift — Visceral. Not subtle.
 *
 * When drift exists:
 *   - It stands out
 *   - It's explainable in one glance
 *   - It's clickable to evidence
 *
 * Drift = the governance context that created an entity
 * differs from the governance context that exists now.
 */

import type { GovernanceDrift } from "@/lib/cockpit/types";
import { useSelectionActions } from "@/lib/cockpit/use-focus";
import { useSelectionGovernance } from "@/lib/cockpit/use-selection-governance";

const SEVERITY_CONFIG: Record<string, { border: string; bg: string; text: string; icon: string }> = {
  info:     { border: "border-[#45A29E]/30", bg: "bg-[#45A29E]/5",  text: "text-[#45A29E]",   icon: "ℹ" },
  warning:  { border: "border-amber-400/30", bg: "bg-amber-400/5",  text: "text-amber-400",   icon: "⚠" },
  critical: { border: "border-[#E94560]/30", bg: "bg-[#E94560]/5",  text: "text-[#E94560]",   icon: "✕" },
};

export function GovernanceDriftSection() {
  const selGov = useSelectionGovernance();
  const { select } = useSelectionActions();

  if (!selGov || selGov.drift.length === 0) return null;

  return (
    <div className="border-b border-[#E94560]/20 bg-[#E94560]/[0.03] px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[10px] text-[#E94560] animate-pulse">◆</span>
        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#E94560]/70 font-bold">
          Governance Drift ({selGov.drift.length})
        </span>
      </div>

      <div className="space-y-2">
        {selGov.drift.map((d, i) => (
          <DriftSignal key={i} drift={d} onNavigate={select} />
        ))}
      </div>
    </div>
  );
}

function DriftSignal({
  drift,
  onNavigate,
}: {
  drift: GovernanceDrift;
  onNavigate: (selection: Selection) => void;
}) {
  const config = SEVERITY_CONFIG[drift.severity] ?? SEVERITY_CONFIG.info;

  return (
    <div className={`rounded border ${config.border} ${config.bg} px-2.5 py-2`}>
      <div className="flex items-start gap-1.5">
        <span className={`text-[10px] mt-0.5 ${config.text}`}>{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className={`text-[10px] font-mono ${config.text}`}>
            {drift.message}
          </div>
          {drift.ref && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-mono text-[#C5C6C7]/25">
                {drift.ref.atEntityTime} → {drift.ref.current}
              </span>
              {drift.ref.type === "policy" && (
                <button
                  onClick={() =>
                    onNavigate({
                      kind: "policy" as const,
                      id: drift.ref!.id,
                      correlationId: null,
                      source: "left" as const,
                      anchorType: "anchored" as const,
                    })
                  }
                  className="text-[9px] font-mono text-[#45A29E]/60 hover:text-[#45A29E] transition-colors"
                >
                  view policy →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

