"use client";

import {
  ConstitutionalStatusPanel,
  LineageRefsPanel,
  ScopeDimensionGrid,
} from "@/components/collective";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { collectiveObservabilityQueryKeys } from "@/lib/collective/queryKeys";
import { createPreparedEffectRepository } from "@/lib/collective/repositories";
import { toneToVariant } from "@/lib/collective/ui-bridge";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

const repo = createPreparedEffectRepository();

interface PreparedEffectDetailClientProps {
  readonly preparedRequestId: string;
}

export function PreparedEffectDetailClient({ preparedRequestId }: PreparedEffectDetailClientProps) {
  const { data: detail, isLoading: detailLoading, error: detailError } = useQuery({
    queryKey: collectiveObservabilityQueryKeys.preparedEffects.detail(preparedRequestId),
    queryFn: () => repo.detail(preparedRequestId),
  });

  const { data: lineage, isLoading: lineageLoading } = useQuery({
    queryKey: collectiveObservabilityQueryKeys.preparedEffects.lineage(preparedRequestId),
    queryFn: () => repo.lineage(preparedRequestId),
  });

  if (detailLoading || lineageLoading) {
    return <p className="p-6 text-[#C5C6C7]/50">Loading prepared effect request...</p>;
  }
  if (detailError || !detail) {
    return <p className="p-6 text-red-500">Failed to load prepared effect request</p>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* INERT CALLOUT BANNER */}
      <div className="rounded border border-yellow-500/50 bg-yellow-500/5 p-4">
        <div className="flex items-center gap-3">
          <Badge variant="offline">INERT</Badge>
          <span className="font-mono text-sm font-semibold text-yellow-400">
            PREPARATION ONLY — No Execution Authority
          </span>
        </div>
        <p className="mt-2 font-mono text-xs text-yellow-400/70">
          This effect is staged for observation. It does not carry execution authority.
          All data on this page is recorded state — no action is possible from this view.
        </p>
      </div>

      {/* Authority Chain */}
      <Panel>
        <PanelHeader>
          <PanelTitle>Authority Chain</PanelTitle>
        </PanelHeader>
        <PanelContent>
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#C5C6C7]/50 w-24 shrink-0">Delegation</span>
              <Link
                href={`/collective/authority/delegations/${encodeURIComponent(detail.delegationGrantId)}`}
                className="font-mono text-[11px] text-[#66FCF1] hover:underline break-all"
              >
                {detail.delegationGrantId}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#C5C6C7]/50 w-24 shrink-0">Permission</span>
              <Link
                href={`/collective/authority/permissions/${encodeURIComponent(detail.permissionGrantId)}`}
                className="font-mono text-[11px] text-[#66FCF1] hover:underline break-all"
              >
                {detail.permissionGrantId}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#C5C6C7]/50 w-24 shrink-0">Activation</span>
              <Link
                href={`/collective/authority/activations/${encodeURIComponent(detail.activationId)}`}
                className="font-mono text-[11px] text-[#66FCF1] hover:underline break-all"
              >
                {detail.activationId}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#C5C6C7]/50 w-24 shrink-0">This</span>
              <span className="font-mono text-[11px] text-[#C5C6C7]">
                {detail.preparedRequestId}
              </span>
            </div>
          </div>
        </PanelContent>
      </Panel>

      {/* Activated Scope */}
      <Panel>
        <PanelHeader>
          <PanelTitle>Activated Scope</PanelTitle>
        </PanelHeader>
        <PanelContent>
          <ScopeDimensionGrid
            fields={[
              { label: "Tenant", value: detail.activatedScope.tenantId },
              { label: "Domain Scope", value: detail.activatedScope.domainScope },
              { label: "Policy Scope", value: detail.activatedScope.policyScope },
              { label: "Policy Version", value: detail.activatedScope.policyVersion },
              { label: "Authority Class", value: detail.activatedScope.authorityClass },
              { label: "Effect Class", value: detail.activatedScope.effectClass },
            ]}
          />
        </PanelContent>
      </Panel>

      {/* Constraint Statements */}
      {detail.constraintStatements.length > 0 && (
        <Panel>
          <PanelHeader>
            <PanelTitle>Constraint Statements</PanelTitle>
          </PanelHeader>
          <PanelContent>
            <ul className="space-y-1.5">
              {detail.constraintStatements.map((statement, idx) => (
                <li key={idx} className="font-mono text-xs text-[#C5C6C7]">
                  {statement}
                </li>
              ))}
            </ul>
          </PanelContent>
        </Panel>
      )}

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
                <span className="text-[#C5C6C7]/50">Recorded</span>
                <p className="font-mono text-[11px] text-[#C5C6C7]">
                  {new Date(detail.disposition.recordedAtUtc).toLocaleString()}
                </p>
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

      {/* Terminal (if present) */}
      {detail.terminal !== null && (
        <Panel>
          <PanelHeader>
            <PanelTitle>Terminal State</PanelTitle>
          </PanelHeader>
          <PanelContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant={toneToVariant(detail.terminal.terminalPresentation.tone)}>
                        {detail.terminal.terminalPresentation.label}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span className="font-mono text-xs">raw: {detail.terminal.terminalPresentation.raw}</span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div className="col-span-2">
                  <span className="text-[#C5C6C7]/50">Reason</span>
                  <p className="whitespace-pre-wrap font-mono text-xs text-[#C5C6C7]">
                    {detail.terminal.reason}
                  </p>
                </div>
                <div>
                  <span className="text-[#C5C6C7]/50">Recorded</span>
                  <p className="font-mono text-[11px] text-[#C5C6C7]">
                    {new Date(detail.terminal.recordedAtUtc).toLocaleString()}
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
        dispositionPresentation={detail.dispositionPresentation}
        constitutionalMode={detail.constitutionalMode}
        badges={detail.badges}
      />

      {/* Lineage */}
      <LineageRefsPanel
        anchorReceiptRefs={lineage?.anchorReceiptRefs ?? detail.anchorReceiptRefs}
        lineageRefs={lineage?.lineageRefs ?? detail.lineageRefs}
        badges={lineage?.badges ?? detail.badges}
      />
    </div>
  );
}
