/**
 * ============================================================
 * DEMO DATA ONLY — Collective Cognition projection-only mocks
 * ============================================================
 *
 * This file provides static demo data for projection-only schemas
 * (CivicHealthSnapshot, OversightSignal). These schemas have NO
 * merged backend contract and exist solely to power UI scaffolding
 * during development.
 *
 * Do NOT treat this data as representative of production behavior.
 * ============================================================
 */

import type { CivicHealthSnapshot, OversightSignal } from "@/lib/contracts/collective";

export function mockCivicHealthSnapshot(): CivicHealthSnapshot {
  return {
    epoch: "epoch-2026-q1",
    heatState: "Warm",
    oversightMode: "Standard Monitoring",
    activeDeliberations: 2,
    pendingReforms: 3,
    lastHeartbeat: "2026-03-17T08:30:00Z",
  };
}

export function mockOversightSignals(): OversightSignal[] {
  return [
    {
      id: "sig-001",
      type: "quorum-drift",
      severity: "warning",
      source: "deliberation-monitor",
      description: "Quorum participation dropped below 60% threshold for session delib-003",
      timestamp: "2026-03-17T07:45:00Z",
      resolved: false,
    },
    {
      id: "sig-002",
      type: "reform-staleness",
      severity: "info",
      source: "reform-tracker",
      description: "Reform artifact reform-004 has been in hosted state for over 14 days without assessment",
      timestamp: "2026-03-16T12:00:00Z",
      resolved: false,
    },
    {
      id: "sig-003",
      type: "legitimacy-contested",
      severity: "error",
      source: "legitimacy-engine",
      description: "Assessment legit-002 returned CONTESTED disposition on CandidateIntegrity dimension",
      timestamp: "2026-03-15T16:20:00Z",
      resolved: true,
    },
    {
      id: "sig-004",
      type: "heartbeat-delay",
      severity: "critical",
      source: "health-monitor",
      description: "Civic health heartbeat delayed by over 30 minutes; oversight mode may be stale",
      timestamp: "2026-03-14T22:10:00Z",
      resolved: true,
    },
  ];
}
