"use client";

import { Badge } from "@/components/ui/badge";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import type { LifecyclePresentation, DispositionPresentation, BadgePresentation } from "@/lib/collective/dto";
import { normalizeBadges } from "@/lib/collective/normalization";
import { toneToVariant } from "@/lib/collective/ui-bridge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConstitutionalStatusPanelProps {
  readonly lifecyclePresentation: LifecyclePresentation<string>;
  readonly dispositionPresentation?: DispositionPresentation<string>;
  readonly constitutionalMode: string;
  readonly badges: readonly string[];
}

function PresentationBadge({
  presentation,
  label,
}: {
  readonly presentation: { raw: string; label: string; tone: string };
  readonly label: string;
}) {
  const variant = toneToVariant(presentation.tone as "neutral" | "info" | "success" | "warning" | "danger");
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5C6C7]/50">
        {label}
      </span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={variant}>{presentation.label}</Badge>
          </TooltipTrigger>
          <TooltipContent>
            <span className="font-mono text-xs">raw: {presentation.raw}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export function ConstitutionalStatusPanel({
  lifecyclePresentation,
  dispositionPresentation,
  constitutionalMode,
  badges,
}: ConstitutionalStatusPanelProps) {
  const normalizedBadges = normalizeBadges(badges);

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Constitutional Status</PanelTitle>
      </PanelHeader>
      <PanelContent>
        <div className="space-y-3">
          <PresentationBadge
            presentation={lifecyclePresentation}
            label="Lifecycle"
          />

          {dispositionPresentation && (
            <PresentationBadge
              presentation={dispositionPresentation}
              label="Disposition"
            />
          )}

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5C6C7]/50">
              Mode
            </span>
            <Badge variant="neutral">{constitutionalMode}</Badge>
          </div>

          {normalizedBadges.length > 0 && (
            <div className="pt-2 border-t border-[#384656]">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5C6C7]/50 block mb-1.5">
                Badges
              </span>
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
            </div>
          )}
        </div>
      </PanelContent>
    </Panel>
  );
}
