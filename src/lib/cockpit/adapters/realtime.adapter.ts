/**
 * Keon Control — Cockpit Real-Time Adapter
 *
 * Bridges the existing realtime infrastructure (WebSocket + polling)
 * into cockpit-typed events: CausalPulseEvent, AlertRow updates,
 * execution status changes.
 *
 * Pure normalizers. No React. No DOM.
 */

import type { CausalPulseEvent, SelectionKind } from "@/lib/cockpit/types";
import type { AlertRow } from "./alerts.adapter";
import type {
  AlertPayload,
  IncidentEventPayload,
  RealtimeEvent,
  StatusPayload,
  TrustScorePayload,
} from "@/lib/realtime/types";

// ============================================================
// REALTIME → CAUSAL PULSE
// ============================================================

const ALERT_SEVERITY_MAP: Record<string, CausalPulseEvent["severity"]> = {
  error: "critical",
  warning: "warning",
  info: "info",
};

const ALERT_TYPE_MAP: Record<string, CausalPulseEvent["type"]> = {
  "alert.created": "constraint-breached",
  "alert.acknowledged": "system-recovered",
};

const INCIDENT_TYPE_MAP: Record<string, CausalPulseEvent["type"]> = {
  "incident.event": "incident-escalated",
};

/**
 * Convert any realtime event into a CausalPulseEvent.
 * Returns null if the event type is not pulse-worthy.
 */
export function realtimeEventToPulse(event: RealtimeEvent): CausalPulseEvent | null {
  const timestamp = event.timestamp ?? new Date().toISOString();
  const ageSeconds = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000));

  // Alert events
  if (event.type === "alert.created" || event.type === "alert.acknowledged") {
    const payload = event.payload as AlertPayload;
    return {
      type: ALERT_TYPE_MAP[event.type] ?? "constraint-breached",
      summary: payload?.title ?? event.type,
      timestamp,
      ageSeconds,
      severity: ALERT_SEVERITY_MAP[payload?.severity] ?? "info",
      entityRef: payload?.id ? { kind: "alert" as SelectionKind, id: payload.id } : null,
    };
  }

  // Incident events
  if (event.type === "incident.event") {
    const payload = event.payload as IncidentEventPayload;
    return {
      type: INCIDENT_TYPE_MAP[event.type] ?? "incident-escalated",
      summary: `${payload?.action ?? "Incident event"} — ${payload?.subsystem ?? "unknown"}`,
      timestamp,
      ageSeconds,
      severity: payload?.severity === "critical" ? "critical" : payload?.severity === "warning" ? "warning" : "info",
      entityRef: payload?.id ? { kind: "incident" as SelectionKind, id: payload.id } : null,
    };
  }

  // Status events
  if (event.type === "status.update") {
    const payload = event.payload as StatusPayload;
    return {
      type: "system-recovered",
      summary: `Status update: ${payload?.key ?? "unknown"} = ${payload?.value ?? "n/a"}`,
      timestamp,
      ageSeconds,
      severity: "info",
      entityRef: null,
    };
  }

  // Trust events
  if (event.type === "incident.trust") {
    const payload = event.payload as TrustScorePayload;
    const score = payload?.trustScore ?? 0;
    return {
      type: score < 90 ? "seal-degraded" : "system-recovered",
      summary: `Trust score: ${score.toFixed(1)}%`,
      timestamp,
      ageSeconds,
      severity: score < 80 ? "critical" : score < 95 ? "warning" : "info",
      entityRef: null,
    };
  }

  return null;
}

// ============================================================
// REALTIME → ALERT ROW (streaming append)
// ============================================================

/**
 * Convert a realtime alert event into an AlertRow for streaming into alerts mode.
 * Returns null if not an alert event.
 */
export function realtimeEventToAlertRow(event: RealtimeEvent): AlertRow | null {
  if (event.type !== "alert.created") return null;

  const payload = event.payload as AlertPayload;
  if (!payload?.id) return null;

  const severityMap: Record<string, AlertRow["severity"]> = {
    error: "high",
    warning: "medium",
    info: "low",
    critical: "critical",
  };

  return {
    alertId: payload.id,
    severity: severityMap[payload.severity] ?? "medium",
    title: payload.title ?? "Untitled alert",
    source: "realtime",
    firedAt: payload.timestamp ?? event.timestamp,
    acknowledged: payload.acknowledged ?? false,
    correlationId: null,
  };
}

// ============================================================
// RATE LIMITER (cockpit-side event throttle)
// ============================================================

/**
 * Creates a rate limiter that allows at most `maxPerWindow` events
 * within `windowMs` milliseconds. Returns true if the event should be processed.
 */
export function createEventRateLimiter(maxPerWindow: number = 10, windowMs: number = 5_000) {
  const timestamps: number[] = [];

  return function shouldProcess(): boolean {
    const now = Date.now();
    // Remove expired timestamps
    while (timestamps.length > 0 && timestamps[0] < now - windowMs) {
      timestamps.shift();
    }
    if (timestamps.length >= maxPerWindow) return false;
    timestamps.push(now);
    return true;
  };
}

