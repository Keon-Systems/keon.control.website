"use client";

/**
 * Keon Control — Focus State Context Provider
 *
 * Shell-level state provider for all cockpit interaction state.
 * Wraps the focus reducer with React context and URL serialization.
 *
 * References:
 *   - Section 4.3: Reducer
 *   - Section 4.4: Context Provider
 *   - Section 4.7: URL Serialization
 *   - Safeguard 3: Mode thrash debounce
 */

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { focusReducer } from "./focus-reducer";
import type {
  FocusState,
  FocusEvent,
  Selection,
  InspectionDepth,
  CenterMode,
  FilterContext,
  TimeContext,
} from "./types";
import {
  INITIAL_FOCUS_STATE,
  MODE_ROUTE_MAP,
  ROUTE_MODE_MAP,
  DEPTH_AVAILABILITY,
  MIN_MODE_CHANGE_INTERVAL_MS,
} from "./types";

// ============================================================
// CONTEXT VALUE INTERFACE
// ============================================================

export interface FocusContextValue {
  state: FocusState;
  dispatch: React.Dispatch<FocusEvent>;

  // Convenience methods (thin wrappers around dispatch)
  select: (selection: Selection) => void;
  clearSelection: () => void;
  setDepth: (depth: InspectionDepth) => void;
  setCenterMode: (mode: CenterMode) => void;
  popMode: () => void;
  setFilter: (filter: Partial<FilterContext>) => void;
  clearFilters: () => void;
  setTimeContext: (ctx: TimeContext) => void;
  reset: () => void;

  // Derived state (computed, not stored)
  isSelectionActive: boolean;
  canVerify: boolean;
  canForensic: boolean;
  isDrawerOpen: boolean;
  isForensicOpen: boolean;
}

const FocusContext = React.createContext<FocusContextValue | null>(null);

// ============================================================
// PROVIDER
// ============================================================

export function FocusStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(focusReducer, INITIAL_FOCUS_STATE);
  const lastModeChangeRef = React.useRef<number>(0);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // --- URL → State hydration (on mount) ---
  React.useEffect(() => {
    const routeMode = ROUTE_MODE_MAP[pathname];
    if (routeMode && routeMode !== state.centerMode) {
      dispatch({ type: "SET_CENTER_MODE", payload: routeMode });
    }

    const selectedParam = searchParams.get("selected");
    if (selectedParam) {
      const [kind, ...idParts] = selectedParam.split(":");
      const id = idParts.join(":");
      if (kind && id) {
        dispatch({
          type: "SELECT",
          payload: {
            kind: kind as Selection["kind"],
            id,
            correlationId: null,
            source: "command-palette",
            anchorType: "anchored", // Default; will be corrected by data layer
          },
        });
      }
    }

    const depthParam = searchParams.get("depth") as InspectionDepth | null;
    if (depthParam) {
      dispatch({ type: "SET_DEPTH", payload: depthParam });
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- State → URL serialization ---
  React.useEffect(() => {
    const targetRoute = MODE_ROUTE_MAP[state.centerMode];
    const params = new URLSearchParams();

    if (state.selection) {
      params.set("selected", `${state.selection.kind}:${state.selection.id}`);
    }
    if (state.inspectionDepth !== "scan") {
      params.set("depth", state.inspectionDepth);
    }
    if (state.timeContext.mode === "historical" && state.timeContext.timestamp) {
      params.set("time", state.timeContext.timestamp);
    }

    const queryString = params.toString();
    const newUrl = queryString ? `${targetRoute}?${queryString}` : targetRoute;

    // Shallow push — no full navigation, just URL update
    if (pathname !== targetRoute || window.location.search !== `?${queryString}`) {
      router.replace(newUrl, { scroll: false });
    }
  }, [state.centerMode, state.selection, state.inspectionDepth, state.timeContext, pathname, router]);

  // --- Mode thrash debounce (Safeguard 3) ---
  const debouncedSetCenterMode = React.useCallback(
    (mode: CenterMode) => {
      const now = Date.now();
      if (now - lastModeChangeRef.current < MIN_MODE_CHANGE_INTERVAL_MS) {
        return; // Debounced — ignore rapid mode switch
      }
      lastModeChangeRef.current = now;
      dispatch({ type: "SET_CENTER_MODE", payload: mode });
    },
    [],
  );

  // --- Convenience methods ---
  const select = React.useCallback((s: Selection) => dispatch({ type: "SELECT", payload: s }), []);
  const clearSelection = React.useCallback(() => dispatch({ type: "CLEAR_SELECTION" }), []);
  const setDepth = React.useCallback((d: InspectionDepth) => dispatch({ type: "SET_DEPTH", payload: d }), []);
  const popMode = React.useCallback(() => dispatch({ type: "POP_MODE" }), []);
  const setFilter = React.useCallback((f: Partial<FilterContext>) => dispatch({ type: "SET_FILTER", payload: f }), []);
  const clearFilters = React.useCallback(() => dispatch({ type: "CLEAR_FILTERS" }), []);
  const setTimeContext = React.useCallback((t: TimeContext) => dispatch({ type: "SET_TIME_CONTEXT", payload: t }), []);
  const reset = React.useCallback(() => dispatch({ type: "RESET" }), []);

  // --- Derived state ---
  const isSelectionActive = state.selection !== null;

  const canVerify = isSelectionActive
    ? DEPTH_AVAILABILITY[state.selection!.anchorType].includes("verify")
    : false;

  const canForensic = isSelectionActive
    ? DEPTH_AVAILABILITY[state.selection!.anchorType].includes("forensic")
    : false;

  const isDrawerOpen = state.inspectionDepth === "verify";
  const isForensicOpen = state.inspectionDepth === "forensic";

  const value: FocusContextValue = React.useMemo(
    () => ({
      state,
      dispatch,
      select,
      clearSelection,
      setDepth,
      setCenterMode: debouncedSetCenterMode,
      popMode,
      setFilter,
      clearFilters,
      setTimeContext,
      reset,
      isSelectionActive,
      canVerify,
      canForensic,
      isDrawerOpen,
      isForensicOpen,
    }),
    [
      state,
      select,
      clearSelection,
      setDepth,
      debouncedSetCenterMode,
      popMode,
      setFilter,
      clearFilters,
      setTimeContext,
      reset,
      isSelectionActive,
      canVerify,
      canForensic,
      isDrawerOpen,
      isForensicOpen,
    ],
  );

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

/**
 * Raw context access. Prefer the typed hooks in use-focus.ts.
 */
export function useFocusContext(): FocusContextValue {
  const ctx = React.useContext(FocusContext);
  if (!ctx) {
    throw new Error("useFocusContext must be used within FocusStateProvider");
  }
  return ctx;
}

