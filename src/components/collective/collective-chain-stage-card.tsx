"use client";

import { Badge } from "@/components/ui/badge";
import { Panel, PanelContent } from "@/components/ui/panel";
import type { CollectiveChainNode, CollectiveChainStage } from "@/lib/collective/chain.dto";
import type { ExecutionEligibilityStatus } from "@/lib/collective/eligibility.dto";
import type { InvocationReadinessStatus } from "@/lib/collective/invocation-preview.dto";
import type { PresentationTone } from "@/lib/collective/dto";
import { getCollectiveChainStageLabel } from "@/lib/collective/chain.normalization";
import { cn } from "@/lib/utils";
import {
  FileText,
  Scale,
  Stamp,
  Dna,
  Users,
  ShieldCheck,
  Zap,
  Package,
} from "lucide-react";

const STAGE_ICONS: Record<CollectiveChainStage, React.ElementType> = {
  reform: FileText,
  legitimacy: Scale,
  adoption: Stamp,
  mutation: Dna,
  delegation: Users,
  permission: ShieldCheck,
  activation: Zap,
  preparedEffect: Package,
};

const TONE_BORDER: Record<PresentationTone, string> = {
  success: "border-[--reactor-blue]",
  warning: "border-[--safety-orange]",
  danger: "border-[--ballistic-red]",
  info: "border-[--reactor-blue]/50",
  neutral: "border-[--tungsten]",
};

const TONE_ICON_COLOR: Record<PresentationTone, string> = {
  success: "text-[--reactor-glow]",
  warning: "text-[--safety-orange]",
  danger: "text-[--ballistic-red]",
  info: "text-[--reactor-blue]",
  neutral: "text-[--tungsten]",
};

export const TONE_BADGE_VARIANT: Record<PresentationTone, "healthy" | "warning" | "critical" | "neutral" | "offline"> = {
  success: "healthy",
  warning: "warning",
  danger: "critical",
  info: "healthy",
  neutral: "neutral",
};

interface CollectiveChainStageCardProps {
  readonly node: CollectiveChainNode;
  readonly isFocused: boolean;
  readonly isDimmed?: boolean;
  readonly isGuidedMissing?: boolean;
  readonly eligibilityStatus?: ExecutionEligibilityStatus;
  readonly invocationReadiness?: InvocationReadinessStatus;
  readonly onSelect: (nodeId: string) => void;
}

export function CollectiveChainStageCard({ node, isFocused, isDimmed, isGuidedMissing, eligibilityStatus, invocationReadiness, onSelect }: CollectiveChainStageCardProps) {
  const Icon = STAGE_ICONS[node.stage];
  const stageLabel = getCollectiveChainStageLabel(node.stage);

  if (!node.isPresent) {
    return (
      <Panel
        className={cn(
          "w-48 shrink-0 border-dashed cursor-default",
          "border-[--tungsten]",
          // In guided mode: guided-focused missing stage gets distinct treatment
          isGuidedMissing
            ? "opacity-70 border-[--reactor-blue]/40 ring-1 ring-[--reactor-blue]/20"
            : "opacity-40",
          isDimmed && !isGuidedMissing && "opacity-20",
        )}
      >
        <PanelContent className="p-3">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-[--tungsten]" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-[--tungsten]">
              {stageLabel}
            </span>
          </div>
          <p className="mt-2 text-[10px] font-mono text-[--tungsten]/70 leading-tight">
            Not anchored to this chain
          </p>
          <Badge variant="offline" className="mt-2">MISSING</Badge>
        </PanelContent>
      </Panel>
    );
  }

  const isPreparedEffect = node.stage === "preparedEffect";

  return (
    <Panel
      glow={isFocused}
      className={cn(
        "w-48 shrink-0 cursor-pointer transition-all duration-200",
        isPreparedEffect
          ? "border-dashed border-[--safety-orange]/50"
          : TONE_BORDER[node.stateTone],
        isFocused && "ring-1 ring-[--reactor-glow]/40 shadow-[0_0_8px_rgba(69,162,158,0.25)]",
        isDimmed && "opacity-30",
      )}
      onClick={() => onSelect(node.id)}
    >
      <PanelContent className="p-3">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className={cn(
              "h-4 w-4 shrink-0",
              isPreparedEffect ? "text-[--safety-orange]" : TONE_ICON_COLOR[node.stateTone],
            )} />
            <span className="font-mono text-[10px] uppercase tracking-wider text-[--steel] truncate">
              {stageLabel}
            </span>
          </div>
        </div>

        <h4 className="mt-2 text-xs font-semibold text-[--flash] leading-tight line-clamp-2">
          {node.title}
        </h4>

        {node.subtitle && (
          <p className="mt-1 text-[10px] text-[--steel] leading-tight line-clamp-2">
            {node.subtitle}
          </p>
        )}

        <div className="mt-2 flex flex-wrap gap-1">
          <Badge variant={TONE_BADGE_VARIANT[node.stateTone]}>
            {node.stateLabel}
          </Badge>
          {isPreparedEffect && (
            <Badge variant="warning">INERT</Badge>
          )}
        </div>

        {isPreparedEffect && (
          <p className="mt-2 text-[9px] font-mono text-[--safety-orange]/80 leading-tight">
            No execution authority
          </p>
        )}

        {isPreparedEffect && eligibilityStatus && (
          <p className={cn(
            "mt-1 text-[9px] font-mono leading-tight",
            eligibilityStatus === "eligible"
              ? "text-[--reactor-glow]/80"
              : "text-[--ballistic-red]/80",
          )}>
            Execution Eligibility: {eligibilityStatus === "eligible" ? "ELIGIBLE" : "NOT ELIGIBLE"}
          </p>
        )}

        {isPreparedEffect && invocationReadiness && (
          <p className={cn(
            "mt-1 text-[9px] font-mono leading-tight",
            invocationReadiness === "ready"
              ? "text-[--reactor-glow]/80"
              : invocationReadiness === "constrained"
                ? "text-[--safety-orange]/80"
                : "text-[--tungsten]/80",
          )}>
            Invocation: {invocationReadiness === "ready"
              ? "READY"
              : invocationReadiness === "constrained"
                ? "CONSTRAINED"
                : "NOT AVAILABLE"}
          </p>
        )}

        {node.timestampUtc && (
          <p className={cn(
            "text-[9px] font-mono text-[--tungsten] tabular-nums",
            isPreparedEffect ? "mt-1" : "mt-2",
          )}>
            {new Date(node.timestampUtc).toLocaleString()}
          </p>
        )}
      </PanelContent>
    </Panel>
  );
}
