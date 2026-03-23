/**
 * Keon Control — Cockpit State Types
 *
 * Core type definitions for the constitutional cockpit.
 * Pure types and constants. No runtime code. No React imports.
 *
 * References:
 *   - Section 2: Core Interaction Model
 *   - Section 4: State Contracts
 *   - Amendments 1–13
 */

import type { HeatState } from "@/lib/contracts/collective";
import type { OperatorRole, PrivilegeLevel } from "@/lib/contracts/common";

// Re-export for convenience
export type { HeatState, OperatorRole, PrivilegeLevel };

// ============================================================
// SELECTION MODEL
// ============================================================

/**
 * Entity kinds that can be selected in the cockpit.
 * Maps 1:1 to domain entity types in lib/contracts/.
 */
export type SelectionKind =
  | "execution" // contracts/runs.ts
  | "receipt" // RHID-referenced receipts
  | "decision" // contracts/decisions.ts
  | "evidence-pack" // contracts/evidence.ts
  | "policy" // contracts/policies.ts
  | "alert" // contracts/incidents.ts (alert subset)
  | "incident" // contracts/incidents.ts
  | "agent" // fleet agents
  | "trace" // distributed traces
  | "chain-artifact" // contracts/collective.ts — ReformArtifact + chain nodes
  | "deliberation"; // contracts/collective.ts — DeliberationSession

/**
 * Anchor stability classification.
 * Determines what inspection depths are available.
 */
export type AnchorType =
  | "anchored" // Immutable: receipt, ledger entry, evidence pack, sealed execution
  | "ephemeral" // Mutable: in-flight execution, active incident
  | "derived"; // Computed: alert, anomaly, governance drift signal

/**
 * The selection primitive. Shell-owned. Single-entity focus.
 */
export interface Selection {
  /** What type of entity is selected */
  kind: SelectionKind;
  /** Unique identifier for the entity */
  id: string;
  /** Optional causal thread this entity belongs to */
  correlationId: string | null;
  /** Which panel initiated this selection */
  source: "center" | "left" | "right" | "horizon" | "command-palette";
  /** Stability classification (Amendment 1) */
  anchorType: AnchorType;
}

// ============================================================
// INSPECTION DEPTH
// ============================================================

/**
 * Progressive disclosure depth levels.
 * Each level reveals more detail without route change.
 */
export type InspectionDepth = "scan" | "inspect" | "verify" | "forensic";

/**
 * Depth availability rules based on anchor type.
 * Forensic requires anchored. Ephemeral caps at inspect.
 */
export const DEPTH_AVAILABILITY: Record<AnchorType, readonly InspectionDepth[]> = {
  anchored: ["scan", "inspect", "verify", "forensic"],
  ephemeral: ["scan", "inspect"],
  derived: ["scan", "inspect", "verify"],
} as const;

// ============================================================
// CENTER THEATER MODES
// ============================================================

/**
 * Execution theater view modes.
 * Each mode is a lens on governed activity, not a page.
 */
export type CenterMode =
  | "fleet"
  | "executions"
  | "traces"
  | "governance-receipts"
  | "governance-decisions"
  | "evidence"
  | "policies"
  | "alerts"
  | "incidents"
  | "collective-overview"
  | "collective-chain"
  | "collective-deliberations"
  | "collective-reforms";

/**
 * Which selection kinds each center mode can display.
 * Used for mode resolution on selection change (Amendment 3).
 */
export const MODE_SELECTION_COMPATIBILITY: Record<CenterMode, readonly SelectionKind[]> = {
  fleet: ["agent", "incident", "alert"],
  executions: ["execution", "receipt", "evidence-pack"],
  traces: ["trace", "execution"],
  "governance-receipts": ["receipt", "execution"],
  "governance-decisions": ["decision"],
  evidence: ["evidence-pack", "execution"],
  policies: ["policy"],
  alerts: ["alert", "execution"],
  incidents: ["incident"],
  "collective-overview": ["chain-artifact"],
  "collective-chain": ["chain-artifact"],
  "collective-deliberations": ["deliberation"],
  "collective-reforms": ["chain-artifact"],
} as const;

/**
 * Default center mode for each selection kind.
 * Used when current mode is incompatible with new selection.
 */
export const DEFAULT_MODE_FOR_SELECTION: Record<SelectionKind, CenterMode> = {
  execution: "executions",
  receipt: "governance-receipts",
  decision: "governance-decisions",
  "evidence-pack": "evidence",
  policy: "policies",
  alert: "alerts",
  incident: "incidents",
  agent: "fleet",
  trace: "traces",
  "chain-artifact": "collective-chain",
  deliberation: "collective-deliberations",
} as const;

// ============================================================
// TEMPORAL CONTEXT (Amendment 2)
// ============================================================

/**
 * Time anchoring for the cockpit.
 * Determines whether the operator sees live or historical state.
 */
export interface TimeContext {
  /** Live = current/streaming. Historical = point-in-time or window. */
  mode: "live" | "historical";
  /** Point-in-time anchor (ISO-8601). Only used in historical mode. */
  timestamp: string | null;
  /** Time window. Only used in historical mode for range queries. */
  window: { start: string; end: string } | null;
}

export const DEFAULT_TIME_CONTEXT: TimeContext = {
  mode: "live",
  timestamp: null,
  window: null,
} as const;

// ============================================================
// OVERSIGHT & GOVERNANCE
// ============================================================

/**
 * Oversight mode. Shapes interaction, not governance rigor.
 */
export type OversightMode = "autonomous" | "supervised" | "restricted" | "locked";

/**
 * Governance posture — the constitutional state of the system.
 * Derived from API data, not set by the operator.
 */
export interface GovernancePosture {
  oversightMode: OversightMode;
  determinismStatus: "SEALED" | "DEGRADED" | "UNKNOWN";
  sealValidation: "VALID" | "INVALID" | "UNKNOWN";
  incidentFlag: boolean;
  activePolicyCount: number;
  activePolicyProfile: string | null;
  lastPolicyChange: string | null;
  dataMode: "LIVE" | "MOCK";
}

/**
 * Operator authority — what the current operator is allowed to do.
 */
export interface OperatorAuthority {
  role: OperatorRole;
  privilegeLevel: PrivilegeLevel;
  permittedActions: ActionKind[];
  scopeBoundaries: {
    tenantIds: string[] | "all";
    subsystems: string[] | "all";
  };
}

// ============================================================
// HEAT SIGNAL (Amendment 7)
// ============================================================

export interface HeatDriver {
  type: "latency" | "retries" | "denials" | "escalation-proximity";
  /** 0-1 normalized intensity */
  intensity: number;
  /** Human-readable description */
  label: string;
}

export interface HeatSignal {
  level: HeatState;
  drivers: HeatDriver[];
}

// ============================================================
// TRUST SUMMARY (Amendment 8)
// ============================================================

export type TrustLevel =
  | "verified-sealed"
  | "fully-anchored"
  | "partial-evidence"
  | "missing-receipt"
  | "unverifiable";

export interface TrustSummary {
  level: TrustLevel;
  present: {
    decisionReceipt: boolean;
    outcomeReceipt: boolean;
    evidencePack: boolean;
    sealVerified: boolean;
    signaturesValid: boolean;
  };
  missing: string[];
}

// ============================================================
// GOVERNANCE DRIFT (Amendment 4)
// ============================================================

export type DriftKind =
  | "policy-drift"
  | "authority-mismatch"
  | "oversight-mode-shift"
  | "retrospective-constraint";

export interface GovernanceDrift {
  kind: DriftKind;
  severity: "info" | "warning" | "critical";
  message: string;
  ref: {
    type: "policy" | "authority" | "oversight-mode" | "constraint";
    id: string;
    atEntityTime: string;
    current: string;
  };
}

/**
 * Route path mapping for URL serialization.
 * Mode → route path for shareability.
 */
export const MODE_ROUTE_MAP: Record<CenterMode, string> = {
  fleet: "/",
  executions: "/runtime/executions",
  traces: "/observability/traces",
  "governance-receipts": "/governance/receipts",
  "governance-decisions": "/governance/decisions",
  evidence: "/evidence",
  policies: "/policies",
  alerts: "/alerts",
  incidents: "/incidents",
  "collective-overview": "/collective",
  "collective-chain": "/collective/chain",
  "collective-deliberations": "/collective/deliberations",
  "collective-reforms": "/collective/reforms",
} as const;

/**
 * Reverse mapping: route path → mode.
 */
export const ROUTE_MODE_MAP: Record<string, CenterMode> = Object.fromEntries(
  Object.entries(MODE_ROUTE_MAP).map(([mode, route]) => [route, mode as CenterMode]),
) as Record<string, CenterMode>;


// ============================================================
// CAUSAL PULSE (Amendment 6 + 13)
// ============================================================

export interface CausalPulseEvent {
  type:
    | "execution-denied"
    | "receipt-anchored"
    | "incident-escalated"
    | "oversight-changed"
    | "policy-updated"
    | "constraint-breached"
    | "seal-degraded"
    | "system-recovered";
  summary: string;
  timestamp: string;
  ageSeconds: number;
  severity: "info" | "warning" | "critical";
  entityRef: { kind: SelectionKind; id: string } | null;
}

// ============================================================
// GOVERNED ACTIONS (Amendment 5 + 12)
// ============================================================

export type ActionKind =
  | "declare-incident"
  | "escalate"
  | "override"
  | "acknowledge-alert"
  | "change-oversight-mode"
  | "initiate-deliberation"
  | "submit-decision";

export interface ActionPreview {
  actionKind: ActionKind;
  expectedReceiptType: string;
  authorityScope: {
    role: OperatorRole;
    privilegeLevel: PrivilegeLevel;
    policyClause: string | null;
  };
  causalImpact: string[];
  irreversible: boolean;
  permitted: boolean;
  denialReason: string | null;
}

export interface ActionExecutionState {
  status: "idle" | "preview" | "executing" | "completed" | "failed";
  currentAction: ActionKind | null;
  preview: ActionPreview | null;
  result: { receiptId: string; receiptHash: string } | null;
  error: string | null;
}

export const INITIAL_ACTION_STATE: ActionExecutionState = {
  status: "idle",
  currentAction: null,
  preview: null,
  result: null,
  error: null,
} as const;

// ============================================================
// DATA FRESHNESS (Amendment 10)
// ============================================================

export interface DataFreshness {
  state: "fresh" | "stale" | "unknown";
  lastUpdated: string;
  expectedMaxAgeMs: number;
}

// ============================================================
// SELECTION INVALID REASON (Amendment 11)
// ============================================================

export type SelectionInvalidReason =
  | "not-found"
  | "out-of-time-context"
  | "access-denied";

// ============================================================
// FILTER CONTEXT
// ============================================================

export interface FilterContext {
  timeRange: { start: string; end: string } | null;
  status: string[] | null;
  severity: string[] | null;
  agent: string | null;
  search: string | null;
}

export const INITIAL_FILTER_CONTEXT: FilterContext = {
  timeRange: null,
  status: null,
  severity: null,
  agent: null,
  search: null,
} as const;

// ============================================================
// FOCUS STATE — The Core State Machine
// ============================================================

export interface FocusState {
  /** Currently selected entity, or null */
  selection: Selection | null;
  /** Current inspection depth */
  inspectionDepth: InspectionDepth;
  /** Current center theater mode */
  centerMode: CenterMode;
  /** Mode stack for context-preserving transitions (max depth 3) */
  modeStack: CenterMode[];
  /** Active filters on the center theater */
  filterContext: FilterContext;
  /** Temporal anchoring (Amendment 2) */
  timeContext: TimeContext;
  /** Monotonically increasing selection counter (Amendment 9) */
  selectionEpoch: number;
  /** Why the selection was invalidated, if applicable (Amendment 11) */
  selectionInvalidReason: SelectionInvalidReason | null;
}

export const INITIAL_FOCUS_STATE: FocusState = {
  selection: null,
  inspectionDepth: "scan",
  centerMode: "fleet",
  modeStack: [],
  filterContext: INITIAL_FILTER_CONTEXT,
  timeContext: DEFAULT_TIME_CONTEXT,
  selectionEpoch: 0,
  selectionInvalidReason: null,
} as const;

/**
 * All state transitions flow through these events.
 * No direct state mutation. No panel-to-panel coupling.
 */
export type FocusEvent =
  | { type: "SELECT"; payload: Selection }
  | { type: "CLEAR_SELECTION" }
  | { type: "INVALIDATE_SELECTION"; payload: SelectionInvalidReason }
  | { type: "SET_DEPTH"; payload: InspectionDepth }
  | { type: "SET_CENTER_MODE"; payload: CenterMode }
  | { type: "POP_MODE" }
  | { type: "SET_FILTER"; payload: Partial<FilterContext> }
  | { type: "CLEAR_FILTERS" }
  | { type: "SET_TIME_CONTEXT"; payload: TimeContext }
  | { type: "RESET" };

// ============================================================
// GOVERNANCE STATE
// ============================================================

export interface GovernanceConstraint {
  id: string;
  name: string;
  type: "rate-limit" | "scope-restriction" | "escalation-gate" | "approval-required";
  description: string;
  active: boolean;
  /** Current proximity to threshold (0-1, where 1 = breached) */
  proximity: number | null;
}

export interface EscalationCondition {
  id: string;
  name: string;
  threshold: string;
  currentValue: string;
  /** How close to triggering (0-1) */
  proximity: number;
  /** Whether this condition is currently met */
  triggered: boolean;
}

export interface GovernanceState {
  posture: GovernancePosture;
  authority: OperatorAuthority;
  constraints: GovernanceConstraint[];
  escalationConditions: EscalationCondition[];
  isLoading: boolean;
  error: Error | null;
  lastRefresh: string | null;
}

export type GovernanceEvent =
  | { type: "SET_POSTURE"; payload: GovernancePosture }
  | { type: "SET_AUTHORITY"; payload: OperatorAuthority }
  | { type: "SET_CONSTRAINTS"; payload: GovernanceConstraint[] }
  | { type: "SET_ESCALATION_CONDITIONS"; payload: EscalationCondition[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: Error | null }
  | { type: "REFRESH_COMPLETE"; payload: { timestamp: string } };

/**
 * Selection-derived governance context.
 * Computed per-render, never stored.
 */
export interface SelectionGovernance {
  governingPolicy: {
    policyId: string;
    version: string;
    hash: string;
  } | null;
  governingAuthority: string | null;
  oversightModeAtCreation: OversightMode | null;
  drift: GovernanceDrift[];
}

// ============================================================
// KEYBOARD BINDINGS
// ============================================================

export const KEYBOARD_BINDINGS = {
  "Ctrl+K": "Open command palette",
  "Ctrl+/": "Toggle governance rail visibility",
  Escape: "Clear selection / decrease depth / close overlay (cascading)",
  j: "Next entity in theater list",
  k: "Previous entity in theater list",
  Enter: "Select highlighted entity (or confirm action)",
  v: "Toggle verify depth (Depth 3)",
  f: "Toggle forensic overlay (Depth 4)",
  "1": "Mode: fleet",
  "2": "Mode: executions",
  "3": "Mode: traces",
  "4": "Mode: governance-receipts",
  "5": "Mode: governance-decisions",
  "6": "Mode: evidence",
  "7": "Mode: policies",
  "8": "Mode: alerts",
  "9": "Mode: incidents",
  Backspace: "Pop mode stack (return to previous mode)",
  t: "Toggle live/historical time context",
} as const;

/**
 * Mode thrash debounce interval (Amendment — Safeguard 3).
 * Minimum milliseconds between mode changes.
 */
export const MIN_MODE_CHANGE_INTERVAL_MS = 150;