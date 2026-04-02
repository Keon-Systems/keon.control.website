"use client";

/**
 * Active Systems — Compact subsystem health dots.
 * Each dot = one subsystem. Color = status.
 */

import type { SubsystemStatus } from "./use-horizon-data";

const STATUS_COLORS: Record<SubsystemStatus["status"], string> = {
  up: "bg-[#66FCF1]",
  degraded: "bg-amber-400 animate-pulse",
  down: "bg-[#E94560] animate-pulse",
};

interface ActiveSystemsProps {
  subsystems: SubsystemStatus[];
}

export function ActiveSystems({ subsystems }: ActiveSystemsProps) {
  return (
    <div className="flex items-center gap-1 mr-3 shrink-0" title="Subsystem Health">
      {subsystems.map((s) => (
        <div
          key={s.id}
          className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[s.status]}`}
          title={`${s.name}: ${s.status}`}
        />
      ))}
    </div>
  );
}

