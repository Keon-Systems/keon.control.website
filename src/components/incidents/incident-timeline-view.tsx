"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/lib/format";

export interface TimelineEvent {
  eventId: string;
  timestamp: string;
  actor: string;
  type: string;
  description: string;
}

interface IncidentTimelineViewProps {
  events: TimelineEvent[];
}

const typeColors: Record<string, string> = {
  detection: "bg-red-400",
  declaration: "bg-amber-400",
  update: "bg-[#66FCF1]",
  resolution: "bg-[#45A29E]",
  escalation: "bg-red-400",
};

function typeColor(type: string): string {
  return typeColors[type] ?? "bg-[#C5C6C7]";
}

export function IncidentTimelineView({ events }: IncidentTimelineViewProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 opacity-50">
        <p className="font-mono text-sm text-[#C5C6C7]">No timeline events available</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((event, idx) => (
        <div key={event.eventId} className="flex gap-4">
          {/* Timeline line + dot */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "mt-1 h-3 w-3 shrink-0 rounded-full",
                typeColor(event.type)
              )}
            />
            {idx < events.length - 1 && (
              <div className="w-px flex-1 bg-[#384656]" />
            )}
          </div>

          {/* Event content */}
          <div className="min-w-0 flex-1 pb-6">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-[#C5C6C7] opacity-50">
                {formatTimestamp(new Date(event.timestamp))}
              </span>
              <span className="rounded bg-[#384656] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[#C5C6C7]">
                {event.type}
              </span>
              <span className="font-mono text-xs text-[#66FCF1]">{event.actor}</span>
            </div>
            <p className="font-mono text-sm text-[#C5C6C7]">{event.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
