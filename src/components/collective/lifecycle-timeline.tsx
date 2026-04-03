"use client";

import { Badge } from "@/components/ui/badge";
import type { LifecyclePresentation } from "@/lib/collective/dto";
import { toneToVariant } from "@/lib/collective/ui-bridge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface LifecycleTimelineEntry {
  readonly state: string;
  readonly statePresentation: LifecyclePresentation<string>;
  readonly timestamp: string;
  readonly reason?: string | null;
}

interface LifecycleTimelineProps {
  readonly entries: readonly LifecycleTimelineEntry[];
}

export function LifecycleTimeline({ entries }: LifecycleTimelineProps) {
  if (entries.length === 0) {
    return (
      <p className="text-xs text-[#C5C6C7]/50 italic">
        No lifecycle history recorded
      </p>
    );
  }

  return (
    <div className="relative pl-4">
      {/* Vertical line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#384656]" />

      <div className="space-y-4">
        {entries.map((entry, index) => {
          const isLatest = index === entries.length - 1;
          const variant = toneToVariant(entry.statePresentation.tone);

          return (
            <div key={`${entry.state}-${entry.timestamp}-${index}`} className="relative flex gap-3">
              {/* Dot */}
              <div
                className={`absolute -left-4 top-1 h-3 w-3 rounded-full border-2 ${
                  isLatest
                    ? "border-[#66FCF1] bg-[#66FCF1] shadow-[0_0_6px_rgba(102,252,241,0.4)]"
                    : "border-[#384656] bg-[#1F2833]"
                }`}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant={variant}>
                          {entry.statePresentation.label}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span className="font-mono text-xs">
                          raw: {entry.statePresentation.raw}
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="text-[10px] font-mono text-[#C5C6C7]/50">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                {entry.reason && (
                  <p className="mt-1 text-xs text-[#C5C6C7]/70">{entry.reason}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
