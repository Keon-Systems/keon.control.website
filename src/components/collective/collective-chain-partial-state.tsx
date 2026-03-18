"use client";

import { Badge } from "@/components/ui/badge";
import type { CollectiveChainStage, CollectiveChainView } from "@/lib/collective/chain.dto";
import { getCollectiveChainStageLabel } from "@/lib/collective/chain.normalization";

interface CollectiveChainPartialStateProps {
  readonly completeness: CollectiveChainView["completeness"];
}

export function CollectiveChainPartialState({ completeness }: CollectiveChainPartialStateProps) {
  if (!completeness.isPartial) return null;

  return (
    <div className="rounded-sm border border-dashed border-[--tungsten]/50 bg-[--gun-metal] px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[--steel]">
            Partial Chain
          </p>
          <p className="mt-1 text-xs font-mono text-[--tungsten] leading-relaxed">
            {completeness.missingStages.length} of 8 stages are not anchored.
            Missing stages are constitutionally normal when later pipeline
            steps have not yet occurred or were not required.
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {completeness.missingStages.map((stage: CollectiveChainStage) => (
            <Badge key={stage} variant="offline">
              {getCollectiveChainStageLabel(stage)}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
