"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { BadgeVariant } from "@/lib/mappers/collective";
import { cn } from "@/lib/utils";

const HEAT_STATE_DESCRIPTIONS: Readonly<Record<string, string>> = {
  Cool: "System operating within normal parameters",
  Warm: "Elevated activity detected; monitoring engaged",
  Hot: "High contention or anomaly; oversight escalation likely",
  Critical: "Immediate oversight intervention required",
};

interface HeatStateBadgeProps {
  readonly state: string;
  readonly variant: BadgeVariant;
  readonly className?: string;
}

export function HeatStateBadge({ state, variant, className }: HeatStateBadgeProps) {
  const description = HEAT_STATE_DESCRIPTIONS[state] ?? state;
  const isCritical = state === "Critical";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={variant}
            className={cn(isCritical && "animate-pulse", className)}
          >
            {state.toUpperCase()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="bg-[#0B0C10] border-[#384656] text-[#C5C6C7] text-xs">
          {description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
