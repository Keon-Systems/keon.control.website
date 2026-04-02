"use client";

/**
 * Keon Control — Governance State Context Provider
 *
 * Session-level governance state. Changes infrequently.
 * Shapes what the operator sees and what actions are available.
 *
 * References:
 *   - Section 4.4: Governance State
 *   - Section 5: Data Loading Contracts — Governance Rail
 */

import * as React from "react";
import { fetchGovernanceData } from "./adapters/governance.adapter";
import type {
    GovernanceEvent,
    GovernanceState
} from "./types";

// ============================================================
// REDUCER
// ============================================================

const INITIAL_GOVERNANCE_STATE: GovernanceState = {
  posture: {
    oversightMode: "supervised",
    determinismStatus: "UNKNOWN",
    sealValidation: "UNKNOWN",
    incidentFlag: false,
    activePolicyCount: 0,
    activePolicyProfile: null,
    lastPolicyChange: null,
    dataMode: "MOCK",
  },
  authority: {
    role: "readonly",
    privilegeLevel: "OPERATOR",
    permittedActions: [],
    scopeBoundaries: { tenantIds: [], subsystems: [] },
  },
  constraints: [],
  escalationConditions: [],
  isLoading: true,
  error: null,
  lastRefresh: null,
};

function governanceReducer(state: GovernanceState, event: GovernanceEvent): GovernanceState {
  switch (event.type) {
    case "SET_POSTURE":
      return { ...state, posture: event.payload };
    case "SET_AUTHORITY":
      return { ...state, authority: event.payload };
    case "SET_CONSTRAINTS":
      return { ...state, constraints: event.payload };
    case "SET_ESCALATION_CONDITIONS":
      return { ...state, escalationConditions: event.payload };
    case "SET_LOADING":
      return { ...state, isLoading: event.payload };
    case "SET_ERROR":
      return { ...state, error: event.payload };
    case "REFRESH_COMPLETE":
      return { ...state, isLoading: false, lastRefresh: event.payload.timestamp };
    default:
      return state;
  }
}

// ============================================================
// CONTEXT
// ============================================================

interface GovernanceContextValue {
  state: GovernanceState;
  dispatch: React.Dispatch<GovernanceEvent>;
  refresh: () => void;
}

const GovernanceContext = React.createContext<GovernanceContextValue | null>(null);

// ============================================================
// PROVIDER
// ============================================================

export function GovernanceStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(governanceReducer, INITIAL_GOVERNANCE_STATE);

  const refresh = React.useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const govData = await fetchGovernanceData();
      dispatch({ type: "SET_POSTURE", payload: govData.posture });
      dispatch({ type: "SET_AUTHORITY", payload: govData.authority });
      dispatch({ type: "SET_CONSTRAINTS", payload: govData.constraints });
      dispatch({ type: "SET_ESCALATION_CONDITIONS", payload: govData.escalationConditions });
      dispatch({ type: "REFRESH_COMPLETE", payload: { timestamp: new Date().toISOString() } });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err instanceof Error ? err : new Error("Governance fetch failed") });
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh every 30s (governance changes are infrequent)
  React.useEffect(() => {
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const value: GovernanceContextValue = React.useMemo(
    () => ({ state, dispatch, refresh }),
    [state, refresh],
  );

  return (
    <GovernanceContext.Provider value={value}>
      {children}
    </GovernanceContext.Provider>
  );
}

export function useGovernanceContext(): GovernanceContextValue {
  const ctx = React.useContext(GovernanceContext);
  if (!ctx) {
    throw new Error("useGovernanceContext must be used within GovernanceStateProvider");
  }
  return ctx;
}

