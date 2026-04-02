/**
 * Keon Control — Command Horizon Adapter
 *
 * Fetches real data from dashboard endpoints and normalizes
 * into the CommandHorizonData shape consumed by the horizon hook.
 *
 * Real sources:
 *   - GET /v1/dashboard/health   → subsystem statuses
 *   - GET /v1/dashboard/summary  → counters (anomalies, denials, degraded)
 *   - GET /v1/dashboard/activity → causal pulse (most recent event)
 *
 * On failure: returns mock fallback with error metadata.
 */

import type {
    CommandHorizonData,
    HorizonCounters,
    LedgerFreshnessData,
    SubsystemStatus,
    SystemPostureLevel,
} from "@/components/cockpit/horizon/use-horizon-data";
import {
    getDashboardActivity,
    getDashboardHealth,
    getDashboardSummary,
} from "@/lib/api/control-plane";
import type { DashboardActivityItem, DashboardHealthItem, DashboardSummary } from "@/lib/api/types";
import type { CausalPulseEvent, SelectionKind } from "@/lib/cockpit/types";
import { computeFreshness, fetchWithFallback, safeCount } from "./shared";

// ============================================================
// MOCK FALLBACKS
// ============================================================

const MOCK_HEALTH_ITEMS: DashboardHealthItem[] = [
  { id: "runtime", name: "Runtime", status: "operational", lastChangeAt: new Date().toISOString() },
  { id: "cortex", name: "Cortex", status: "operational", lastChangeAt: new Date().toISOString() },
  { id: "collective", name: "Collective", status: "operational", lastChangeAt: new Date().toISOString() },
  { id: "ledger", name: "Ledger", status: "operational", lastChangeAt: new Date().toISOString() },
];

const MOCK_COUNTERS: HorizonCounters = { anomalies: 0, denials: 0, degradedDeps: 0 };

// ============================================================
// NORMALIZERS
// ============================================================

function normalizeSubsystemStatus(item: DashboardHealthItem): SubsystemStatus {
  let status: SubsystemStatus["status"] = "up";
  if (item.status === "degraded" || item.status === "impaired") status = "degraded";
  if (item.status === "critical" || item.status === "offline") status = "down";
  return { id: item.id, name: item.name, status };
}

function normalizeCounters(summary: DashboardSummary): HorizonCounters {
  return {
    anomalies: safeCount(summary.pendingDecisions),
    denials: 0, // backend does not yet expose denial count in summary
    degradedDeps: 0,
  };
}

function resolvePosture(subsystems: SubsystemStatus[], counters: HorizonCounters): SystemPostureLevel {
  const downCount = subsystems.filter((s) => s.status === "down").length;
  const degradedCount = subsystems.filter((s) => s.status === "degraded").length;
  if (downCount > 0) return "denied";
  if (counters.denials > 5) return "hot";
  if (degradedCount > 0 || counters.degradedDeps > 0) return "degraded";
  if (counters.anomalies > 3) return "constrained";
  return "healthy";
}

function activityToPulse(item: DashboardActivityItem): CausalPulseEvent {
  const typeMap: Record<string, CausalPulseEvent["type"]> = {
    "execution.denied": "execution-denied",
    "receipt.anchored": "receipt-anchored",
    "incident.escalated": "incident-escalated",
    "policy.updated": "policy-updated",
  };
  return {
    type: typeMap[item.eventType] ?? "receipt-anchored",
    summary: item.title || item.message || item.eventType,
    timestamp: item.timestamp,
    ageSeconds: Math.max(0, Math.floor((Date.now() - new Date(item.timestamp).getTime()) / 1000)),
    severity: "info",
    entityRef: item.subjectId ? { kind: "execution" as SelectionKind, id: item.subjectId } : null,
  };
}

// ============================================================
// PUBLIC ADAPTER
// ============================================================

export async function fetchCommandHorizonData(): Promise<CommandHorizonData> {
  const [healthResult, summaryResult, activityResult] = await Promise.all([
    fetchWithFallback(() => getDashboardHealth(), MOCK_HEALTH_ITEMS),
    fetchWithFallback(() => getDashboardSummary(), {
      activeExecutions: 0, pendingDecisions: 0, compliancePct24h: 100,
      receipts24h: 0, activeAgents: 0, avgLatencyMs: 0,
    } as DashboardSummary),
    fetchWithFallback(() => getDashboardActivity(5), [] as DashboardActivityItem[]),
  ]);

  const subsystems = healthResult.data.map(normalizeSubsystemStatus);
  const counters = normalizeCounters(summaryResult.data);
  const latestActivity = activityResult.data[0] ?? null;
  const causalPulse = latestActivity ? activityToPulse(latestActivity) : null;

  const freshness = computeFreshness(
    healthResult.source === "live" ? healthResult.fetchedAt : null,
  );

  const ledgerFreshness: LedgerFreshnessData = {
    lastIngestion: healthResult.fetchedAt,
    latencyMs: summaryResult.data.avgLatencyMs ?? 0,
    syncStatus: healthResult.source === "live" ? "synced" : "stale",
  };

  return {
    systemPosture: resolvePosture(subsystems, counters),
    subsystems,
    counters,
    causalPulse,
    ledgerFreshness,
    freshness,
  };
}

