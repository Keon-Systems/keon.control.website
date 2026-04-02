/**
 * Keon Control — Focus State Reducer
 *
 * Pure function. No React imports. No side effects.
 * Single source of truth for all cockpit interaction state transitions.
 *
 * References:
 *   - Section 4.3: Reducer
 *   - Amendment 3: CenterMode resolution
 *   - Amendment 9: Selection epoch
 *   - Amendment 11: Selection invalidation
 */

import type { FocusState, FocusEvent, InspectionDepth } from "./types";
import {
  DEPTH_AVAILABILITY,
  MODE_SELECTION_COMPATIBILITY,
  DEFAULT_MODE_FOR_SELECTION,
  INITIAL_FOCUS_STATE,
  INITIAL_FILTER_CONTEXT,
} from "./types";

/**
 * The cockpit's nervous system.
 *
 * Every panel reads from this state.
 * Every panel writes to it through FocusEvent dispatch.
 * No side channels. No direct mutation.
 */
export function focusReducer(state: FocusState, event: FocusEvent): FocusState {
  switch (event.type) {
    case "SELECT": {
      const selection = event.payload;
      const maxDepth = DEPTH_AVAILABILITY[selection.anchorType];

      // Clamp current depth to what's available for this anchor type
      const clampedDepth: InspectionDepth = maxDepth.includes(state.inspectionDepth)
        ? state.inspectionDepth
        : "inspect";

      // Check if current center mode is compatible with new selection
      const compatibleKinds = MODE_SELECTION_COMPATIBILITY[state.centerMode];
      const compatible = compatibleKinds?.includes(selection.kind) ?? false;

      if (compatible) {
        // Stay in current mode, update selection
        return {
          ...state,
          selection,
          inspectionDepth: state.inspectionDepth === "scan" ? "inspect" : clampedDepth,
          selectionEpoch: state.selectionEpoch + 1,
          selectionInvalidReason: null,
        };
      }

      // Mode is incompatible — resolve to default mode for this selection kind
      const newMode = DEFAULT_MODE_FOR_SELECTION[selection.kind];
      const newStack = [state.centerMode, ...state.modeStack].slice(0, 3);

      return {
        ...state,
        selection,
        inspectionDepth: "inspect",
        centerMode: newMode,
        modeStack: newStack,
        selectionEpoch: state.selectionEpoch + 1,
        selectionInvalidReason: null,
      };
    }

    case "CLEAR_SELECTION": {
      return {
        ...state,
        selection: null,
        inspectionDepth: "scan",
        // Epoch does NOT reset — only goes up (Amendment 9)
        selectionInvalidReason: null,
      };
    }

    case "INVALIDATE_SELECTION": {
      // Amendment 11: explicit invalidation with reason
      return {
        ...state,
        selection: null,
        inspectionDepth: "scan",
        selectionInvalidReason: event.payload,
      };
    }

    case "SET_DEPTH": {
      const requestedDepth = event.payload;

      // If no selection, only scan is valid
      if (!state.selection) {
        return { ...state, inspectionDepth: "scan" };
      }

      // Check depth availability for current anchor type
      const available = DEPTH_AVAILABILITY[state.selection.anchorType];
      if (!available.includes(requestedDepth)) {
        // Depth not available for this anchor type — no-op
        return state;
      }

      return { ...state, inspectionDepth: requestedDepth };
    }

    case "SET_CENTER_MODE": {
      // Direct mode change (from ModeSelector). Clears mode stack.
      const newMode = event.payload;
      const selectionSurvives =
        state.selection !== null &&
        (MODE_SELECTION_COMPATIBILITY[newMode]?.includes(state.selection.kind) ?? false);

      return {
        ...state,
        centerMode: newMode,
        modeStack: [],
        selection: selectionSurvives ? state.selection : null,
        inspectionDepth: selectionSurvives ? state.inspectionDepth : "scan",
        selectionInvalidReason: null,
      };
    }

    case "POP_MODE": {
      if (state.modeStack.length === 0) {
        return {
          ...state,
          centerMode: "fleet",
          selection: null,
          inspectionDepth: "scan",
          selectionInvalidReason: null,
        };
      }

      const [previousMode, ...rest] = state.modeStack;
      const selectionSurvives =
        state.selection !== null &&
        (MODE_SELECTION_COMPATIBILITY[previousMode]?.includes(state.selection.kind) ?? false);

      return {
        ...state,
        centerMode: previousMode,
        modeStack: rest,
        selection: selectionSurvives ? state.selection : null,
        inspectionDepth: selectionSurvives ? state.inspectionDepth : "scan",
        selectionInvalidReason: null,
      };
    }

    case "SET_FILTER": {
      return {
        ...state,
        filterContext: { ...state.filterContext, ...event.payload },
      };
    }

    case "CLEAR_FILTERS": {
      return {
        ...state,
        filterContext: INITIAL_FILTER_CONTEXT,
      };
    }

    case "SET_TIME_CONTEXT": {
      return {
        ...state,
        timeContext: event.payload,
        // Selection survives time context change (validated at data layer)
      };
    }

    case "RESET": {
      return INITIAL_FOCUS_STATE;
    }

    default:
      return state;
  }
}

