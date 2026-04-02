"use client";

import {
  ConstitutionalStatusPanel,
  LineageRefsPanel,
  StrategyMutationReceiptPanel,
} from "@/components/collective";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { collectiveObservabilityQueryKeys } from "@/lib/collective/queryKeys";
import { createReformAdoptionRepository } from "@/lib/collective/repositories";
import { useQuery } from "@tanstack/react-query";

const repo = createReformAdoptionRepository();

interface AdoptionDetailClientProps {
  readonly decisionId: string;
}

export function AdoptionDetailClient({ decisionId }: AdoptionDetailClientProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: collectiveObservabilityQueryKeys.reformAdoption.detail(decisionId),
    queryFn: () => repo.detail(decisionId),
  });

  if (isLoading) {
    return <p className="p-6 text-[#C5C6C7]/50">Loading adoption decision...</p>;
  }
  if (error || !data) {
    return <p className="p-6 text-red-500">Failed to load adoption decision</p>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Metadata Grid */}
      <Panel>
        <PanelHeader>
          <PanelTitle>Decision Metadata</PanelTitle>
        </PanelHeader>
        <PanelContent>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs lg:grid-cols-3">
            <div>
              <span className="text-[#C5C6C7]/50">Decision ID</span>
              <p className="break-all font-mono text-[11px] text-[#C5C6C7]">{data.decisionId}</p>
            </div>
            <div>
              <span className="text-[#C5C6C7]/50">Proposal ID</span>
              <p className="break-all font-mono text-[11px] text-[#C5C6C7]">{data.proposalId}</p>
            </div>
            <div>
              <span className="text-[#C5C6C7]/50">Legitimacy Assessment</span>
              <p className="break-all font-mono text-[11px] text-[#C5C6C7]">{data.legitimacyAssessmentId}</p>
            </div>
            <div>
              <span className="text-[#C5C6C7]/50">Epoch</span>
              <p className="font-mono text-[#C5C6C7]">{data.anchorEpochId}</p>
            </div>
            <div>
              <span className="text-[#C5C6C7]/50">Governance Authority</span>
              <p className="break-all font-mono text-[11px] text-[#C5C6C7]">{data.governanceAuthority}</p>
            </div>
            <div>
              <span className="text-[#C5C6C7]/50">Correlation ID</span>
              <p className="break-all font-mono text-[11px] text-[#C5C6C7]">{data.correlationId}</p>
            </div>
            <div>
              <span className="text-[#C5C6C7]/50">Decided</span>
              <p className="font-mono text-[11px] text-[#C5C6C7]">
                {new Date(data.decidedAtUtc).toLocaleString()}
              </p>
            </div>
            {data.governanceBindingRef && (
              <div>
                <span className="text-[#C5C6C7]/50">Governance Binding</span>
                <p className="break-all font-mono text-[11px] text-[#C5C6C7]">{data.governanceBindingRef}</p>
              </div>
            )}
          </div>
        </PanelContent>
      </Panel>

      {/* Constitutional Status */}
      <ConstitutionalStatusPanel
        lifecyclePresentation={data.lifecyclePresentation}
        dispositionPresentation={data.dispositionPresentation}
        constitutionalMode={data.constitutionalMode}
        badges={data.badges}
      />

      {/* Decision Rationale */}
      <Panel>
        <PanelHeader>
          <PanelTitle>Decision Rationale</PanelTitle>
        </PanelHeader>
        <PanelContent>
          <p className="whitespace-pre-wrap font-mono text-xs text-[#C5C6C7]">
            {data.decisionRationale}
          </p>
        </PanelContent>
      </Panel>

      {/* Strategy Mutation Receipts */}
      <StrategyMutationReceiptPanel groups={data.mutationReceiptGroups} />

      {/* Lineage */}
      <LineageRefsPanel
        anchorReceiptRefs={data.anchorReceiptRefs}
        lineageRefs={data.lineageRefs}
        badges={data.badges}
      />
    </div>
  );
}
