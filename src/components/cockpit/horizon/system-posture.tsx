"use client";

/**
 * System Posture — Single-word system state.
 * Resolves to: healthy | degraded | constrained | hot | denied | recovering
 */

import type { SystemPostureLevel } from "./use-horizon-data";

const POSTURE_STYLES: Record<SystemPostureLevel, { color: string; pulse: boolean }> = {
  healthy:     { color: "text-[#66FCF1]", pulse: false },
  degraded:    { color: "text-amber-400", pulse: false },
  constrained: { color: "text-amber-500", pulse: true },
  hot:         { color: "text-orange-400", pulse: true },
  denied:      { color: "text-[#E94560]", pulse: true },
  recovering:  { color: "text-blue-400", pulse: true },
};

interface SystemPostureProps {
  posture: SystemPostureLevel;
}

export function SystemPosture({ posture }: SystemPostureProps) {
  const style = POSTURE_STYLES[posture];

  return (
    <div className="flex items-center gap-1.5 mr-3 shrink-0">
      <div
        className={`h-1.5 w-1.5 rounded-full ${
          posture === "healthy" ? "bg-[#66FCF1]" :
          posture === "denied" ? "bg-[#E94560]" :
          "bg-amber-400"
        } ${style.pulse ? "animate-pulse" : ""}`}
      />
      <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${style.color}`}>
        {posture}
      </span>
    </div>
  );
}

