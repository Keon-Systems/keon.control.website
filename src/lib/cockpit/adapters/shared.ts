/**
 * Keon Control — Cockpit Adapter Shared Utilities
 *
 * Freshness computation, error-safe fetch wrappers, mock fallback helpers.
 * Pure utilities. No React. No DOM.
 */

import type { DataFreshness } from "@/lib/cockpit/types";

// ============================================================
// FRESHNESS
// ============================================================

/**
 * Compute freshness state from a fetch timestamp.
 * If data is older than expectedMaxAgeMs, it's stale.
 */
export function computeFreshness(
  fetchedAt: string | null,
  expectedMaxAgeMs: number = 10_000,
): DataFreshness {
  if (!fetchedAt) {
    return { state: "unknown", lastUpdated: new Date().toISOString(), expectedMaxAgeMs };
  }

  const age = Date.now() - new Date(fetchedAt).getTime();
  const state = age > expectedMaxAgeMs ? "stale" : "fresh";

  return { state, lastUpdated: fetchedAt, expectedMaxAgeMs };
}

/**
 * Returns "unknown" freshness — used when data source is unavailable.
 */
export function unknownFreshness(expectedMaxAgeMs: number = 10_000): DataFreshness {
  return { state: "unknown", lastUpdated: new Date().toISOString(), expectedMaxAgeMs };
}

// ============================================================
// ERROR-SAFE FETCH
// ============================================================

export interface AdapterResult<T> {
  data: T;
  fetchedAt: string;
  source: "live" | "mock";
  error: string | null;
}

/**
 * Attempt a real API call. On failure, return mock data with error metadata.
 * This is the core adapter pattern — never throw into the cockpit UI.
 */
export async function fetchWithFallback<T>(
  fetchFn: () => Promise<T>,
  mockData: T,
): Promise<AdapterResult<T>> {
  try {
    const data = await fetchFn();
    return {
      data,
      fetchedAt: new Date().toISOString(),
      source: "live",
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown adapter error";
    return {
      data: mockData,
      fetchedAt: new Date().toISOString(),
      source: "mock",
      error: message,
    };
  }
}

// ============================================================
// EPOCH GUARD
// ============================================================

/**
 * Check if a response is still valid for the current selection epoch.
 * If the epoch has advanced since the fetch started, discard the result.
 */
export function isEpochValid(fetchEpoch: number, currentEpoch: number): boolean {
  return fetchEpoch === currentEpoch;
}

// ============================================================
// SAFE TIMESTAMP
// ============================================================

/**
 * Parse a timestamp string safely. Returns null if unparseable.
 */
export function safeTimestamp(value: string | undefined | null): string {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

/**
 * Clamp a number to a non-negative integer.
 */
export function safeCount(value: number | undefined | null): number {
  if (value == null || isNaN(value)) return 0;
  return Math.max(0, Math.floor(value));
}

// ============================================================
// HISTORICAL MODE
// ============================================================

import type { TimeContext } from "@/lib/cockpit/types";

/**
 * Check if the cockpit is in historical mode.
 * When historical, adapters must either:
 *   1. Pass timestamp/window to backend (if supported)
 *   2. Return an explicit "historical unavailable" response
 */
export function isHistoricalMode(timeContext: TimeContext): boolean {
  return timeContext.mode === "historical";
}

/**
 * Create an "unavailable" marker for historical queries
 * when the backend does not yet support time-range reads.
 */
export interface HistoricalUnavailable {
  readonly available: false;
  readonly reason: "backend-unsupported";
  readonly requestedTimestamp: string | null;
}

export function historicalUnavailable(timeContext: TimeContext): HistoricalUnavailable {
  return {
    available: false,
    reason: "backend-unsupported",
    requestedTimestamp: timeContext.timestamp,
  };
}

