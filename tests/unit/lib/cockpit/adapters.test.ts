/**
 * Keon Control — Cockpit Adapter Tests
 *
 * Pure unit tests for adapter normalization, freshness, epoch guards.
 * No React. No DOM. No network.
 */

import type { Alert } from "@/lib/api/types";
import {
    normalizeAlerts,
} from "@/lib/cockpit/adapters/alerts.adapter";
import {
    computeExecutionAnchorType,
} from "@/lib/cockpit/adapters/executions.adapter";
import {
    normalizeIncident,
    type RawIncident,
} from "@/lib/cockpit/adapters/incidents.adapter";
import {
    createEventRateLimiter,
    realtimeEventToAlertRow,
    realtimeEventToPulse,
} from "@/lib/cockpit/adapters/realtime.adapter";
import {
    computeFreshness,
    historicalUnavailable,
    isEpochValid,
    isHistoricalMode,
    safeCount,
    safeTimestamp,
    unknownFreshness,
} from "@/lib/cockpit/adapters/shared";
import type { TimeContext } from "@/lib/cockpit/types";
import type { RealtimeEvent } from "@/lib/realtime/types";
import { describe, expect, it } from "vitest";

// ============================================================
// SHARED UTILITIES
// ============================================================

describe("computeFreshness", () => {
  it("returns 'fresh' when data is recent", () => {
    const result = computeFreshness(new Date().toISOString(), 10_000);
    expect(result.state).toBe("fresh");
  });

  it("returns 'stale' when data is old", () => {
    const old = new Date(Date.now() - 60_000).toISOString();
    const result = computeFreshness(old, 10_000);
    expect(result.state).toBe("stale");
  });

  it("returns 'unknown' when fetchedAt is null", () => {
    const result = computeFreshness(null);
    expect(result.state).toBe("unknown");
  });
});

describe("unknownFreshness", () => {
  it("returns unknown state with default maxAge", () => {
    const result = unknownFreshness();
    expect(result.state).toBe("unknown");
    expect(result.expectedMaxAgeMs).toBe(10_000);
  });
});

describe("isEpochValid", () => {
  it("returns true when epochs match", () => {
    expect(isEpochValid(5, 5)).toBe(true);
  });

  it("returns false when epochs differ", () => {
    expect(isEpochValid(4, 5)).toBe(false);
  });
});

describe("safeTimestamp", () => {
  it("returns ISO string for valid input", () => {
    const ts = "2026-03-23T14:00:00.000Z";
    expect(safeTimestamp(ts)).toBe(ts);
  });

  it("returns current ISO for null", () => {
    const result = safeTimestamp(null);
    expect(new Date(result).getTime()).not.toBeNaN();
  });

  it("returns current ISO for garbage", () => {
    const result = safeTimestamp("not-a-date");
    expect(new Date(result).getTime()).not.toBeNaN();
  });
});

describe("safeCount", () => {
  it("returns 0 for null/undefined/NaN", () => {
    expect(safeCount(null)).toBe(0);
    expect(safeCount(undefined)).toBe(0);
    expect(safeCount(NaN)).toBe(0);
  });

  it("floors positive numbers", () => {
    expect(safeCount(3.7)).toBe(3);
  });

  it("clamps negatives to 0", () => {
    expect(safeCount(-5)).toBe(0);
  });
});

// ============================================================
// EXECUTION ANCHOR TYPE
// ============================================================

describe("computeExecutionAnchorType", () => {
  it("maps completed to anchored", () => {
    expect(computeExecutionAnchorType("completed")).toBe("anchored");
  });

  it("maps failed to anchored", () => {
    expect(computeExecutionAnchorType("failed")).toBe("anchored");
  });

  it("maps running to ephemeral", () => {
    expect(computeExecutionAnchorType("running")).toBe("ephemeral");
  });

  it("maps denied to derived", () => {
    expect(computeExecutionAnchorType("denied")).toBe("derived");
  });
});

// ============================================================
// INCIDENT NORMALIZER
// ============================================================

describe("normalizeIncident", () => {
  it("normalizes a raw incident", () => {
    const raw: RawIncident = {
      id: "inc_001", severity: "SEV1", title: "Test",
      status: "active", declaredAt: "2026-03-23T14:00:00.000Z",
      commander: "ops", affectedSystems: ["runtime"],
    };
    const result = normalizeIncident(raw);
    expect(result.incidentId).toBe("inc_001");
    expect(result.severity).toBe("sev1");
    expect(result.status).toBe("active");
    expect(result.commander).toBe("ops");
  });

  it("defaults commander to unknown", () => {
    const raw: RawIncident = {
      id: "inc_002", severity: "2", title: "Test",
      status: "closed", declaredAt: "2026-03-23T14:00:00.000Z",
    };
    const result = normalizeIncident(raw);
    expect(result.commander).toBe("unknown");
    expect(result.status).toBe("resolved");
    expect(result.severity).toBe("sev2");
  });
});

// ============================================================
// ALERTS NORMALIZER
// ============================================================

describe("normalizeAlerts", () => {
  it("normalizes API alerts to AlertRow[]", () => {
    const apiAlerts: Alert[] = [
      { id: "a1", severity: "critical", title: "Crit alert", message: "msg", timestamp: "2026-03-23T14:00:00.000Z", acknowledged: false, source: "cortex" },
      { id: "a2", severity: "warning", title: "Warn alert", message: "msg", timestamp: "2026-03-23T13:00:00.000Z", acknowledged: true, correlationId: "corr_1" },
    ];
    const rows = normalizeAlerts(apiAlerts);
    expect(rows).toHaveLength(2);
    expect(rows[0].severity).toBe("critical");
    expect(rows[0].alertId).toBe("a1");
    expect(rows[1].severity).toBe("medium");
    expect(rows[1].correlationId).toBe("corr_1");
  });

  it("maps error severity to high", () => {
    const apiAlerts: Alert[] = [
      { id: "a3", severity: "error", title: "Error alert", message: "msg", timestamp: "2026-03-23T14:00:00.000Z", acknowledged: false },
    ];
    const rows = normalizeAlerts(apiAlerts);
    expect(rows[0].severity).toBe("high");
  });

  it("maps info severity to low", () => {
    const apiAlerts: Alert[] = [
      { id: "a4", severity: "info", title: "Info alert", message: "msg", timestamp: "2026-03-23T14:00:00.000Z", acknowledged: true },
    ];
    const rows = normalizeAlerts(apiAlerts);
    expect(rows[0].severity).toBe("low");
  });
});


// ============================================================
// REALTIME ADAPTER
// ============================================================

describe("realtimeEventToPulse", () => {
  it("converts alert.created to CausalPulseEvent", () => {
    const event: RealtimeEvent = {
      type: "alert.created",
      payload: { id: "a1", title: "Test alert", message: "msg", severity: "error", timestamp: "2026-03-23T14:00:00.000Z" },
      timestamp: "2026-03-23T14:00:00.000Z",
    };
    const pulse = realtimeEventToPulse(event);
    expect(pulse).not.toBeNull();
    expect(pulse!.type).toBe("constraint-breached");
    expect(pulse!.severity).toBe("critical");
    expect(pulse!.entityRef?.kind).toBe("alert");
  });

  it("converts status.update to CausalPulseEvent", () => {
    const event: RealtimeEvent = {
      type: "status.update",
      payload: { key: "runtime", value: "healthy" },
      timestamp: "2026-03-23T14:00:00.000Z",
    };
    const pulse = realtimeEventToPulse(event);
    expect(pulse).not.toBeNull();
    expect(pulse!.type).toBe("system-recovered");
  });

  it("returns null for unknown event types", () => {
    const event: RealtimeEvent = {
      type: "unknown.event",
      payload: {},
      timestamp: "2026-03-23T14:00:00.000Z",
    };
    expect(realtimeEventToPulse(event)).toBeNull();
  });
});

describe("realtimeEventToAlertRow", () => {
  it("converts alert.created to AlertRow", () => {
    const event: RealtimeEvent = {
      type: "alert.created",
      payload: { id: "a1", title: "Test alert", message: "msg", severity: "warning", timestamp: "2026-03-23T14:00:00.000Z" },
      timestamp: "2026-03-23T14:00:00.000Z",
    };
    const row = realtimeEventToAlertRow(event);
    expect(row).not.toBeNull();
    expect(row!.alertId).toBe("a1");
    expect(row!.severity).toBe("medium");
    expect(row!.source).toBe("realtime");
  });

  it("returns null for non-alert events", () => {
    const event: RealtimeEvent = {
      type: "status.update",
      payload: { key: "test", value: 1 },
      timestamp: "2026-03-23T14:00:00.000Z",
    };
    expect(realtimeEventToAlertRow(event)).toBeNull();
  });
});

describe("createEventRateLimiter", () => {
  it("allows events within limit", () => {
    const limiter = createEventRateLimiter(3, 10_000);
    expect(limiter()).toBe(true);
    expect(limiter()).toBe(true);
    expect(limiter()).toBe(true);
  });

  it("blocks events beyond limit", () => {
    const limiter = createEventRateLimiter(2, 10_000);
    expect(limiter()).toBe(true);
    expect(limiter()).toBe(true);
    expect(limiter()).toBe(false);
  });
});

// ============================================================
// HISTORICAL MODE
// ============================================================

describe("isHistoricalMode", () => {
  it("returns false for live mode", () => {
    const ctx: TimeContext = { mode: "live", timestamp: null, window: null };
    expect(isHistoricalMode(ctx)).toBe(false);
  });

  it("returns true for historical mode", () => {
    const ctx: TimeContext = { mode: "historical", timestamp: "2026-01-01T00:00:00Z", window: null };
    expect(isHistoricalMode(ctx)).toBe(true);
  });
});

describe("historicalUnavailable", () => {
  it("returns unavailable marker with requested timestamp", () => {
    const ctx: TimeContext = { mode: "historical", timestamp: "2026-01-01T00:00:00Z", window: null };
    const result = historicalUnavailable(ctx);
    expect(result.available).toBe(false);
    expect(result.reason).toBe("backend-unsupported");
    expect(result.requestedTimestamp).toBe("2026-01-01T00:00:00Z");
  });
});