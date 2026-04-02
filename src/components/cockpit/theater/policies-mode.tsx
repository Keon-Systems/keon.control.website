"use client";

/**
 * Policies Mode — Active and historical policy profiles.
 * Version, status, constraint count, enforcement scope.
 */

import { useFocusSelection, useSelectionActions } from "@/lib/cockpit/use-focus";
import { formatHash } from "@/lib/format";
import type { Selection } from "@/lib/cockpit/types";

interface PolicyRow {
  policyId: string;
  name: string;
  version: string;
  status: "active" | "staged" | "deprecated" | "archived";
  constraintCount: number;
  scope: string;
  hash: string;
}

const MOCK_POLICIES: PolicyRow[] = [
  { policyId: "pol_data_access", name: "Data Access Control", version: "v2.3.1", status: "active", constraintCount: 8, scope: "runtime", hash: "sha256:da1b2c3d" },
  { policyId: "pol_budget", name: "Budget Authorization", version: "v1.0.0", status: "active", constraintCount: 3, scope: "runtime", hash: "sha256:bu4e5f6g" },
  { policyId: "pol_meta_gov", name: "Meta-Governance", version: "v2.3.0", status: "active", constraintCount: 12, scope: "collective", hash: "sha256:mg7h8i9j" },
  { policyId: "pol_admin", name: "Admin Override", version: "v1.2.0", status: "active", constraintCount: 5, scope: "global", hash: "sha256:ao0k1l2m" },
  { policyId: "pol_incident", name: "Incident Protocol", version: "v1.0.0", status: "active", constraintCount: 7, scope: "global", hash: "sha256:ip3n4o5p" },
  { policyId: "pol_data_old", name: "Data Access Control", version: "v2.2.0", status: "deprecated", constraintCount: 6, scope: "runtime", hash: "sha256:do6q7r8s" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; heat: string }> = {
  active:     { label: "ACTIVE",     color: "text-[#66FCF1]", heat: "bg-[#66FCF1]" },
  staged:     { label: "STAGED",     color: "text-amber-400", heat: "bg-amber-400" },
  deprecated: { label: "DEPRECATED", color: "text-[#C5C6C7]/40", heat: "bg-[#C5C6C7]" },
  archived:   { label: "ARCHIVED",   color: "text-[#C5C6C7]/25", heat: "bg-[#C5C6C7]" },
};

export function PoliciesMode() {
  const { selection } = useFocusSelection();
  const { select } = useSelectionActions();

  const handleClick = (row: PolicyRow) => {
    const sel: Selection = {
      kind: "policy",
      id: row.policyId,
      correlationId: null,
      source: "center",
      anchorType: "anchored",
    };
    select(sel);
  };

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="flex shrink-0 border-b border-[#1F2833]/40 bg-[#0B0C10]">
        <div className="w-1 shrink-0" />
        <div className="flex-1 grid grid-cols-[2fr_0.8fr_0.8fr_0.5fr_1fr] gap-2 px-3 py-2">
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Policy</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Version</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Status</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Rules</span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#C5C6C7]/40">Scope</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {MOCK_POLICIES.map((row) => {
          const isSelected = selection?.id === row.policyId;
          const config = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.active;
          return (
            <button
              key={row.policyId + row.version}
              onClick={() => handleClick(row)}
              className={`flex w-full text-left border-b border-[#1F2833]/20 transition-colors ${isSelected ? "bg-[#1F2833]/50" : "hover:bg-[#1F2833]/20"}`}
            >
              <div className={`w-1 shrink-0 ${isSelected ? config.heat : config.heat + "/30"}`} />
              <div className="flex-1 grid grid-cols-[2fr_0.8fr_0.8fr_0.5fr_1fr] gap-2 px-3 py-2.5 items-center">
                <div className="min-w-0">
                  <div className="text-[11px] font-mono text-[#C5C6C7]/70 truncate">{row.name}</div>
                  <div className="text-[9px] font-mono text-[#C5C6C7]/25">{formatHash(row.hash)}</div>
                </div>
                <span className="text-[10px] font-mono text-[#45A29E]">{row.version}</span>
                <span className={`text-[10px] font-mono font-bold ${config.color}`}>{config.label}</span>
                <span className="text-[10px] font-mono text-[#C5C6C7]/40 tabular-nums">{row.constraintCount}</span>
                <span className="text-[10px] font-mono text-[#C5C6C7]/40">{row.scope}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

