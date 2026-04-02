"use client";

import { Badge } from "@/components/ui/badge";
import type { BadgePresentation } from "@/lib/collective/dto";
import { normalizeBadges } from "@/lib/collective/normalization";
import { toneToVariant } from "@/lib/collective/ui-bridge";
import { LineageAnchorBadge } from "./lineage-anchor-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LineageRefsPanelProps {
  readonly anchorReceiptRefs: readonly string[];
  readonly lineageRefs: readonly string[];
  readonly badges: readonly string[];
}

function RefList({
  title,
  refs,
}: {
  readonly title: string;
  readonly refs: readonly string[];
}) {
  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#66FCF1] mb-2">
        {title}
      </h3>
      {refs.length === 0 ? (
        <p className="text-xs text-[#C5C6C7]/50 italic">None</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {refs.map((ref) => (
            <LineageAnchorBadge key={ref} rhid={ref} />
          ))}
        </div>
      )}
    </section>
  );
}

export function LineageRefsPanel({
  anchorReceiptRefs,
  lineageRefs,
  badges,
}: LineageRefsPanelProps) {
  const normalizedBadges = normalizeBadges(badges);

  return (
    <div className="space-y-4">
      <RefList title="Anchor Receipt References" refs={anchorReceiptRefs} />
      <RefList title="Lineage References" refs={lineageRefs} />

      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#66FCF1] mb-2">
          Badges
        </h3>
        {normalizedBadges.length === 0 ? (
          <p className="text-xs text-[#C5C6C7]/50 italic">None</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {normalizedBadges.map((badge: BadgePresentation) => (
              <TooltipProvider key={badge.raw}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant={toneToVariant(badge.tone)}>
                      {badge.label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span className="font-mono text-xs">raw: {badge.raw}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
