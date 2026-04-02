"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Anchor } from "lucide-react";

interface LineageAnchorBadgeProps {
  readonly rhid: string;
  readonly className?: string;
}

/**
 * Lightweight RHID badge for collective lineage anchors.
 * Unlike the courtroom RHIDBadge, this does not require manifest resolution --
 * lineage anchors are displayed as-is with their RHID string.
 */
export function LineageAnchorBadge({ rhid, className }: LineageAnchorBadgeProps) {
  const kind = rhid.split(":")[1] || "unknown";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-2 px-2 py-1 rounded",
              "bg-[#384656]/30 border border-[#384656]",
              "text-[#C5C6C7] text-xs font-mono",
              "cursor-help hover:border-[#66FCF1]/50 transition-colors",
              className,
            )}
          >
            <Anchor className="h-3 w-3 text-[#66FCF1]" />
            {rhid}
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-[#0B0C10] border-[#384656] text-[#C5C6C7] p-2 text-xs">
          <span className="text-[10px] text-[#66FCF1] uppercase font-bold tracking-wider">
            Lineage Anchor
          </span>
          <span className="block mt-1 font-mono">{kind}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
