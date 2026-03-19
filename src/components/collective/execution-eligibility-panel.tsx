"use client";

import { Badge } from "@/components/ui/badge";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import type { ExecutionEligibilityView } from "@/lib/collective";

interface ExecutionEligibilityPanelProps {
  readonly eligibility: ExecutionEligibilityView;
}

function toBadgeVariant(tone: ExecutionEligibilityView["statusPresentation"]["tone"]): "healthy" | "warning" | "critical" | "neutral" {
  switch (tone) {
    case "success":
      return "healthy";
    case "warning":
      return "warning";
    case "danger":
      return "critical";
    default:
      return "neutral";
  }
}

export function ExecutionEligibilityPanel({ eligibility }: ExecutionEligibilityPanelProps) {
  const isEligible = eligibility.status === "eligible";

  return (
    <Panel className="border-[--tungsten]/60">
      <PanelHeader className="gap-3">
        <PanelTitle>Execution Eligibility</PanelTitle>
        <Badge variant={toBadgeVariant(eligibility.statusPresentation.tone)}>
          {eligibility.statusPresentation.label}
        </Badge>
      </PanelHeader>

      <PanelContent className="space-y-3">
        {isEligible ? (
          <>
            <p className="text-xs font-mono text-[--flash] leading-relaxed">
              All authority conditions are satisfied.
            </p>
            <p className="text-xs font-mono text-[--steel] leading-relaxed">
              Execution still requires governed invocation.
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-mono text-[--flash] leading-relaxed">
              Execution is not eligible under current authority conditions.
            </p>
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wider text-[--steel]">
                Reasons
              </p>
              <ul className="space-y-1 text-xs font-mono text-[--flash]">
                {eligibility.reasons.map((entry) => (
                  <li key={`${entry.code}:${entry.message}`} className="flex gap-2 leading-relaxed">
                    <span className="text-[--safety-orange]">•</span>
                    <span>{entry.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </PanelContent>
    </Panel>
  );
}
