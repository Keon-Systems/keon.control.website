"use client";

import { Badge } from "@/components/ui/badge";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import type { InvocationPreviewView } from "@/lib/collective/invocation-preview.dto";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";
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
      tone === "neutral" && "border-[--tungsten]/30",
    )}>
      <PanelHeader>
        <div className="flex items-center gap-2">
          <Eye className={cn(
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

      <PanelContent className="p-3 space-y-3">
        {/* Summary */}
        <p className={cn(
          "text-xs font-mono leading-relaxed",
          tone === "success" && "text-[--flash]",
          tone === "warning" && "text-[--safety-orange]",
          tone === "neutral" && "text-[--steel]",
        )}>
          {preview.summary}
        </p>

        {/* Requirements list */}
        <div>
          <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-[--steel]">
            Requirements
          </p>
          <ul className="space-y-1">
            {preview.requirements.map((req) => (
              <li
                key={req.code}
                className="flex items-start gap-2 text-xs font-mono text-[--flash] leading-relaxed"
              >
                <span
                  className={cn(
                    "shrink-0 select-none",
                    req.satisfied ? "text-[--reactor-glow]" : "text-[--ballistic-red]",
                  )}
                  aria-hidden
                >
                  {req.satisfied ? "\u2713" : "\u2717"}
                </span>
                <span>{req.message}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer — constitutional constraint notice */}
        <p className="text-[10px] font-mono text-[--safety-orange]/80 leading-relaxed">
          Invocation preview does not submit or execute this effect.
          Execution requires governed invocation.
        </p>

        {/* Timestamp */}
        <p className="text-[9px] font-mono text-[--tungsten] tabular-nums">
          Evaluated {new Date(preview.evaluatedAtUtc).toLocaleString()}
        </p>
      </PanelContent>
    </Panel>
  );
}
