/**
 * Keon Control — Cockpit State System
 *
 * Barrel export for all cockpit types, providers, and hooks.
 */

// Types & Constants
export type {
  SelectionKind,
  AnchorType,
  Selection,
  InspectionDepth,
  CenterMode,
  TimeContext,
  OversightMode,
  GovernancePosture,
  OperatorAuthority,
  HeatDriver,
  HeatSignal,
  TrustLevel,
  TrustSummary,
  DriftKind,
  GovernanceDrift,
  CausalPulseEvent,
  ActionKind,
  ActionPreview,
  ActionExecutionState,
  DataFreshness,
  SelectionInvalidReason,
  FilterContext,
  FocusState,
  FocusEvent,
  GovernanceConstraint,
  EscalationCondition,
  GovernanceState,
  GovernanceEvent,
  SelectionGovernance,
  HeatState,
  OperatorRole,
  PrivilegeLevel,
} from "./types";

export {
  DEPTH_AVAILABILITY,
  MODE_SELECTION_COMPATIBILITY,
  DEFAULT_MODE_FOR_SELECTION,
  MODE_ROUTE_MAP,
  ROUTE_MODE_MAP,
  DEFAULT_TIME_CONTEXT,
  INITIAL_FILTER_CONTEXT,
  INITIAL_FOCUS_STATE,
  INITIAL_ACTION_STATE,
  KEYBOARD_BINDINGS,
  MIN_MODE_CHANGE_INTERVAL_MS,
} from "./types";

// Providers
export { FocusStateProvider } from "./focus-context";
export { GovernanceStateProvider } from "./governance-context";
export { ActionStateProvider } from "./action-context";
export { CockpitProviders } from "./cockpit-providers";

// Reducer (for testing)
export { focusReducer } from "./focus-reducer";

// Hooks — Focus
export {
  useFocus,
  useFocusSelection,
  useFocusDepth,
  useCenterMode,
  useFilterContext,
  useTimeContext,
  useSelectionActions,
} from "./use-focus";

// Hooks — Governance
export {
  useGovernance,
  useOversightMode,
  useOperatorAuthority,
} from "./use-governance";

// Hooks — Selection Governance
export {
  useSelectionGovernance,
  useHasGovernanceDrift,
} from "./use-selection-governance";

// Hooks — Actions
export {
  useActionState,
  useCanPerformAction,
} from "./use-actions";

