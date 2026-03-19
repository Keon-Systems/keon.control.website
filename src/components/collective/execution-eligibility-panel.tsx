"use client";

import { Badge } from "@/components/ui/badge";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import type { ExecutionEligibilityView } from "@/lib/collective/eligibility.dto";
import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { TONE_BADGE_VARIANT } from "./collective-chain-stage-card";

interface ExecutionEligibilityPanelProps {
  readonly eligibility: ExecutionEligibilityView;
}

export function ExecutionEligibilityPanel({ eligibility }: ExecutionEligibilityPanelProps) {
  const isEligible = eligibility.status === "eligible";
  const Icon = isEligible ? ShieldCheck : ShieldAlert;
  const tone = eligibility.statusPresentation.tone;

  return (
    <Panel className={cn(
      "w-full",
      tone === "success" && "border-[--reactor-blue]/30",
      tone === "warning" && "border-[--safety-orange]/30",
      tone === "danger" && "border-[--ballistic-red]/30",
    )}>
      <PanelHeader>
        <div className="flex items-center gap-2">
          <Icon className={cn(
            "h-4 w-4",
            tone === "success" && "text-[--reactor-glow]",
            tone === "warning" && "text-[--safety-orange]",
            tone === "danger" && "text-[--ballistic-red]",
          )} />
          <PanelTitle>Execution Eligibility</PanelTitle>
        </div>
        <Badge variant={TONE_BADGE_VARIANT[tone]}>
          {eligibility.statusPresentation.label}
        </Badge>
      </PanelHeader>

      <PanelContent className="p-3 space-y-3">
        {isEligible ? (
          <>
            <p className="text-xs font-mono text-[--flash] leading-relaxed">
              All authority conditions are satisfied.
            </p>
            <p className="text-[10px] font-mono text-[--safety-orange]/80 leading-relaxed">
              Execution still requires governed invocation.
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-mono text-[--steel] leading-relaxed">
              Execution is not eligible under current authority conditions.
            </p>

            {eligibility.reasons.length > 0 && (
              <ul className="space-y-1">
                {eligibility.reasons.map((reason) => (
                  <li
                    key={reason.code}
                    className="flex items-start gap-2 text-xs font-mono text-[--flash] leading-relaxed"
                  >
                    <span className="text-[--tungsten] select-none shrink-0" aria-hidden>&#8226;</span>
                    <span>{reason.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <p className="text-[9px] font-mono text-[--tungsten] tabular-nums">
          Evaluated {new Date(eligibility.evaluatedAtUtc).toLocaleString()}
        </p>
      </PanelContent>
    </Panel>
  );
}
