"use client";

/**
 * Incident Flag — Only renders when incident mode is active.
 * Visceral. Unmissable.
 */

interface IncidentFlagProps {
  active: boolean;
}

export function IncidentFlag({ active }: IncidentFlagProps) {
  if (!active) return null;

  return (
    <div className="border-b border-[#E94560]/30 bg-[#E94560]/10 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-sm animate-pulse">⚠</span>
        <span className="text-[11px] font-mono font-bold text-[#E94560] uppercase tracking-wider">
          Incident Active
        </span>
      </div>
      <div className="text-[9px] font-mono text-[#E94560]/50 mt-1">
        Governance posture may be overridden by incident protocol
      </div>
    </div>
  );
}

