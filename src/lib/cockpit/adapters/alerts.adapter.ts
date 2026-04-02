/**
 * Keon Control — Alerts Adapter
 *
 * Fetches real alert data and normalizes into the AlertRow shape
 * consumed by AlertsMode.
 *
 * Real source: GET /alerts (stub — backend not yet implemented)
 * Fallback: Dashboard activity events filtered to alert-like types
 * On failure: returns mock fallback with error metadata.
 */

import type { Alert } from "@/lib/api/types";
import { fetchWithFallback } from "./shared";

// ============================================================
// COCKPIT-FACING SHAPE (matches existing AlertRow)
// ============================================================

export interface AlertRow {
  alertId: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  source: string;
  firedAt: string;
  acknowledged: boolean;
  correlationId: string | null;
}

// ============================================================
// NORMALIZER
// ============================================================

function normalizeAlertSeverity(apiSeverity: Alert["severity"]): AlertRow["severity"] {
  switch (apiSeverity) {
    case "critical": return "critical";
    case "error": return "high";
    case "warning": return "medium";
    case "info": return "low";
    default: return "medium";
  }
}

function normalizeAlert(alert: Alert): AlertRow {
  return {
    alertId: alert.id,
    severity: normalizeAlertSeverity(alert.severity),
    title: alert.title,
    source: alert.source ?? "unknown",
    firedAt: alert.timestamp,
    acknowledged: alert.acknowledged,
    correlationId: alert.correlationId ?? null,
  };
}

// ============================================================
// MOCK FALLBACK
// ============================================================

const MOCK_ALERTS: AlertRow[] = [
  { alertId: "alert_crit_001", severity: "critical", title: "Override rate limit breached", source: "cortex", firedAt: "2026-03-23T14:50:00.000Z", acknowledged: false, correlationId: null },
  { alertId: "alert_high_001", severity: "high", title: "Agent budget threshold exceeded", source: "runtime", firedAt: "2026-03-23T14:30:00.000Z", acknowledged: false, correlationId: "t:budget-001" },
  { alertId: "alert_med_001", severity: "medium", title: "Policy evaluation latency spike", source: "collective", firedAt: "2026-03-23T13:00:00.000Z", acknowledged: true, correlationId: null },
  { alertId: "alert_low_001", severity: "low", title: "Seal validation queue depth", source: "ledger", firedAt: "2026-03-23T12:00:00.000Z", acknowledged: true, correlationId: null },
  { alertId: "alert_high_002", severity: "high", title: "Execution denied — missing authority", source: "runtime", firedAt: "2026-03-23T11:30:00.000Z", acknowledged: false, correlationId: "t:exec-denied-001" },
];

// ============================================================
// PUBLIC ADAPTER
// ============================================================

export async function fetchAlerts(): Promise<{
  rows: AlertRow[];
  source: "live" | "mock";
  error: string | null;
}> {
  const result = await fetchWithFallback(
    async () => {
      // Backend alerts endpoint is not yet implemented.
      // When it is, this will call: listAlerts({ limit: 50 })
      // For now, we throw to trigger mock fallback.
      throw new Error("Alerts API endpoint not yet implemented in backend");
    },
    MOCK_ALERTS,
  );

  return { rows: result.data, source: result.source, error: result.error };
}

/**
 * Normalize raw Alert[] from API into AlertRow[].
 * Exported for use when the alerts endpoint becomes available.
 */
export function normalizeAlerts(alerts: Alert[]): AlertRow[] {
  return alerts.map(normalizeAlert);
}

