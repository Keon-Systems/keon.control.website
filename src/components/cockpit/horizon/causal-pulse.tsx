"use client";

/**
 * Causal Pulse — Last meaningful system transition.
 *
 * Not a feed. Not scrollable. One line, auto-replacing.
 * Severity visible from day one (Amendment 6 + 13).
 *
 * Fades to "System calm" when no transitions for >60s.
 */

import { useState, useEffect, useRef } from "react";
import { useSelectionActions } from "@/lib/cockpit/use-focus";
import type { CausalPulseEvent } from "@/lib/cockpit/types";

const SEVERITY_STYLES: Record<string, { text: string; bg: string; pulse: boolean }> = {
  info:     { text: "text-[#45A29E]", bg: "bg-[#45A29E]/5", pulse: false },
  warning:  { text: "text-amber-400", bg: "bg-amber-400/5", pulse: true },
  critical: { text: "text-[#E94560]", bg: "bg-[#E94560]/5", pulse: true },
};

interface CausalPulseProps {
  event: CausalPulseEvent | null;
}

export function CausalPulse({ event }: CausalPulseProps) {
  const { select } = useSelectionActions();
  const [ageSeconds, setAgeSeconds] = useState(0);
  const [isCalm, setIsCalm] = useState(true);
  const lastEventRef = useRef<string | null>(null);

  // Track age of current pulse
  useEffect(() => {
    if (!event) {
      setIsCalm(true);
      return;
    }

    // New event arrived
    if (event.timestamp !== lastEventRef.current) {
      lastEventRef.current = event.timestamp;
      setAgeSeconds(0);
      setIsCalm(false);
    }

    const interval = setInterval(() => {
      const age = Math.floor((Date.now() - new Date(event.timestamp).getTime()) / 1000);
      setAgeSeconds(age);
      if (age > 60) setIsCalm(true);
    }, 1000);

    return () => clearInterval(interval);
  }, [event]);

  // Calm state — no recent transitions
  if (isCalm || !event) {
    return (
      <div className="flex items-center gap-1.5 flex-1 min-w-0 mx-3">
        <span className="text-[9px] font-mono text-[#C5C6C7]/20 truncate">
          System calm
        </span>
      </div>
    );
  }

  const style = SEVERITY_STYLES[event.severity] ?? SEVERITY_STYLES.info;
  const ageLabel = ageSeconds < 60 ? `${ageSeconds}s ago` : `${Math.floor(ageSeconds / 60)}m ago`;

  return (
    <div className={`flex items-center gap-1.5 flex-1 min-w-0 mx-3 rounded px-1.5 py-0.5 ${style.bg}`}>
      {/* Severity dot */}
      <div
        className={`h-1 w-1 rounded-full shrink-0 ${
          event.severity === "critical" ? "bg-[#E94560]" :
          event.severity === "warning" ? "bg-amber-400" :
          "bg-[#45A29E]"
        } ${style.pulse ? "animate-pulse" : ""}`}
      />

      {/* Event summary — clickable if entity ref exists */}
      {event.entityRef ? (
        <button
          onClick={() =>
            select({
              kind: event.entityRef!.kind,
              id: event.entityRef!.id,
              correlationId: null,
              source: "horizon",
              anchorType: "derived",
            })
          }
          className={`text-[9px] font-mono truncate ${style.text} hover:underline cursor-pointer`}
          title={event.summary}
        >
          {event.summary}
        </button>
      ) : (
        <span className={`text-[9px] font-mono truncate ${style.text}`} title={event.summary}>
          {event.summary}
        </span>
      )}

      {/* Age */}
      <span className="text-[8px] font-mono text-[#C5C6C7]/25 shrink-0 ml-auto">
        {ageLabel}
      </span>
    </div>
  );
}

