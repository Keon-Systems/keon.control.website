"use client";

import type { CollectiveChainEdge } from "@/lib/collective/chain.dto";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface CollectiveChainEdgeConnectorProps {
  readonly edge: CollectiveChainEdge | null;
}

export function CollectiveChainEdgeConnector({ edge }: CollectiveChainEdgeConnectorProps) {
  if (!edge) {
    return (
      <div className="flex shrink-0 flex-col items-center justify-center px-1 py-2">
        <div className="h-px w-6 border-t border-dashed border-[--tungsten]/30" />
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-col items-center justify-center px-1 py-2 group">
      <div className="relative flex items-center">
        <div className="h-px w-4 bg-[--tungsten]/50 group-hover:bg-[--reactor-blue]/50 transition-colors" />
        <ChevronRight className="h-3 w-3 text-[--tungsten]/50 group-hover:text-[--reactor-blue]/50 transition-colors -mx-0.5" />
      </div>
      <span
        className={cn(
          "mt-1 max-w-[80px] text-center text-[8px] font-mono leading-tight text-[--tungsten]/60",
          "group-hover:text-[--steel]/80 transition-colors",
        )}
      >
        {edge.relationshipLabel}
      </span>
    </div>
  );
}
