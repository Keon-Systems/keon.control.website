"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import type {
  InvocationDescriptor,
  InvocationDescriptorConstraint,
} from "@/lib/collective/invocation-descriptor.dto";
import {
  buildInvocationDescriptorPresentation,
  buildInvocationDescriptorSummary,
} from "@/lib/collective/invocation-descriptor.dto";
import { cn } from "@/lib/utils";
import { Braces } from "lucide-react";
import { TONE_BADGE_VARIANT } from "./collective-chain-stage-card";

interface InvocationDescriptorPanelProps {
  readonly descriptor: InvocationDescriptor;
  readonly compact?: boolean;
}

export function InvocationDescriptorPanel({
  descriptor,
  compact = false,
}: InvocationDescriptorPanelProps) {
  const presentation = buildInvocationDescriptorPresentation(descriptor.status);
  const tone = presentation.tone;
  const summary = buildInvocationDescriptorSummary(descriptor.status);

  return (
    <Panel className={cn(
      "w-full",
      tone === "success" && "border-[--reactor-blue]/30",
      tone === "warning" && "border-[--safety-orange]/30",
      tone === "neutral" && "border-[--tungsten]/30",
    )}>
      <PanelHeader>
        <div className="flex items-center gap-2">
          <Braces className={cn(
            "h-4 w-4",
            tone === "success" && "text-[--reactor-glow]",
            tone === "warning" && "text-[--safety-orange]",
            tone === "neutral" && "text-[--tungsten]",
          )} />
          <PanelTitle>Invocation Descriptor</PanelTitle>
        </div>
        <Badge variant={TONE_BADGE_VARIANT[tone]}>
          {presentation.label}
        </Badge>
      </PanelHeader>

      <PanelContent className="space-y-3 p-3">
        <p className={cn(
          "text-xs font-mono leading-relaxed",
          tone === "success" && "text-[--flash]",
          tone === "warning" && "text-[--safety-orange]",
          tone === "neutral" && "text-[--steel]",
        )}>
          {summary}
        </p>

        <div>
          <SectionLabel>Authority Context</SectionLabel>
          <dl className="grid grid-cols-1 gap-1 sm:grid-cols-3">
            <ContextCell label="Delegation" value={descriptor.requiredAuthorityContext.delegationId} />
            <ContextCell label="Permission" value={descriptor.requiredAuthorityContext.permissionId} />
            <ContextCell label="Activation" value={descriptor.requiredAuthorityContext.activationId} />
          </dl>
        </div>

        <div>
          <SectionLabel>Requirement Linkage</SectionLabel>
          <ul className="space-y-1">
            {descriptor.requirementSet.map((item) => (
              <li
                key={item.code}
                className="flex items-start justify-between gap-3 rounded-sm border border-[--tungsten]/20 px-2 py-1.5 text-xs font-mono"
              >
                <span className="text-[--flash]">{item.message}</span>
                <span className={cn(
                  item.satisfied ? "text-[--reactor-glow]" : "text-[--safety-orange]",
                )}>
                  {item.satisfied ? "satisfied" : "constrained"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {!compact && (
          <div className="space-y-3">
            <ConstraintGroup
              title="Authority Constraints"
              constraints={descriptor.constraintSet.authorityConstraints}
            />
            <ConstraintGroup
              title="Scope Constraints"
              constraints={descriptor.constraintSet.scopeConstraints}
            />
            <ConstraintGroup
              title="Temporal Constraints"
              constraints={descriptor.constraintSet.temporalConstraints}
            />
          </div>
        )}

        <div>
          <SectionLabel>Reference Linkage</SectionLabel>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <ReferenceCard
              label="Eligibility"
              status={descriptor.eligibilityReference.status}
              surface={descriptor.eligibilityReference.surface}
              evaluatedAtUtc={descriptor.eligibilityReference.evaluatedAtUtc}
            />
            <ReferenceCard
              label="Preview"
              status={descriptor.previewReference.status}
              surface={descriptor.previewReference.surface}
              evaluatedAtUtc={descriptor.previewReference.evaluatedAtUtc}
            />
          </div>
        </div>

        <p className="text-[10px] font-mono text-[--safety-orange]/80 leading-relaxed">
          This defines structure, not capability.
        </p>
      </PanelContent>
    </Panel>
  );
}

function ConstraintGroup({
  title,
  constraints,
}: {
  title: string;
  constraints: readonly InvocationDescriptorConstraint[];
}) {
  return (
    <div>
      <SectionLabel>{title}</SectionLabel>
      <ul className="space-y-1">
        {constraints.map((constraint) => (
          <li
            key={constraint.code}
            className="rounded-sm border border-[--tungsten]/20 px-2 py-1.5 text-xs font-mono"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[--flash]">{constraint.message}</span>
              <span className={cn(
                constraint.satisfied ? "text-[--reactor-glow]" : "text-[--safety-orange]",
              )}>
                {constraint.satisfied ? "aligned" : "constrained"}
              </span>
            </div>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-[--tungsten]">
              {constraint.references.join(" / ")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContextCell({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-sm border border-[--tungsten]/20 px-2 py-1.5">
      <dt className="text-[10px] font-mono uppercase tracking-wider text-[--steel]">{label}</dt>
      <dd className="mt-1 break-all text-xs font-mono text-[--flash]">{value ?? "unresolved"}</dd>
    </div>
  );
}

function ReferenceCard({
  label,
  surface,
  status,
  evaluatedAtUtc,
}: {
  label: string;
  surface: string;
  status: string;
  evaluatedAtUtc: string;
}) {
  return (
    <div className="rounded-sm border border-[--tungsten]/20 px-2 py-1.5">
      <p className="text-[10px] font-mono uppercase tracking-wider text-[--steel]">{label}</p>
      <p className="mt-1 text-xs font-mono text-[--flash]">{status}</p>
      <p className="mt-1 text-[10px] font-mono text-[--tungsten]">{surface}</p>
      <p className="mt-1 text-[10px] font-mono text-[--tungsten]">
        {new Date(evaluatedAtUtc).toLocaleString()}
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-[--steel]">
      {children}
    </p>
  );
}
