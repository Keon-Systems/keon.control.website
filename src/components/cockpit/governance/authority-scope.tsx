"use client";

/**
 * Authority Scope — Who the operator is and what they can do.
 * Shows role, privilege level, permitted action count.
 */

import type { OperatorAuthority } from "@/lib/cockpit/types";

const PRIVILEGE_COLORS: Record<string, string> = {
  admin: "text-[#66FCF1]",
  operator: "text-[#45A29E]",
  viewer: "text-[#C5C6C7]/50",
  auditor: "text-amber-400",
};

interface AuthorityScopeProps {
  authority: OperatorAuthority;
}

export function AuthorityScope({ authority }: AuthorityScopeProps) {
  const privColor = PRIVILEGE_COLORS[authority.privilegeLevel] ?? "text-[#C5C6C7]/50";

  return (
    <div className="border-b border-[#1F2833]/20 px-3 py-2.5">
      <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#C5C6C7]/40 mb-1.5">
        Authority
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#C5C6C7]/60">Role</span>
          <span className="text-[10px] font-mono font-bold text-[#C5C6C7]/80">{authority.role}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#C5C6C7]/60">Privilege</span>
          <span className={`text-[10px] font-mono font-bold ${privColor}`}>{authority.privilegeLevel}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#C5C6C7]/60">Actions</span>
          <span className="text-[10px] font-mono text-[#C5C6C7]/50">{authority.permittedActions.length} permitted</span>
        </div>
      </div>
    </div>
  );
}

