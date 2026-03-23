"use client";

/**
 * Escalation Conditions — What would trigger an escalation.
 * Shows the thresholds that, if breached, change the system's posture.
 */

import type { EscalationCondition } from "@/lib/cockpit/types";

interface EscalationConditionsProps {
  conditions: EscalationCondition[];
}

export function EscalationConditions({ conditions }: EscalationConditionsProps) {
  if (conditions.length === 0) {
    return (
      <div className="border-b border-[#1F2833]/20 px-3 py-2.5">
        <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#C5C6C7]/40 mb-1.5">
          Escalation Conditions
        </div>
        <div className="text-[10px] font-mono text-[#C5C6C7]/25">No escalation conditions</div>
      </div>
    );
  }

  return (
    <div className="border-b border-[#1F2833]/20 px-3 py-2.5">
      <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#C5C6C7]/40 mb-2">
        Escalation Conditions ({conditions.length})
      </div>
      <div className="space-y-1.5">
        {conditions.map((c) => (
          <div key={c.id} className="flex items-start gap-1.5">
            <span className={`text-[10px] mt-0.5 ${c.triggered ? "text-[#E94560]" : "text-[#C5C6C7]/25"}`}>
              {c.triggered ? "●" : "○"}
            </span>
            <div className="flex-1 min-w-0">
              <div className={`text-[10px] font-mono ${c.triggered ? "text-[#E94560]/80" : "text-[#C5C6C7]/50"}`}>
                {c.name}
              </div>
              <div className="text-[9px] font-mono text-[#C5C6C7]/25">
                {c.currentValue} / {c.threshold} ({Math.round(c.proximity * 100)}%)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

