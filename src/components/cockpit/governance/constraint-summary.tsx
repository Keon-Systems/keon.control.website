"use client";

/**
 * Constraint Summary — Active governance constraints.
 * Shows what laws are currently binding reality.
 * Proximity indicator shows how close to breach.
 */

import type { GovernanceConstraint } from "@/lib/cockpit/types";

interface ConstraintSummaryProps {
  constraints: GovernanceConstraint[];
}

function proximityColor(proximity: number | null): string {
  if (proximity === null) return "text-[#C5C6C7]/30";
  if (proximity >= 0.9) return "text-[#E94560]";
  if (proximity >= 0.7) return "text-amber-400";
  return "text-[#45A29E]";
}

function proximityBar(proximity: number | null): string {
  if (proximity === null) return "bg-[#C5C6C7]/10";
  if (proximity >= 0.9) return "bg-[#E94560]";
  if (proximity >= 0.7) return "bg-amber-400";
  return "bg-[#45A29E]";
}

export function ConstraintSummary({ constraints }: ConstraintSummaryProps) {
  if (constraints.length === 0) {
    return (
      <div className="border-b border-[#1F2833]/20 px-3 py-2.5">
        <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#C5C6C7]/40 mb-1.5">
          Constraints
        </div>
        <div className="text-[10px] font-mono text-[#C5C6C7]/25">No active constraints</div>
      </div>
    );
  }

  return (
    <div className="border-b border-[#1F2833]/20 px-3 py-2.5">
      <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#C5C6C7]/40 mb-2">
        Constraints ({constraints.length})
      </div>
      <div className="space-y-2">
        {constraints.map((c) => (
          <div key={c.id}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-mono text-[#C5C6C7]/60 truncate flex-1 mr-2">
                {c.name}
              </span>
              {c.proximity !== null && (
                <span className={`text-[9px] font-mono tabular-nums ${proximityColor(c.proximity)}`}>
                  {Math.round(c.proximity * 100)}%
                </span>
              )}
            </div>
            {/* Proximity bar */}
            <div className="h-0.5 w-full bg-[#1F2833]/30 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${proximityBar(c.proximity)}`}
                style={{ width: `${(c.proximity ?? 0) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

