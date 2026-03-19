"use client";

import { Badge } from "@/components/ui/badge";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import type { InvocationPreviewView } from "@/lib/collective/invocation-preview.dto";
import { cn } from "@/lib/utils";
import { Check, Minus, X } from "lucide-react";
import { TONE_BADGE_VARIANT } from "./collective-chain-stage-card";

interface InvocationPreviewPanelProps {
  readonly preview: InvocationPreviewView;
}

export function InvocationPreviewPanel({ preview }: InvocationPreviewPanelProps) {
  const tone = preview.statusPresentation.tone;

  return (
    <Panel className={cn(
      "w-full",
      tone === "success" && "border-[--reactor-blue]/30",
      tone === "warning" && "border-[--safety-orange]/30",
      tone === "neutral" && "border-[--tungsten]/40",
    )}>
      <PanelHeader>
        <div className="flex items-center gap-2">
          <Minus className={cn(
            "h-4 w-4",
            tone === "success" && "text-[--reactor-glow]",
            tone === "warning" && "text-[--safety-orange]",
            tone === "neutral" && "text-[--tungsten]",
          )} />
          <PanelTitle>Invocation Preview</PanelTitle>
        </div>
        <Badge variant={TONE_BADGE_VARIANT[tone]}>
          {preview.statusPresentation.label}
        </Badge>
      </PanelHeader>

      <PanelContent className="space-y-3 p-3">
        <p className="text-xs font-mono text-[--flash] leading-relaxed">
          {preview.summary}
        </p>

        <div className="space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[--steel]">
            Requirements
          </p>
          <ul className="space-y-1">
            {preview.requirements.map((requirement) => {
              const Icon = requirement.satisfied ? Check : X;
              return (
                <li
                  key={requirement.code}
                  className="flex items-start gap-2 text-xs font-mono text-[--flash] leading-relaxed"
                >
                  <Icon
                    className={cn(
                      "mt-0.5 h-3.5 w-3.5 shrink-0",
                      requirement.satisfied ? "text-[--reactor-glow]" : "text-[--safety-orange]",
                    )}
                    aria-hidden
                  />
                  <span>{requirement.message}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-1 border-t border-[--tungsten]/30 pt-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[--steel]">
            Authority Context
          </p>
          <p className="text-[10px] font-mono text-[--tungsten] leading-relaxed">
            Delegation {preview.authorityContext.delegationId ?? "Unavailable"}
          </p>
          <p className="text-[10px] font-mono text-[--tungsten] leading-relaxed">
            Permission {preview.authorityContext.permissionId ?? "Unavailable"}
          </p>
          <p className="text-[10px] font-mono text-[--tungsten] leading-relaxed">
            Activation {preview.authorityContext.activationId ?? "Unavailable"}
          </p>
        </div>

        <p className="border-t border-[--tungsten]/30 pt-3 text-[10px] font-mono text-[--safety-orange]/85 leading-relaxed">
          This preview is informational only and does not create or submit anything.
          Prepared effects remain inert under current authority conditions.
        </p>
      </PanelContent>
    </Panel>
  );
}
