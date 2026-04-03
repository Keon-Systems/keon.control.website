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
import { createAgentPermissionRepository } from "@/lib/collective/repositories";
import { presentAgentPermissionStatus } from "@/lib/collective/normalization";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

const repo = createAgentPermissionRepository();

interface PermissionDetailClientProps {
  readonly grantId: string;
}

export function PermissionDetailClient({ grantId }: PermissionDetailClientProps) {
  const { data: detail, isLoading: detailLoading, error: detailError } = useQuery({
    queryKey: collectiveObservabilityQueryKeys.agentPermissions.detail(grantId),
    queryFn: () => repo.detail(grantId),
  });

  const { data: lineage, isLoading: lineageLoading } = useQuery({
    queryKey: collectiveObservabilityQueryKeys.agentPermissions.lineage(grantId),
    queryFn: () => repo.lineage(grantId),
  });

  if (detailLoading || lineageLoading) {
    return <p className="p-6 text-[#C5C6C7]/50">Loading agent permission grant...</p>;
  }
  if (detailError || !detail) {
    return <p className="p-6 text-red-500">Failed to load agent permission grant</p>;
  }

  /* ---- Scope Dimension Grid ---- */
  const scopeFields = [
    { label: "Domain Scope", value: detail.domainScope },
    { label: "Policy Scope", value: detail.policyScope },
    { label: "Policy Version", value: detail.policyVersion },
    { label: "Authority Class", value: detail.authorityClass },
    { label: "Effect Class", value: detail.effectClass },
  ];

  /* ---- Lifecycle Timeline ---- */
  const timelineEntries: LifecycleTimelineEntry[] = lineage
    ? lineage.transitions.map((t) => ({
        state: t.toStatus,
        statePresentation: presentAgentPermissionStatus(t.toStatus),
        timestamp: t.transitionedAtUtc,
        reason: t.reason,
      }))
    : [];

  return (
    <div className="space-y-6 p-6">
      {/* Permission Scope */}
      <Panel>
        <PanelHeader>
          <PanelTitle>Permission Scope</PanelTitle>
        </PanelHeader>
        <PanelContent>
          <ScopeDimensionGrid fields={scopeFields} />
        </PanelContent>
      </Panel>

      {/* Action & Capability Categories */}
      <Panel>
        <PanelHeader>
          <PanelTitle>Observed Categories</PanelTitle>
        </PanelHeader>
        <PanelContent>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
            <div>
              <span className="text-[#C5C6C7]/50">Action Categories</span>
              {detail.actionCategories.length > 0 ? (
                <ul className="mt-1 space-y-0.5">
                  {detail.actionCategories.map((cat) => (
                    <li key={cat} className="font-mono text-[11px] text-[#C5C6C7]">{cat}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 italic text-[#C5C6C7]/30 text-[11px]">None recorded</p>
              )}
            </div>
            <div>
              <span className="text-[#C5C6C7]/50">Capability Categories</span>
              {detail.capabilityCategories.length > 0 ? (
                <ul className="mt-1 space-y-0.5">
                  {detail.capabilityCategories.map((cat) => (
                    <li key={cat} className="font-mono text-[11px] text-[#C5C6C7]">{cat}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 italic text-[#C5C6C7]/30 text-[11px]">None recorded</p>
              )}
            </div>
          </div>
        </PanelContent>
      </Panel>

      {/* Delegated Authority Scope */}
      {detail.delegatedAuthorityScope !== null && (
        <Panel>
          <PanelHeader>
            <PanelTitle>Delegated Authority Scope</PanelTitle>
          </PanelHeader>
          <PanelContent>
            <ScopeDimensionGrid
              fields={[
                { label: "Tenant", value: detail.delegatedAuthorityScope.tenantId },
                { label: "Domain Scope", value: detail.delegatedAuthorityScope.domainScope },
                { label: "Policy Scope", value: detail.delegatedAuthorityScope.policyScope },
                { label: "Policy Version", value: detail.delegatedAuthorityScope.policyVersion },
                { label: "Authority Class", value: detail.delegatedAuthorityScope.authorityClass },
                { label: "Effect Class", value: detail.delegatedAuthorityScope.effectClass },
              ]}
            />
          </PanelContent>
        </Panel>
      )}

      {/* Constraint Statements */}
      {detail.constraintStatements.length > 0 && (
        <Panel>
          <PanelHeader>
            <PanelTitle>Constraint Statements</PanelTitle>
          </PanelHeader>
          <PanelContent>
            <ul className="space-y-1">
              {detail.constraintStatements.map((stmt, idx) => (
                <li key={idx} className="font-mono text-xs text-[#C5C6C7]">
                  {stmt}
                </li>
              ))}
            </ul>
          </PanelContent>
        </Panel>
      )}

      {/* Parent Delegation Link */}
      <Panel>
        <PanelHeader>
          <PanelTitle>Parent Delegation</PanelTitle>
        </PanelHeader>
        <PanelContent>
          <Link
            href={`/collective/authority/delegations/${encodeURIComponent(detail.delegationGrantId)}`}
            className="font-mono text-xs text-[#66FCF1] hover:underline"
          >
            {detail.delegationGrantId}
          </Link>
        </PanelContent>
      </Panel>

      {/* Revocation Record */}
      {detail.revocation !== null && (
        <Panel>
          <PanelHeader>
            <PanelTitle className="text-amber-400">Revocation Record</PanelTitle>
          </PanelHeader>
          <PanelContent>
            <div className="rounded border border-amber-500/30 bg-amber-500/5 p-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
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
                  <p className="font-mono text-xs text-[#C5C6C7]">{detail.revocation.revocationReason}</p>
                </div>
                <div>
                  <span className="text-[#C5C6C7]/50">Revoked At</span>
                  <p className="font-mono text-[11px] text-[#C5C6C7]">
                    {new Date(detail.revocation.revokedAtUtc).toLocaleString()}
                  </p>
                </div>
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
      {lineage && (
        <Panel>
          <PanelHeader>
            <PanelTitle>Lifecycle Timeline</PanelTitle>
          </PanelHeader>
          <PanelContent>
            <LifecycleTimeline entries={timelineEntries} />
          </PanelContent>
        </Panel>
      )}

      {/* Lineage Refs */}
      {lineage && (
        <LineageRefsPanel
          anchorReceiptRefs={lineage.anchorReceiptRefs}
          lineageRefs={lineage.lineageRefs}
          badges={lineage.badges}
        />
      )}
    </div>
  );
}
