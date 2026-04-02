/**
 * Keon Control — Governance Truth Adapter
 *
 * Fetches real governance posture, authority, constraints, and escalation
 * conditions from dashboard APIs and normalizes into cockpit GovernanceState.
 *
 * Real sources:
 *   - GET /v1/dashboard/health         → determinism/seal status
 *   - GET /v1/dashboard/trust-vector   → seal validation proxy
 *   - GET /v1/dashboard/summary        → active policy count proxy
 *   - GET /v1/dashboard/scorecard      → policy overrides, quorum health
 *
 * On failure: returns mock fallback.
 */

import {
    getDashboardHealth,
    getDashboardScorecard,
    getDashboardTrustVector,
} from "@/lib/api/control-plane";
import type {
    DashboardHealthItem,
    DashboardScorecard,
    DashboardTrustVector,
} from "@/lib/api/types";
import type {
    EscalationCondition,
    GovernanceConstraint,
    GovernancePosture,
    OperatorAuthority,
} from "@/lib/cockpit/types";
import { fetchWithFallback } from "./shared";

// ============================================================
// NORMALIZERS
// ============================================================

function resolvePosture(
  health: DashboardHealthItem[],
  trustVector: DashboardTrustVector,
  scorecard: DashboardScorecard | null,
): GovernancePosture {
  const hasCritical = health.some((h) => h.status === "critical" || h.status === "offline");
  const hasDegraded = health.some((h) => h.status === "degraded" || h.status === "impaired");

  const determinismStatus: GovernancePosture["determinismStatus"] =
    hasCritical ? "DEGRADED" : "SEALED";

  const sealValidation: GovernancePosture["sealValidation"] =
    trustVector.score >= 95 ? "VALID" : trustVector.score >= 80 ? "VALID" : "UNKNOWN";

  const policyOverrides = scorecard?.policyOverrides;

  return {
    oversightMode: hasCritical ? "restricted" : "supervised",
    determinismStatus,
    sealValidation,
    incidentFlag: hasCritical,
    activePolicyCount: policyOverrides?.count ?? 0,
    activePolicyProfile: policyOverrides?.activeOverrides?.[0] ?? null,
    lastPolicyChange: null, // Backend does not yet expose this
    dataMode: "LIVE",
  };
}

function resolveConstraints(scorecard: DashboardScorecard | null): GovernanceConstraint[] {
  if (!scorecard) return [];

  const constraints: GovernanceConstraint[] = [];

  if (scorecard.policyOverrides.locked) {
    constraints.push({
      id: "c-policy-lock",
      name: "Policy overrides locked",
      type: "scope-restriction",
      description: "All policy overrides are locked by administrator",
      active: true,
      proximity: 1.0,
    });
  }

  if (scorecard.quorumHealth.status !== "healthy") {
    constraints.push({
      id: "c-quorum-risk",
      name: "Quorum at risk",
      type: "escalation-gate",
      description: `${scorecard.quorumHealth.membersOnline}/${scorecard.quorumHealth.membersRequired} members online`,
      active: true,
      proximity: scorecard.quorumHealth.status === "down" ? 1.0 : 0.7,
    });
  }

  return constraints;
}

function resolveEscalationConditions(
  trustVector: DashboardTrustVector,
  scorecard: DashboardScorecard | null,
): EscalationCondition[] {
  const conditions: EscalationCondition[] = [];

  if (trustVector.score < 95) {
    conditions.push({
      id: "e-trust-degraded",
      name: "Trust score below threshold",
      threshold: "95%",
      currentValue: `${trustVector.score.toFixed(1)}%`,
      proximity: Math.max(0, (95 - trustVector.score) / 95),
      triggered: trustVector.score < 80,
    });
  }

  if (scorecard?.quorumHealth.status === "down") {
    conditions.push({
      id: "e-quorum-down",
      name: "Quorum failure",
      threshold: `${scorecard.quorumHealth.membersRequired} members`,
      currentValue: `${scorecard.quorumHealth.membersOnline} online`,
      proximity: 1.0,
      triggered: true,
    });
  }

  return conditions;
}

// ============================================================
// MOCK AUTHORITY (unchanged — operator auth comes from session)
// ============================================================

const MOCK_AUTHORITY: OperatorAuthority = {
  role: "operator",
  privilegeLevel: "OPERATOR",
  permittedActions: ["declare-incident", "acknowledge-alert", "submit-decision"],
  scopeBoundaries: { tenantIds: "all", subsystems: "all" },
};

// ============================================================
// PUBLIC ADAPTER
// ============================================================

export async function fetchGovernanceData(): Promise<{
  posture: GovernancePosture;
  authority: OperatorAuthority;
  constraints: GovernanceConstraint[];
  escalationConditions: EscalationCondition[];
  source: "live" | "mock";
}> {
  const [healthResult, trustResult, scorecardResult] = await Promise.all([
    fetchWithFallback(() => getDashboardHealth(), [] as DashboardHealthItem[]),
    fetchWithFallback(() => getDashboardTrustVector(), { score: 98, policy: { percent: 99, sparkline: [] }, receipts: { percent: 99, sparkline: [] }, quorum: { percent: 98, sparkline: [] }, latency: { percent: 99, sparkline: [] }, trend: "stable" } as DashboardTrustVector),
    fetchWithFallback(() => getDashboardScorecard(), null as DashboardScorecard | null),
  ]);

  const anyLive = healthResult.source === "live" || trustResult.source === "live";

  if (!anyLive) {
    // All failed — return mock posture
    return {
      posture: { oversightMode: "supervised", determinismStatus: "UNKNOWN", sealValidation: "UNKNOWN", incidentFlag: false, activePolicyCount: 0, activePolicyProfile: null, lastPolicyChange: null, dataMode: "MOCK" },
      authority: MOCK_AUTHORITY,
      constraints: [],
      escalationConditions: [],
      source: "mock",
    };
  }

  return {
    posture: resolvePosture(healthResult.data, trustResult.data, scorecardResult.data),
    authority: MOCK_AUTHORITY, // Real auth comes from session — not API
    constraints: resolveConstraints(scorecardResult.data),
    escalationConditions: resolveEscalationConditions(trustResult.data, scorecardResult.data),
    source: "live",
  };
}

