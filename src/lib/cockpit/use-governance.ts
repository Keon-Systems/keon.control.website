"use client";

/**
 * Keon Control — Governance State Hooks
 *
 * Typed hooks for consuming governance state.
 */

import { useMemo } from "react";
import { useGovernanceContext } from "./governance-context";
import type { OversightMode, OperatorAuthority, ActionKind } from "./types";

/**
 * Full governance state access.
 */
export function useGovernance() {
  const { state, refresh } = useGovernanceContext();
  return useMemo(() => ({ ...state, refresh }), [state, refresh]);
}

/**
 * Oversight mode only.
 */
export function useOversightMode(): OversightMode {
  const { state } = useGovernanceContext();
  return state.posture.oversightMode;
}

/**
 * Operator authority only.
 */
export function useOperatorAuthority(): OperatorAuthority {
  const { state } = useGovernanceContext();
  return state.authority;
}

/**
 * Check if the operator can perform a specific action.
 * Considers oversight mode + authority + action kind.
 */
export function useCanPerformAction(actionKind: ActionKind): {
  permitted: boolean;
  reason: string | null;
} {
  const { state } = useGovernanceContext();

  return useMemo(() => {
    // Locked mode = no actions
    if (state.posture.oversightMode === "locked") {
      return { permitted: false, reason: "System is in LOCKED oversight mode" };
    }

    // Check if action is in permitted list
    if (!state.authority.permittedActions.includes(actionKind)) {
      return {
        permitted: false,
        reason: `Action '${actionKind}' not permitted for role '${state.authority.role}'`,
      };
    }

    // Restricted mode limits most actions
    if (state.posture.oversightMode === "restricted") {
      const restrictedAllowed: ActionKind[] = ["acknowledge-alert", "declare-incident"];
      if (!restrictedAllowed.includes(actionKind)) {
        return {
          permitted: false,
          reason: `Action '${actionKind}' requires escalation in RESTRICTED mode`,
        };
      }
    }

    return { permitted: true, reason: null };
  }, [state.posture.oversightMode, state.authority, actionKind]);
}

