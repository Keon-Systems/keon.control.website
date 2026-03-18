"use client";

import { Panel, PanelContent } from "@/components/ui/panel";
import { Link2Off } from "lucide-react";

export function CollectiveChainEmptyState() {
  return (
    <Panel className="w-full">
      <PanelContent className="flex flex-col items-center justify-center py-16 text-center">
        <Link2Off className="h-10 w-10 text-[--tungsten] mb-4" />
        <h3 className="font-mono text-sm uppercase tracking-wider text-[--flash]">
          No Chain Found
        </h3>
        <p className="mt-2 max-w-md text-xs font-mono text-[--steel] leading-relaxed">
          No constitutional chain could be resolved for this identifier.
          This may mean the artifact has not yet entered the reform pipeline,
          or the chain has not been anchored to any known substrate.
        </p>
        <p className="mt-4 text-[10px] font-mono text-[--tungsten]">
          Viewing a chain does not authorize action.
        </p>
      </PanelContent>
    </Panel>
  );
}
