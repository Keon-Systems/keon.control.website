"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { DataValue } from "@/components/ui/data-value";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { ExecutionEligibilityPanel } from "@/components/collective/execution-eligibility-panel";
import type { CollectiveChainNode } from "@/lib/collective/chain.dto";
import { collectiveObservabilityQueryKeys } from "@/lib/collective/queryKeys";
import { createExecutionEligibilityRepository } from "@/lib/collective/repositories";
import { getCollectiveChainStageLabel } from "@/lib/collective/chain.normalization";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

/**
 * Resolves the native detail page URL for a chain node.
 * Returns null if no dedicated page exists for that stage yet.
 * This is distinct from node.href, which is the chain-view self-link.
 */
function resolveNativeDetailHref(node: CollectiveChainNode): string | null {
  if (!node.isPresent || !node.recordId) return null;

  const id = encodeURIComponent(node.recordId);

  switch (node.stage) {
    case "reform":
      return `/collective/reforms/${id}`;
    case "legitimacy":
      // Legitimacy lives under its parent reform — recordId is the assessment ID,
      // but the page is keyed by artifactId. We link to the assessment-level page
      // when the reform's artifactId is embedded in lineageRefs, otherwise null.
      return null;
    case "adoption":
      return `/governance/decisions/${id}`;
    case "mutation":
      return null; // No dedicated page yet
    case "delegation":
      return null; // No dedicated page yet
    case "permission":
      return null; // No dedicated page yet
    case "activation":
      return null; // No dedicated page yet
    case "preparedEffect":
      return null; // No dedicated page yet
    default:
      return null;
  }
}

interface CollectiveChainDetailRailProps {
  readonly node: CollectiveChainNode | null;
}

export function CollectiveChainDetailRail({ node }: CollectiveChainDetailRailProps) {
  const preparedEffectId = node?.stage === "preparedEffect" && node.isPresent ? node.recordId : null;
  const eligibility = useQuery({
    queryKey: preparedEffectId
      ? collectiveObservabilityQueryKeys.executionEligibility.detail(preparedEffectId)
      : ["collective", "execution-eligibility", "detail", "absent"] as const,
    queryFn: () => createExecutionEligibilityRepository().evaluate(preparedEffectId!),
    enabled: Boolean(preparedEffectId),
    staleTime: 0,
  });

  if (!node) {
    return (
      <Panel className="w-full">
        <PanelHeader>
          <PanelTitle>Detail</PanelTitle>
        </PanelHeader>
        <PanelContent>
          <p className="text-xs font-mono text-[--steel]">
            Select a stage to inspect its constitutional record.
          </p>
        </PanelContent>
      </Panel>
    );
  }

  const stageLabel = getCollectiveChainStageLabel(node.stage);
  const isPreparedEffect = node.stage === "preparedEffect";
  const nativeHref = resolveNativeDetailHref(node);

  return (
    <Panel className="w-full" glow>
      <PanelHeader>
        <PanelTitle>{stageLabel}</PanelTitle>
        <div className="flex items-center gap-2">
          {nativeHref && (
            <Link
              href={nativeHref}
              className="inline-flex items-center gap-1 text-[10px] font-mono text-[--reactor-blue] hover:text-[--reactor-glow] transition-colors"
            >
              View detail <ExternalLink className="h-3 w-3" />
            </Link>
          )}
          {!nativeHref && node.isPresent && (
            <span className="text-[9px] font-mono text-[--tungsten]">
              No dedicated page
            </span>
          )}
        </div>
      </PanelHeader>

      <PanelContent className="space-y-4">
        {!node.isPresent && (
          <div className="rounded-sm border border-dashed border-[--tungsten] p-3">
            <p className="text-xs font-mono text-[--tungsten]">
              This stage is not anchored to this chain. Its absence is constitutionally normal
              and does not indicate a system failure.
            </p>
          </div>
        )}

        {isPreparedEffect && node.isPresent && (
          <div className="rounded-sm border border-dashed border-[--safety-orange]/40 bg-[--safety-orange]/5 p-3">
            <p className="text-xs font-mono text-[--safety-orange]">
              This prepared effect is inert. It authorizes no execution flow.
              No execution authority is granted by viewing or inspecting this record.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <DetailRow label="Title" value={node.title} />
          {node.subtitle && <DetailRow label="Subtitle" value={node.subtitle} />}
          {node.description && <DetailRow label="Description" value={node.description} />}

          <div className="border-t border-[--tungsten]/30 pt-3">
            <DetailRow label="State" value={node.stateLabel} />
            <DetailRow label="Raw State" value={node.rawState} mono />
            <DetailRow label="Constitutional Mode" value={node.constitutionalMode} mono />
          </div>

          {preparedEffectId && eligibility.data && (
            <div className="border-t border-[--tungsten]/30 pt-3">
              <ExecutionEligibilityPanel eligibility={eligibility.data} />
            </div>
          )}

          {preparedEffectId && eligibility.error && (
            <div className="border-t border-[--tungsten]/30 pt-3">
              <p className="text-xs font-mono text-[--safety-orange] leading-relaxed">
                Execution eligibility is unavailable for this prepared effect.
              </p>
            </div>
          )}

          {node.recordId && (
            <div className="border-t border-[--tungsten]/30 pt-3">
              <DataValue
                variant="hash"
                size="sm"
                value={node.recordId}
                label="Record ID"
                copyable
              />
            </div>
          )}

          {node.timestampUtc && (
            <div className="border-t border-[--tungsten]/30 pt-3">
              <DataValue
                variant="timestamp"
                size="sm"
                value={node.timestampUtc}
                label="Timestamp"
              />
            </div>
          )}

          {node.anchorReceiptRefs.length > 0 && (
            <div className="border-t border-[--tungsten]/30 pt-3">
              <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-[--steel]">
                Anchor Receipts
              </p>
              <div className="flex flex-wrap gap-1">
                {node.anchorReceiptRefs.map((ref) => (
                  <DataValue
                    key={ref}
                    variant="hash"
                    size="sm"
                    value={ref}
                    copyable
                  />
                ))}
              </div>
            </div>
          )}

          {node.lineageRefs.length > 0 && (
            <div className="border-t border-[--tungsten]/30 pt-3">
              <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-[--steel]">
                Lineage Refs
              </p>
              <div className="flex flex-wrap gap-1">
                {node.lineageRefs.map((ref) => (
                  <DataValue
                    key={ref}
                    variant="hash"
                    size="sm"
                    value={ref}
                    copyable
                  />
                ))}
              </div>
            </div>
          )}

          {node.badges.length > 0 && (
            <div className="border-t border-[--tungsten]/30 pt-3">
              <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-[--steel]">
                Badges
              </p>
              <div className="flex flex-wrap gap-1">
                {node.badges.map((badge) => (
                  <Badge key={badge} variant="neutral">
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </PanelContent>
    </Panel>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-mono uppercase tracking-wider text-[--steel]">
        {label}
      </span>
      <span className={cn("text-xs text-[--flash] leading-relaxed", mono && "font-mono")}>
        {value}
      </span>
    </div>
  );
}
