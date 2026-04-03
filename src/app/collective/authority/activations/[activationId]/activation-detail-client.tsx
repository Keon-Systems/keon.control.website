"use client";

import {
  ConstitutionalStatusPanel,
  LifecycleTimeline,
  LineageRefsPanel,
  ScopeDimensionGrid,
} from "@/components/collective";
import type { LifecycleTimelineEntry } from "@/components/collective";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { collectiveObservabilityQueryKeys } from "@/lib/collective/queryKeys";
import { createAuthorityActivationRepository } from "@/lib/collective/repositories";
import { toneToVariant } from "@/lib/collective/ui-bridge";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

const repo = createAuthorityActivationRepository();

interface ActivationDetailClientProps {
  readonly activationId: string;
}

export function ActivationDetailClient({ activationId }: ActivationDetailClientProps) {
  const {
    data: detail,
    isLoading: detailLoading,
    error: detailError,
  } = useQuery({
    queryKey: collectiveObservabilityQueryKeys.authorityActivations.detail(activationId),
    queryFn: () => repo.detail(activationId),
  });

  const {
    data: history,
    isLoading: historyLoading,
    error: historyError,
  } = useQuery({
    queryKey: collectiveObservabilityQueryKeys.authorityActivations.history(activationId),
    queryFn: () => repo.history(activationId),
  });

  const {
    data: lineage,
    isLoading: lineageLoading,
    error: lineageError,
  } = useQuery({
    queryKey: collectiveObservabilityQueryKeys.authorityActivations.lineage(activationId),
    queryFn: () => repo.lineage(activationId),
  });

  if (detailLoading || historyLoading || lineageLoading) {
    return <p className="p-6 text-[#C5C6C7]/50">Loading authority activation...</p>;
  }
  if (detailError || !detail) {
    return <p className="p-6 text-red-500">Failed to load authority activation</p>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Validation Rule Callout */}
      <Panel className="border-[#66FCF1]/30 shadow-[0_0_8px_rgba(102,252,241,0.1)]">
        <PanelContent>
          <p className="text-sm text-[#C5C6C7]">
            <span className="font-mono text-[#66FCF1]">Activation</span>
            {" \u2264 "}
            <Link
              href={`/collective/authority/permissions/${encodeURIComponent(detail.permissionGrantId)}`}
              className="font-mono text-[#66FCF1]/70 underline hover:text-[#66FCF1] transition-colors"
            >
              Permission
            </Link>
            {" \u2264 "}
            <Link
              href={`/collective/authority/delegations/${encodeURIComponent(detail.delegationGrantId)}`}
              className="font-mono text-[#66FCF1]/70 underline hover:text-[#66FCF1] transition-colors"
            >
              Delegation
            </Link>
          </p>
        </PanelContent>
      </Panel>

      {/* Activation Scope Dimensions */}
      <Panel>
        <PanelHeader>
          <PanelTitle>Activation Scope</PanelTitle>
        </PanelHeader>
        <PanelContent>
          <ScopeDimensionGrid
            fields={[
              { label: "Domain Scope", value: detail.domainScope },
              { label: "Policy Scope", value: detail.policyScope },
              { label: "Policy Version", value: detail.policyVersion },
              { label: "Authority Class", value: detail.authorityClass },
              { label: "Effect Class", value: detail.effectClass },
            ]}
          />
        </PanelContent>
      </Panel>

      {/* Action & Capability Categories */}
      <Panel>
        <PanelHeader>
          <PanelTitle>Categories</PanelTitle>
        </PanelHeader>
        <PanelContent>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
            <div>
              <span className="text-[#C5C6C7]/50">Action Categories</span>
              {detail.actionCategories.length === 0 ? (
                <p className="italic text-[#C5C6C7]/30">None</p>
              ) : (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {detail.actionCategories.map((cat) => (
                    <Badge key={cat} variant="neutral">{cat}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <span className="text-[#C5C6C7]/50">Capability Categories</span>
              {detail.capabilityCategories.length === 0 ? (
                <p className="italic text-[#C5C6C7]/30">None</p>
              ) : (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {detail.capabilityCategories.map((cat) => (
                    <Badge key={cat} variant="neutral">{cat}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </PanelContent>
      </Panel>

      {/* Permitted Authority Scope */}
      {detail.permittedAuthorityScope && (
        <Panel>
          <PanelHeader>
            <PanelTitle>Permitted Authority Scope</PanelTitle>
          </PanelHeader>
          <PanelContent>
            <ScopeDimensionGrid
              fields={[
                { label: "Domain Scope", value: detail.permittedAuthorityScope.domainScope },
                { label: "Policy Scope", value: detail.permittedAuthorityScope.policyScope },
                { label: "Policy Version", value: detail.permittedAuthorityScope.policyVersion },
                { label: "Authority Class", value: detail.permittedAuthorityScope.authorityClass },
                { label: "Effect Class", value: detail.permittedAuthorityScope.effectClass },
              ]}
            />
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
              <div>
                <span className="text-[#C5C6C7]/50">Action Categories</span>
                {detail.permittedAuthorityScope.actionCategories.length === 0 ? (
                  <p className="italic text-[#C5C6C7]/30">None</p>
                ) : (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {detail.permittedAuthorityScope.actionCategories.map((cat) => (
                      <Badge key={cat} variant="neutral">{cat}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <span className="text-[#C5C6C7]/50">Capability Categories</span>
                {detail.permittedAuthorityScope.capabilityCategories.length === 0 ? (
                  <p className="italic text-[#C5C6C7]/30">None</p>
                ) : (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {detail.permittedAuthorityScope.capabilityCategories.map((cat) => (
                      <Badge key={cat} variant="neutral">{cat}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </PanelContent>
        </Panel>
      )}

      {/* Delegated Authority Scope */}
      {detail.delegatedAuthorityScope && (
        <Panel>
          <PanelHeader>
            <PanelTitle>Delegated Authority Scope</PanelTitle>
          </PanelHeader>
          <PanelContent>
            <ScopeDimensionGrid
              fields={[
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
      <Panel>
        <PanelHeader>
          <PanelTitle>Constraint Statements</PanelTitle>
        </PanelHeader>
        <PanelContent>
          {detail.constraintStatements.length === 0 ? (
            <p className="text-xs italic text-[#C5C6C7]/30">No constraints recorded</p>
          ) : (
            <ul className="space-y-1.5">
              {detail.constraintStatements.map((stmt, idx) => (
                <li key={idx} className="font-mono text-xs text-[#C5C6C7]">
                  {stmt}
                </li>
              ))}
            </ul>
          )}
        </PanelContent>
      </Panel>

      {/* Disposition */}
      <Panel>
        <PanelHeader>
          <PanelTitle>Disposition</PanelTitle>
        </PanelHeader>
        <PanelContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant={toneToVariant(detail.disposition.kindPresentation.tone)}>
                      {detail.disposition.kindPresentation.label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span className="font-mono text-xs">raw: {detail.disposition.kindPresentation.raw}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div>
                <span className="text-[#C5C6C7]/50">Reason Code</span>
                <p className="font-mono text-[#C5C6C7]">{detail.disposition.reasonCode}</p>
              </div>
              <div>
                <span className="text-[#C5C6C7]/50">Actor</span>
                <p className="break-all font-mono text-[11px] text-[#C5C6C7]">{detail.disposition.actorId}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[#C5C6C7]/50">Rationale</span>
                <p className="whitespace-pre-wrap font-mono text-xs text-[#C5C6C7]">
                  {detail.disposition.rationale}
                </p>
              </div>
            </div>
          </div>
        </PanelContent>
      </Panel>

      {/* Termination (conditional) */}
      {detail.termination !== null && (
        <Panel className="border-yellow-500/30">
          <PanelHeader>
            <PanelTitle>Termination</PanelTitle>
          </PanelHeader>
          <PanelContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant={toneToVariant(detail.termination.terminalPresentation.tone)}>
                        {detail.termination.terminalPresentation.label}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span className="font-mono text-xs">
                        raw: {detail.termination.terminalPresentation.raw}
                      </span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-xs">
                <span className="text-[#C5C6C7]/50">Reason</span>
                <p className="whitespace-pre-wrap font-mono text-xs text-[#C5C6C7]">
                  {detail.termination.reason}
                </p>
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
          <PanelTitle>Lifecycle History</PanelTitle>
        </PanelHeader>
        <PanelContent>
          {historyError ? (
            <p className="text-xs text-red-500">Failed to load lifecycle history</p>
          ) : (
            <LifecycleTimeline
              entries={
                (history ?? []).map(
                  (entry): LifecycleTimelineEntry => ({
                    state: entry.lifecycleState,
                    statePresentation: entry.lifecyclePresentation,
                    timestamp: entry.recordedAtUtc,
                    reason: entry.rationale,
                  }),
                )
              }
            />
          )}
        </PanelContent>
      </Panel>

      {/* Lineage */}
      {lineageError ? (
        <p className="text-xs text-red-500">Failed to load lineage</p>
      ) : lineage ? (
        <LineageRefsPanel
          anchorReceiptRefs={lineage.anchorReceiptRefs}
          lineageRefs={lineage.lineageRefs}
          badges={lineage.badges}
        />
      ) : null}
    </div>
  );
}
