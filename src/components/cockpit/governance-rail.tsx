"use client";

/**
 * Governance Rail — Zone 2 (Left)
 *
 * w-64. Scrollable. Shows the laws binding reality.
 * Not informational. Authoritative.
 *
 * Order (top → bottom):
 *   1. Oversight Mode (dominant)
 *   2. Determinism Seal
 *   3. Incident Flag (if active)
 *   4. Authority Scope
 *   5. Constraint Summary
 *   6. Escalation Conditions
 *   --- selection layer (if active) ---
 *   7. Selection Governance Binding
 *   8. Governance Drift (if present)
 *
 * Rules:
 *   - NEVER mutates state. Read-only.
 *   - Global governance stays visible when selection active.
 *   - Selection-specific governance layers below, never replaces.
 *   - Historical mode reflects policy at that time.
 */

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
    <div className="flex w-64 shrink-0 flex-col border-r border-[#1F2833]/60 bg-[#0B0C10]/95 overflow-hidden">
      {/* Zone Label */}
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-[#1F2833]/40 px-3">
        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#45A29E]/60">
          Governance
        </span>
        {isHistorical && (
          <span className="text-[8px] font-mono text-amber-400/60 uppercase">
            historical
          </span>
        )}
        {isLoading && (
          <span className="text-[8px] font-mono text-[#C5C6C7]/30 animate-pulse">
            loading…
          </span>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* === GLOBAL GOVERNANCE (always visible) === */}

        {/* 1. Oversight Mode — dominant */}
        <OversightModeSection mode={posture.oversightMode} />

        {/* 2. Determinism Seal */}
        <DeterminismSeal
          status={posture.determinismStatus}
          sealValidation={posture.sealValidation}
        />

        {/* 3. Incident Flag */}
        <IncidentFlag active={posture.incidentFlag} />

        {/* 4. Authority Scope */}
        <AuthorityScope authority={authority} />

        {/* 5. Constraint Summary */}
        <ConstraintSummary constraints={constraints} />

        {/* 6. Escalation Conditions */}
        <EscalationConditions conditions={escalationConditions} />

        {/* === SELECTION LAYER (only when entity selected) === */}

        {/* 7. Selection Governance Binding */}
        <SelectionBinding />

        {/* 8. Governance Drift */}
        <GovernanceDriftSection />

        {/* Data Mode Footer */}
        <div className="px-3 py-2 mt-auto">
          <div className="text-[9px] font-mono text-[#C5C6C7]/20">
            {posture.dataMode === "MOCK" ? "mock data" : "live"} · {posture.activePolicyCount} policies
            {posture.activePolicyProfile && ` · v${posture.activePolicyProfile}`}
          </div>
        </div>
      </div>
    </div>
  );
}

