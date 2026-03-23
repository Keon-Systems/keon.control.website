"use client";

/**
 * Keon Control — Focus State Hooks
 *
 * Typed hooks for consuming focus state.
 * Each hook returns a focused slice of state to minimize re-renders.
 *
 * References:
 *   - Section 4.4: Context Provider
 */

import { useMemo } from "react";
import { useFocusContext } from "./focus-context";
import type {
  Selection,
  InspectionDepth,
  CenterMode,
  FilterContext,
  TimeContext,
} from "./types";
import { DEPTH_AVAILABILITY } from "./types";

/**
 * Full focus state access. Use sparingly — prefer specific hooks below.
 */
export function useFocus() {
  return useFocusContext();
}

/**
 * Selection state only.
 * Returns selection + epoch + active flag.
 */
export function useFocusSelection() {
  const { state } = useFocusContext();
  return useMemo(
    () => ({
      selection: state.selection,
      selectionEpoch: state.selectionEpoch,
      isSelectionActive: state.selection !== null,
      selectionInvalidReason: state.selectionInvalidReason,
    }),
    [state.selection, state.selectionEpoch, state.selectionInvalidReason],
  );
}

/**
 * Inspection depth state.
 * Returns depth + availability flags + drawer/overlay state.
 */
export function useFocusDepth() {
  const { state } = useFocusContext();
  return useMemo(() => {
    const anchorType = state.selection?.anchorType;
    const available = anchorType ? DEPTH_AVAILABILITY[anchorType] : (["scan"] as readonly InspectionDepth[]);

    return {
      inspectionDepth: state.inspectionDepth,
      canVerify: available.includes("verify"),
      canForensic: available.includes("forensic"),
      isDrawerOpen: state.inspectionDepth === "verify",
      isForensicOpen: state.inspectionDepth === "forensic",
      availableDepths: available,
    };
  }, [state.inspectionDepth, state.selection?.anchorType]);
}

/**
 * Center mode state.
 * Returns mode + stack + navigation methods.
 */
export function useCenterMode() {
  const { state, setCenterMode, popMode } = useFocusContext();
  return useMemo(
    () => ({
      centerMode: state.centerMode,
      modeStack: state.modeStack,
      hasModeHistory: state.modeStack.length > 0,
      setCenterMode,
      popMode,
    }),
    [state.centerMode, state.modeStack, setCenterMode, popMode],
  );
}

/**
 * Filter context state.
 */
export function useFilterContext() {
  const { state, setFilter, clearFilters } = useFocusContext();
  return useMemo(
    () => ({
      filterContext: state.filterContext,
      hasActiveFilters: Object.values(state.filterContext).some((v) => v !== null),
      setFilter,
      clearFilters,
    }),
    [state.filterContext, setFilter, clearFilters],
  );
}

/**
 * Time context state.
 */
export function useTimeContext() {
  const { state, setTimeContext } = useFocusContext();
  return useMemo(
    () => ({
      timeContext: state.timeContext,
      isHistorical: state.timeContext.mode === "historical",
      isLive: state.timeContext.mode === "live",
      setTimeContext,
    }),
    [state.timeContext, setTimeContext],
  );
}

/**
 * Selection actions only (for panels that emit selection intents).
 * Does not subscribe to selection state — prevents unnecessary re-renders.
 */
export function useSelectionActions() {
  const { select, clearSelection, setDepth } = useFocusContext();
  return useMemo(
    () => ({ select, clearSelection, setDepth }),
    [select, clearSelection, setDepth],
  );
}

