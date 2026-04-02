"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { dispositionToVariant } from "@/lib/mappers/collective";
import type { LegitimacyDisposition } from "@/lib/contracts/collective";
import { cn } from "@/lib/utils";

const DISPOSITION_LABELS: Readonly<Record<string, string>> = {
  LEGITIMATE: "Legitimate",
  CONTESTED: "Contested",
  INSUFFICIENT_EVIDENCE: "Insufficient Evidence",
  REJECTED: "Rejected",
};

interface DispositionBadgeProps {
  readonly disposition: string;
  readonly className?: string;
}

export function DispositionBadge({ disposition, className }: DispositionBadgeProps) {
  const label = DISPOSITION_LABELS[disposition] ?? disposition;
  const variant = dispositionToVariant(disposition as LegitimacyDisposition);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className={cn(className)}>
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="bg-[#0B0C10] border-[#384656] text-[#C5C6C7] text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
