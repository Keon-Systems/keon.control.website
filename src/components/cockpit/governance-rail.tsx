"use client";

import { useTimeContext } from "@/lib/cockpit/use-focus";
import { useGovernance } from "@/lib/cockpit/use-governance";
import {
  AuthorityScope,
  ConstraintSummary,
  DeterminismSeal,
  EscalationConditions,
  GovernanceDriftSection,
  IncidentFlag,
  OversightModeSection,
  SelectionBinding,
} from "./governance";

export function GovernanceRail() {
  const { posture, authority, constraints, escalationConditions, isLoading } = useGovernance();
  const { isHistorical } = useTimeContext();

  return (
    <div className="flex w-64 shrink-0 flex-col overflow-hidden border-r border-[#1F2833]/60 bg-[#0B0C10]/95">
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-[#1F2833]/40 px-3">
        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#45A29E]/60">Policy Context</span>
        {isHistorical && <span className="text-[8px] font-mono uppercase text-amber-400/60">historical</span>}
        {isLoading && <span className="animate-pulse text-[8px] font-mono text-[#C5C6C7]/30">loading...</span>}
      </div>

      <div className="flex-1 overflow-y-auto">
        <OversightModeSection mode={posture.oversightMode} />
        <DeterminismSeal status={posture.determinismStatus} sealValidation={posture.sealValidation} />
        <IncidentFlag active={posture.incidentFlag} />
        <AuthorityScope authority={authority} />
        <ConstraintSummary constraints={constraints} />
        <EscalationConditions conditions={escalationConditions} />
        <SelectionBinding />
        <GovernanceDriftSection />

        <div className="mt-auto px-3 py-2">
          <div className="text-[9px] font-mono text-[#C5C6C7]/20">
            {posture.dataMode === "MOCK" ? "mock data" : "live"} · {posture.activePolicyCount} policies
            {posture.activePolicyProfile && ` · v${posture.activePolicyProfile}`}
          </div>
        </div>
      </div>
    </div>
  );
}
