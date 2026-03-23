/**
 * Keon Control — Cockpit Adapters Barrel Export
 *
 * All adapter functions and types for wiring real data into the cockpit.
 */

// Shared utilities
export {
    computeFreshness, fetchWithFallback,
    isEpochValid, safeCount, safeTimestamp, unknownFreshness
} from "./shared";
export type { AdapterResult } from "./shared";

// Command Horizon
export { fetchCommandHorizonData } from "./command-horizon.adapter";

// Executions
export { computeExecutionAnchorType, fetchExecutions } from "./executions.adapter";
export type { ExecutionRow } from "./executions.adapter";

// Alerts
export { fetchAlerts, normalizeAlerts } from "./alerts.adapter";
export type { AlertRow } from "./alerts.adapter";

// Incidents
export { fetchIncidents, normalizeIncident } from "./incidents.adapter";
export type { IncidentRow, RawIncident } from "./incidents.adapter";

// Real-time
export {
    createEventRateLimiter, realtimeEventToAlertRow, realtimeEventToPulse
} from "./realtime.adapter";

// Evidence
export { fetchEvidenceForSelection, fetchTrustVector } from "./evidence.adapter";

// Governance
export { fetchGovernanceData } from "./governance.adapter";

