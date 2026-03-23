"use client";

/**
 * Keon Control — Action Hooks
 *
 * Typed hooks for action state and permission checking.
 */

import { useMemo } from "react";
import { useActionContext } from "./action-context";
import { useGovernanceContext } from "./governance-context";
import type { ActionKind } from "./types";

/**
 * Full action state access.
 */
export function useActionState() {
  const { actionState, initiateAction, confirmAction, cancelAction } = useActionContext();
  return useMemo(
    () => ({
      ...actionState,
      initiateAction,
      confirmAction,
      cancelAction,
      isIdle: actionState.status === "idle",
      isPreviewing: actionState.status === "preview",
      isExecuting: actionState.status === "executing",
      isCompleted: actionState.status === "completed",
      isFailed: actionState.status === "failed",
      isActionInProgress: actionState.status !== "idle",
    }),
    [actionState, initiateAction, confirmAction, cancelAction],
  );
}

/**
 * Check if a specific action can be performed.
 * Considers oversight mode + authority + current action state.
 */
export function useCanPerformAction(actionKind: ActionKind): {
  permitted: boolean;
  reason: string | null;
} {
  const { actionState } = useActionContext();
  const { state: govState } = useGovernanceContext();

  return useMemo(() => {
    // Can't start a new action while one is in progress
    if (actionState.status !== "idle") {
      return {
        permitted: false,
        reason: `Another action is in progress: ${actionState.currentAction}`,
      };
    }

    // Locked mode = no actions
    if (govState.posture.oversightMode === "locked") {
      return { permitted: false, reason: "System is in LOCKED oversight mode" };
    }

    // Check if action is in permitted list
    if (!govState.authority.permittedActions.includes(actionKind)) {
      return {
        permitted: false,
        reason: `Action '${actionKind}' not permitted for role '${govState.authority.role}'`,
      };
    }

    // Restricted mode limits most actions
    if (govState.posture.oversightMode === "restricted") {
      const restrictedAllowed: ActionKind[] = ["acknowledge-alert", "declare-incident"];
      if (!restrictedAllowed.includes(actionKind)) {
        return {
          permitted: false,
          reason: `Action '${actionKind}' requires escalation in RESTRICTED mode`,
        };
      }
    }

    return { permitted: true, reason: null };
  }, [govState.posture.oversightMode, govState.authority, actionKind, actionState.status, actionState.currentAction]);
}

