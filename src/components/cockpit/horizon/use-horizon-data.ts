"use client";

/**
 * Command Horizon — Aggregated Data Hook
 *
 * One hook. One query key. All horizon data.
 * Freshness-aware. Real-data-first with mock fallback.
 *
 * Real sources (via command-horizon.adapter):
 *   - GET /v1/dashboard/health   → subsystem statuses
 *   - GET /v1/dashboard/summary  → counters
 *   - GET /v1/dashboard/activity → causal pulse
 *
 * On API failure: adapter returns mock data with source="mock".
 */

import { fetchCommandHorizonData } from "@/lib/cockpit/adapters/command-horizon.adapter";
import { unknownFreshness } from "@/lib/cockpit/adapters/shared";
import type { CausalPulseEvent, DataFreshness } from "@/lib/cockpit/types";
import { useCockpitRealtime } from "@/lib/cockpit/use-cockpit-realtime";
import { useCallback, useEffect, useState } from "react";

// ============================================================
// DATA SHAPE (unchanged — this IS the contract)
// ============================================================

export type SystemPostureLevel =
  | "healthy"
  | "degraded"
  | "constrained"
  | "hot"
  | "denied"
  | "recovering";

export interface SubsystemStatus {
  id: string;
  name: string;
  status: "up" | "degraded" | "down";
}

export interface HorizonCounters {
  anomalies: number;
  denials: number;
  degradedDeps: number;
}

export interface LedgerFreshnessData {
  lastIngestion: string;
  latencyMs: number;
  syncStatus: "synced" | "lagging" | "stale";
}

export interface CommandHorizonData {
  systemPosture: SystemPostureLevel;
  subsystems: SubsystemStatus[];
  counters: HorizonCounters;
  causalPulse: CausalPulseEvent | null;
  ledgerFreshness: LedgerFreshnessData;
  freshness: DataFreshness;
}

// ============================================================
// HOOK
// ============================================================

export function useCommandHorizonData(): CommandHorizonData {
  const [data, setData] = useState<CommandHorizonData>({
    systemPosture: "healthy",
    subsystems: [],
    counters: { anomalies: 0, denials: 0, degradedDeps: 0 },
    causalPulse: null,
    ledgerFreshness: {
      lastIngestion: new Date().toISOString(),
      latencyMs: 0,
      syncStatus: "synced",
    },
    freshness: unknownFreshness(),
  });

  // Real-time subscription — replaces mock pulse generator
  const { latestPulse } = useCockpitRealtime();

  // When real-time pulse arrives, inject it into horizon data
  useEffect(() => {
    if (latestPulse) {
      setData((prev) => ({ ...prev, causalPulse: latestPulse }));
    }
  }, [latestPulse]);

  const refresh = useCallback(async () => {
    try {
      const horizonData = await fetchCommandHorizonData();
      setData((prev) => ({
        ...horizonData,
        // Preserve causal pulse from real-time stream if adapter didn't provide one
        causalPulse: horizonData.causalPulse ?? prev.causalPulse,
      }));
    } catch {
      // Adapter already handles fallback — this is a safety net
      setData((prev) => ({
        ...prev,
        freshness: unknownFreshness(),
      }));
    }
  }, []);

  // Initial load + 10s refresh
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return data;
}

