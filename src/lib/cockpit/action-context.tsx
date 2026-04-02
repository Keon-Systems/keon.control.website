"use client";

/**
 * Keon Control — Action Execution State Context
 *
 * Manages the lifecycle of governed actions:
 *   idle → preview → executing → completed | failed
 *
 * Every action produces a receipt. No exceptions.
 *
 * References:
 *   - Section 2.6: Lawful Action Entry Points
 *   - Amendment 5: Pre-Action Receipt Preview
 *   - Amendment 12: Action Execution State
 */

import * as React from "react";
import { useFocusContext } from "./focus-context";
import { useGovernanceContext } from "./governance-context";
import type {
  ActionKind,
  ActionPreview,
  ActionExecutionState,
  Selection,
} from "./types";
import { INITIAL_ACTION_STATE } from "./types";

// ============================================================
// CONTEXT
// ============================================================

interface ActionContextValue {
  actionState: ActionExecutionState;
  /** Begin action flow — computes preview, shows receipt shape */
  initiateAction: (kind: ActionKind, targetSelection: Selection | null) => void;
  /** Confirm and execute the previewed action */
  confirmAction: () => Promise<void>;
  /** Cancel the action — return to idle */
  cancelAction: () => void;
}

const ActionContext = React.createContext<ActionContextValue | null>(null);

// ============================================================
// RECEIPT TYPE MAPPING
// ============================================================

const ACTION_RECEIPT_TYPES: Record<ActionKind, string> = {
  "declare-incident": "IncidentDeclarationReceipt",
  escalate: "EscalationReceipt",
  override: "OverrideReceipt",
  "acknowledge-alert": "AlertAcknowledgmentReceipt",
  "change-oversight-mode": "OversightModeChangeReceipt",
  "initiate-deliberation": "DeliberationInitiationReceipt",
  "submit-decision": "DecisionReceipt",
};

// ============================================================
// PROVIDER
// ============================================================

export function ActionStateProvider({ children }: { children: React.ReactNode }) {
  const [actionState, setActionState] = React.useState<ActionExecutionState>(INITIAL_ACTION_STATE);
  const { select } = useFocusContext();
  const { state: govState } = useGovernanceContext();

  const initiateAction = React.useCallback(
    (kind: ActionKind, targetSelection: Selection | null) => {
      // Compute preview (Amendment 5)
      const permitted = govState.authority.permittedActions.includes(kind);
      const lockedOut = govState.posture.oversightMode === "locked";

      const preview: ActionPreview = {
        actionKind: kind,
        expectedReceiptType: ACTION_RECEIPT_TYPES[kind],
        authorityScope: {
          role: govState.authority.role,
          privilegeLevel: govState.authority.privilegeLevel,
          policyClause: null, // Populated by API in production
        },
        causalImpact: computeCausalImpact(kind, targetSelection),
        irreversible: true, // All governed actions produce immutable receipts
        permitted: permitted && !lockedOut,
        denialReason: lockedOut
          ? "System is in LOCKED oversight mode — no actions permitted"
          : !permitted
            ? `Action '${kind}' not permitted for role '${govState.authority.role}'`
            : null,
      };

      setActionState({
        status: "preview",
        currentAction: kind,
        preview,
        result: null,
        error: null,
      });
    },
    [govState],
  );

  const confirmAction = React.useCallback(async () => {
    if (actionState.status !== "preview" || !actionState.preview?.permitted) {
      return;
    }

    setActionState((prev) => ({ ...prev, status: "executing" }));

    try {
      // In production, this calls the appropriate API endpoint.
      // For now, simulate with a delay.
      await new Promise((resolve) => setTimeout(resolve, 500));

      const result = {
        receiptId: `receipt_${Date.now()}`,
        receiptHash: `sha256:${"0".repeat(64)}`, // Placeholder
      };

      setActionState((prev) => ({
        ...prev,
        status: "completed",
        result,
      }));

      // Auto-select the new receipt in the evidence rail
      select({
        kind: "receipt",
        id: result.receiptId,
        correlationId: null,
        source: "center",
        anchorType: "anchored",
      });
    } catch (err) {
      setActionState((prev) => ({
        ...prev,
        status: "failed",
        error: err instanceof Error ? err.message : "Action execution failed",
      }));
    }
  }, [actionState, select]);

  const cancelAction = React.useCallback(() => {
    setActionState(INITIAL_ACTION_STATE);
  }, []);

  const value: ActionContextValue = React.useMemo(
    () => ({ actionState, initiateAction, confirmAction, cancelAction }),
    [actionState, initiateAction, confirmAction, cancelAction],
  );

  return (
    <ActionContext.Provider value={value}>
      {children}
    </ActionContext.Provider>
  );
}

export function useActionContext(): ActionContextValue {
  const ctx = React.useContext(ActionContext);
  if (!ctx) {
    throw new Error("useActionContext must be used within ActionStateProvider");
  }
  return ctx;
}

// ============================================================
// HELPERS
// ============================================================

function computeCausalImpact(kind: ActionKind, target: Selection | null): string[] {
  const impacts: string[] = [];

  switch (kind) {
    case "declare-incident":
      impacts.push("Incident mode will activate");
      impacts.push("All operators will be notified");
      impacts.push("Oversight mode may escalate");
      break;
    case "override":
      if (target) {
        impacts.push(`Execution '${target.id}' will be re-enabled under override authority`);
      }
      impacts.push("Override receipt will be permanently recorded");
      break;
    case "escalate":
      if (target) {
        impacts.push(`Entity '${target.id}' will be escalated to higher authority`);
      }
      break;
    case "change-oversight-mode":
      impacts.push("All active constraints will be re-evaluated");
      impacts.push("Action availability will change system-wide");
      break;
    case "acknowledge-alert":
      impacts.push("Alert acknowledgment will be recorded");
      break;
    case "submit-decision":
      impacts.push("Decision will be finalized and sealed");
      impacts.push("Evidence pack will be generated");
      break;
    case "initiate-deliberation":
      impacts.push("New deliberation session will be created");
      break;
  }

  return impacts;
}

