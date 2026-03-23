"use client";

/**
 * Keon Control — Cockpit Real-Time Hook
 *
 * Subscribes to all cockpit-relevant real-time topics.
 * Converts raw events → cockpit-typed events.
 * Rate-limits to prevent UI flooding.
 * Respects selection epoch — never overwrites user focus.
 *
 * Consumers:
 *   - Command Horizon (pulse events)
 *   - Alerts Mode (streaming alert rows)
 *   - Executions Mode (status updates)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import type { RealtimeEvent } from "@/lib/realtime/types";
import type { CausalPulseEvent } from "@/lib/cockpit/types";
import type { AlertRow } from "@/lib/cockpit/adapters/alerts.adapter";
import {
  createEventRateLimiter,
  realtimeEventToAlertRow,
  realtimeEventToPulse,
} from "@/lib/cockpit/adapters/realtime.adapter";

// ============================================================
// HOOK OUTPUT
// ============================================================

export interface CockpitRealtimeState {
  /** Most recent causal pulse event from real-time stream */
  latestPulse: CausalPulseEvent | null;
  /** Buffer of streaming alert rows (newest first, max 20) */
  streamingAlerts: AlertRow[];
  /** Whether any real-time connection is active */
  isConnected: boolean;
}

const MAX_STREAMING_ALERTS = 20;

// ============================================================
// HOOK
// ============================================================

export function useCockpitRealtime(): CockpitRealtimeState {
  const [latestPulse, setLatestPulse] = useState<CausalPulseEvent | null>(null);
  const [streamingAlerts, setStreamingAlerts] = useState<AlertRow[]>([]);

  const rateLimiter = useMemo(() => createEventRateLimiter(10, 5_000), []);
  const alertDedupeRef = useRef(new Set<string>());

  const handleEvent = useCallback(
    (event: RealtimeEvent) => {
      if (!rateLimiter()) return;

      // Convert to pulse
      const pulse = realtimeEventToPulse(event);
      if (pulse) {
        setLatestPulse(pulse);
      }

      // Convert to alert row (if applicable)
      const alertRow = realtimeEventToAlertRow(event);
      if (alertRow && !alertDedupeRef.current.has(alertRow.alertId)) {
        alertDedupeRef.current.add(alertRow.alertId);
        // Keep dedupe set bounded
        if (alertDedupeRef.current.size > 100) {
          const entries = Array.from(alertDedupeRef.current);
          alertDedupeRef.current = new Set(entries.slice(-50));
        }
        setStreamingAlerts((prev) => [alertRow, ...prev].slice(0, MAX_STREAMING_ALERTS));
      }
    },
    [rateLimiter],
  );

  // Subscribe to alert topic
  const { status: alertStatus } = useRealtimeSubscription({
    topic: "alerts",
    onEvent: handleEvent,
  });

  // Subscribe to status topic
  useRealtimeSubscription({
    topic: "status",
    onEvent: handleEvent,
  });

  // Subscribe to incident events
  useRealtimeSubscription({
    topic: "incident-events",
    onEvent: handleEvent,
  });

  // Subscribe to trust score
  useRealtimeSubscription({
    topic: "incident-trust",
    onEvent: handleEvent,
  });

  const isConnected = alertStatus === "connected";

  // Clear stale alerts periodically (older than 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = Date.now() - 5 * 60 * 1000;
      setStreamingAlerts((prev) =>
        prev.filter((a) => new Date(a.firedAt).getTime() > cutoff),
      );
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  return { latestPulse, streamingAlerts, isConnected };
}

