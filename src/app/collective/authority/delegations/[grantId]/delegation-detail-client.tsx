"use client";

import {
  ConstitutionalStatusPanel,
  LifecycleTimeline,
  LineageRefsPanel,
  ScopeDimensionGrid,
} from "@/components/collective";
import type { LifecycleTimelineEntry } from "@/components/collective";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { collectiveObservabilityQueryKeys } from "@/lib/collective/queryKeys";
import { createDelegatedAuthorityRepository } from "@/lib/collective/repositories";
import { presentDelegationStatus } from "@/lib/collective/normalization";
import { useQuery } from "@tanstack/react-query";

const repo = createDelegatedAuthorityRepository();

interface DelegationDetailClientProps {
  readonly grantId: string;
}

export function DelegationDetailClient({ grantId }: DelegationDetailClientProps) {
  const {
    data: detail,
    isLoading: detailLoading,
    error: detailError,
  } = useQuery({
    queryKey: collectiveObservabilityQueryKeys.delegatedAuthority.detail(grantId),
    queryFn: () => repo.detail(grantId),
  });

  const {
    data: lineage,
    isLoading: lineageLoading,
    error: lineageError,
  } = useQuery({
    queryKey: collectiveObservabilityQueryKeys.delegatedAuthority.lineage(grantId),
    queryFn: () => repo.lineage(grantId),
  });

  if (detailLoading || lineageLoading) {
    return <p className="p-6 text-[#C5C6C7]/50">Loading delegated authority grant...</p>;
  }
  if (detailError || lineageError || !detail || !lineage) {
    return <p className="p-6 text-red-500">Failed to load delegated authority grant</p>;
  }

  const scopeFields = [
    { label: "Domain Scope", value: detail.domainScope },
    { label: "Policy Scope", value: detail.policyScope },
    { label: "Policy Version", value: detail.policyVersion },
    { label: "Authority Class", value: detail.authorityClass },
    { label: "Effect Class", value: detail.effectClass },
  ];

  const timelineEntries: LifecycleTimelineEntry[] = lineage.transitions.map((t) => ({
    state: t.toStatus,
    statePresentation: presentDelegationStatus(t.toStatus),
    timestamp: t.transitionedAtUtc,
    reason: t.reason,
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Scope Dimensions */}
      <Panel>
        <PanelHeader>
          <PanelTitle>Authority Scope</PanelTitle>
        </PanelHeader>
        <PanelContent>
          <ScopeDimensionGrid fields={scopeFields} />
        </PanelContent>
      </Panel>

      {/* Constraint Statements */}
      <Panel>
        <PanelHeader>
          <PanelTitle>Constraint Statements</PanelTitle>
        </PanelHeader>
        <PanelContent>
          {detail.constraintStatements.length === 0 ? (
            <p className="text-xs text-[#C5C6C7]/50 italic">No constraints recorded</p>
          ) : (
            <ul className="list-disc list-inside space-y-1">
              {detail.constraintStatements.map((statement, index) => (
                <li
                  key={index}
                  className="font-mono text-xs text-[#C5C6C7]"
                >
                  {statement}
                </li>
              ))}
            </ul>
          )}
        </PanelContent>
      </Panel>

      {/* Upstream Authority Scope */}
      {detail.upstreamAuthorityScope !== null && (
        <Panel>
          <PanelHeader>
            <PanelTitle>Upstream Authority Scope</PanelTitle>
          </PanelHeader>
          <PanelContent>
            <ScopeDimensionGrid
              fields={[
                { label: "Tenant", value: detail.upstreamAuthorityScope.tenantId },
                { label: "Domain Scope", value: detail.upstreamAuthorityScope.domainScope },
                { label: "Policy Scope", value: detail.upstreamAuthorityScope.policyScope },
                { label: "Policy Version", value: detail.upstreamAuthorityScope.policyVersion },
                { label: "Authority Class", value: detail.upstreamAuthorityScope.authorityClass },
                { label: "Effect Class", value: detail.upstreamAuthorityScope.effectClass },
              ]}
            />
          </PanelContent>
        </Panel>
      )}

      {/* Revocation Record */}
      {detail.revocation !== null && (
        <Panel>
          <PanelHeader>
            <PanelTitle className="text-yellow-500">Revocation Record</PanelTitle>
          </PanelHeader>
          <PanelContent className="border-yellow-500/30">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
              <div>
                <span className="text-[#C5C6C7]/50">Revocation ID</span>
                <p className="break-all font-mono text-[11px] text-[#C5C6C7]">{detail.revocation.revocationId}</p>
              </div>
              <div>
                <span className="text-[#C5C6C7]/50">Revoked By</span>
                <p className="break-all font-mono text-[11px] text-[#C5C6C7]">{detail.revocation.revokedByActorId}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[#C5C6C7]/50">Reason</span>
                <p className="whitespace-pre-wrap font-mono text-xs text-[#C5C6C7]">{detail.revocation.revocationReason}</p>
              </div>
              <div>
                <span className="text-[#C5C6C7]/50">Revoked At</span>
                <p className="font-mono text-[11px] text-[#C5C6C7]">
                  {new Date(detail.revocation.revokedAtUtc).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-[#C5C6C7]/50">Governance Binding</span>
                <p className="break-all font-mono text-[11px] text-[#C5C6C7]">{detail.revocation.governanceBindingRef}</p>
              </div>
              <div>
                <span className="text-[#C5C6C7]/50">Correlation ID</span>
                <p className="break-all font-mono text-[11px] text-[#C5C6C7]">{detail.revocation.correlationId}</p>
              </div>
            </div>
          </PanelContent>
        </Panel>
      )}

      {/* Constitutional Status */}
      <ConstitutionalStatusPanel
        lifecyclePresentation={detail.lifecyclePresentation}
        constitutionalMode={detail.constitutionalMode}
        badges={detail.badges}
      />

      {/* Lifecycle Timeline */}
      <Panel>
        <PanelHeader>
          <PanelTitle>Lifecycle Timeline</PanelTitle>
        </PanelHeader>
        <PanelContent>
          <LifecycleTimeline entries={timelineEntries} />
        </PanelContent>
      </Panel>

      {/* Lineage References */}
      <LineageRefsPanel
        anchorReceiptRefs={detail.anchorReceiptRefs}
        lineageRefs={detail.lineageRefs}
        badges={detail.badges}
      />
    </div>
  );
}
