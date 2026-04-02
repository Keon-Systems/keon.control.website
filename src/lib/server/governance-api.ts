import { mockAlerts, mockExecutions } from "@/lib/mock-data";
import type {
  DeliberationSession,
  ReformArtifact,
  ReformLegitimacyAssessment,
} from "@/lib/contracts/collective";

export type GovernanceCollectionKind =
  | "tenants"
  | "policies"
  | "runs"
  | "alerts"
  // Agent 5 — Merge 1 additions
  | "incidents"
  | "slo"
  | "jobs"
  | "delivery"
  | "security-threats"
  | "security-auth"
  | "security-abuse"
  | "security-compliance"
  | "finance-mrr"
  | "finance-collections"
  | "finance-azure-spend"
  | "finance-budget-alerts"
  | "infrastructure-resources"
  | "infrastructure-health"
  | "communications-messages"
  | "communications-templates"
  | "rollouts"
  | "rollouts-flags"
  | "rollouts-windows"
  | "audit"
  | "overrides"
  | "operators"
  | "settings-api-keys"
  // Agent 4 — Merge 2C additions
  | "finance-billing"
  | "finance-azure-spend-alerts"
  | "communications-history"
  | "rollouts-active";
export type GovernanceMode = "MOCK" | "LIVE";

export interface GovernanceIndicators {
  determinismStatus: "SEALED" | "DEGRADED" | "UNKNOWN";
  sealValidationResult: "VALID" | "INVALID" | "UNKNOWN";
  incidentFlag: boolean;
}

export interface GovernanceEnvelope<T> {
  mode: GovernanceMode;
  generatedAt: string;
  governance: GovernanceIndicators;
  data: T[];
  source: string;
  mockLabel?: "MOCK";
}

export class GovernanceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GovernanceUnavailableError";
  }
}

type RecordLike = Record<string, unknown>;

function envMode(): "mock" | "live" {
  return process.env.KEON_CONTROL_GOVERNANCE_MODE === "live" ? "live" : "mock";
}

function envBaseUrl(): string {
  return process.env.KEON_CONTROL_GOVERNANCE_BASE_URL || "http://localhost:5000";
}

function envTimeoutMs(): number {
  const value = Number.parseInt(process.env.KEON_CONTROL_GOVERNANCE_TIMEOUT_MS || "5000", 10);
  return Number.isFinite(value) && value > 0 ? value : 5000;
}

function mockTenants(): RecordLike[] {
  return [
    { id: "tenant-keon", name: "Keon Systems", status: "active", createdAt: "2026-01-01T00:00:00Z" },
    { id: "tenant-omega", name: "Omega Labs", status: "active", createdAt: "2026-01-15T00:00:00Z" },
    { id: "tenant-audit", name: "Audit Sandbox", status: "inactive", createdAt: "2025-12-01T00:00:00Z" },
  ];
}

function mockPolicies(): RecordLike[] {
  return [
    {
      id: "policy-governance-seal",
      name: "Determinism Seal Enforcement",
      version: "1.0.0",
      enabled: true,
      createdAt: "2026-02-20T12:00:00Z",
      updatedAt: "2026-02-24T08:30:00Z",
    },
    {
      id: "policy-spine-correlation",
      name: "Spine Correlation Continuity",
      version: "0.9.0",
      enabled: true,
      createdAt: "2026-02-21T10:00:00Z",
      updatedAt: "2026-02-24T07:45:00Z",
    },
  ];
}

function mockRuns(): RecordLike[] {
  return mockExecutions.map((execution) => ({
    runId: execution.id,
    agent: execution.agent,
    operation: execution.operation,
    status: execution.status,
    startedAt: execution.startedAt,
    determinismStatus: execution.status === "failed" ? "DEGRADED" : "SEALED",
    sealValidationResult: execution.status === "failed" ? "INVALID" : "VALID",
  }));
}

function mockAlertsData(): RecordLike[] {
  return mockAlerts.map((alert) => ({
    id: alert.id,
    severity: alert.severity === "critical" ? "critical" : alert.severity,
    title: alert.subsystem,
    message: alert.message,
    timestamp: alert.timestamp,
    acknowledged: false,
    source: alert.subsystem,
  }));
}

function mockData(kind: GovernanceCollectionKind): RecordLike[] {
  switch (kind) {
    case "tenants":
      return mockTenants();
    case "policies":
      return mockPolicies();
    case "runs":
      return mockRuns();
    case "alerts":
      return mockAlertsData();
    case "incidents":
      return mockIncidents as RecordLike[];
    case "slo":
      return mockSloBurnRates as RecordLike[];
    case "jobs":
      return mockJobQueues as RecordLike[];
    case "delivery":
      return mockDeliveryChannels as RecordLike[];
    case "security-threats":
      return mockThreatSignals as RecordLike[];
    case "security-auth":
      return mockAuthAnomalies as RecordLike[];
    case "security-abuse":
      return mockAbuseEvents as RecordLike[];
    case "security-compliance":
      return mockComplianceChecks as RecordLike[];
    case "finance-mrr":
      return [mockMrrSummary] as RecordLike[];
    case "finance-collections":
      return mockCollections as RecordLike[];
    case "finance-azure-spend":
      return [mockAzureSpend] as RecordLike[];
    case "finance-budget-alerts":
      return mockBudgetAlerts as RecordLike[];
    case "infrastructure-resources":
      return mockAzureResources as RecordLike[];
    case "infrastructure-health":
      return mockResourceGroupHealth as RecordLike[];
    case "communications-messages":
      return mockCommMessages as RecordLike[];
    case "communications-templates":
      return mockCommTemplates as RecordLike[];
    case "rollouts":
      return mockRollouts as RecordLike[];
    case "rollouts-flags":
      return mockFeatureFlags as RecordLike[];
    case "rollouts-windows":
      return mockMaintenanceWindows as RecordLike[];
    case "audit":
      return mockAuditEntries as RecordLike[];
    case "overrides":
      return mockOverrideReceipts as RecordLike[];
    case "operators":
      return mockOperators as RecordLike[];
    case "settings-api-keys":
      return mockApiKeys as RecordLike[];
    // Agent 4 aliases
    case "finance-billing":
      return [mockMrrSummary] as RecordLike[];
    case "finance-azure-spend-alerts":
      return mockBudgetAlerts as RecordLike[];
    case "communications-history":
      return mockCommMessages as RecordLike[];
    case "rollouts-active":
      return mockRollouts as RecordLike[];
  }
}

function computeMockIndicators(): GovernanceIndicators {
  const hasCriticalAlert = mockAlerts.some((alert) => alert.severity === "critical");
  const hasFailedRun = mockExecutions.some((execution) => execution.status === "failed");

  return {
    determinismStatus: hasFailedRun ? "DEGRADED" : "SEALED",
    sealValidationResult: hasFailedRun ? "INVALID" : "VALID",
    incidentFlag: hasCriticalAlert || hasFailedRun,
  };
}

function normalizeLiveIndicators(kind: GovernanceCollectionKind, data: RecordLike[]): GovernanceIndicators {
  if (kind === "alerts") {
    const incidentFlag = data.some((item) => String(item.severity ?? "").toLowerCase() === "critical");
    return {
      determinismStatus: "UNKNOWN",
      sealValidationResult: "UNKNOWN",
      incidentFlag,
    };
  }

  if (kind === "runs") {
    const statuses = data.map((item) => String(item.status ?? "").toLowerCase());
    const hasFailed = statuses.some((status) => status === "failed");
    return {
      determinismStatus: hasFailed ? "DEGRADED" : "SEALED",
      sealValidationResult: hasFailed ? "INVALID" : "VALID",
      incidentFlag: hasFailed,
    };
  }

  return {
    determinismStatus: "UNKNOWN",
    sealValidationResult: "UNKNOWN",
    incidentFlag: false,
  };
}

async function fetchLiveCollection(kind: GovernanceCollectionKind): Promise<RecordLike[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), envTimeoutMs());

  try {
    const base = envBaseUrl().replace(/\/+$/, "");
    const response = await fetch(`${base}/${kind}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new GovernanceUnavailableError(`Upstream ${kind} returned HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload)) {
      throw new GovernanceUnavailableError(`Upstream ${kind} payload is not an array`);
    }

    return payload as RecordLike[];
  } catch (error) {
    if (error instanceof GovernanceUnavailableError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new GovernanceUnavailableError(`Upstream ${kind} unreachable: ${message}`);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getGovernanceCollection(
  kind: GovernanceCollectionKind,
): Promise<GovernanceEnvelope<RecordLike>> {
  const generatedAt = new Date().toISOString();

  if (envMode() === "mock") {
    return {
      mode: "MOCK",
      generatedAt,
      governance: computeMockIndicators(),
      data: mockData(kind),
      source: "local-mock-provider",
      mockLabel: "MOCK",
    };
  }

  const liveData = await fetchLiveCollection(kind);

  return {
    mode: "LIVE",
    generatedAt,
    governance: normalizeLiveIndicators(kind, liveData),
    data: liveData,
    source: envBaseUrl(),
  };
}

// ============================================================
// Collective Cognition — canonical mock data (PT-C2-T/U/V)
// ============================================================

export function mockDeliberationSessions(): DeliberationSession[] {
  return [
    {
      id: "delib-001",
      epochRef: "epoch-2026-q1",
      topic: "Signal weighting methodology for cross-agent consensus",
      status: "active",
      participants: ["contributor-alpha", "contributor-beta", "contributor-gamma"],
      startedAt: "2026-03-10T09:00:00Z",
    },
    {
      id: "delib-002",
      epochRef: "epoch-2026-q1",
      topic: "Candidate integrity thresholds for reform artifact promotion",
      status: "concluded",
      participants: ["contributor-alpha", "contributor-delta"],
      startedAt: "2026-03-05T14:00:00Z",
      concludedAt: "2026-03-08T11:30:00Z",
    },
    {
      id: "delib-003",
      epochRef: "epoch-2026-q1",
      topic: "Alternative coverage requirements for strategy compatibility dimension",
      status: "active",
      participants: ["contributor-beta", "contributor-gamma", "contributor-epsilon", "contributor-zeta"],
      startedAt: "2026-03-12T10:00:00Z",
    },
    {
      id: "delib-004",
      epochRef: "epoch-2025-q4",
      topic: "Evidence reference linking standards for lineage anchors",
      status: "archived",
      participants: ["contributor-alpha", "contributor-beta"],
      startedAt: "2025-12-01T08:00:00Z",
      concludedAt: "2025-12-15T17:00:00Z",
    },
    {
      id: "delib-005",
      epochRef: "epoch-2026-q1",
      topic: "Deliberation health scoring normalization across epoch boundaries",
      status: "concluded",
      participants: ["contributor-gamma", "contributor-delta", "contributor-epsilon"],
      startedAt: "2026-02-20T11:00:00Z",
      concludedAt: "2026-03-01T16:45:00Z",
    },
  ];
}

export function mockReformArtifacts(): ReformArtifact[] {
  return [
    {
      id: "reform-001",
      title: "Signal Weighting v2 Specification",
      description: "Revised methodology for multi-agent signal weighting incorporating temporal decay and source reliability factors.",
      authorId: "contributor-alpha",
      epochRef: "epoch-2026-q1",
      createdAt: "2026-03-08T12:00:00Z",
      lineageAnchors: ["rhid:deliberation:a1b2c3d4-e5f6-0001-a1b2-c3d4e5f6a7b8"],
      contentHash: "sha256:a3f7c9e1d4b6a8f0e2c4d6a8b0e2f4a6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6",
      status: "hosted",
    },
    {
      id: "reform-002",
      title: "Candidate Integrity Threshold Policy",
      description: "Defines minimum integrity scores required for reform artifacts to proceed through legitimacy assessment.",
      authorId: "contributor-delta",
      epochRef: "epoch-2026-q1",
      createdAt: "2026-03-09T15:30:00Z",
      lineageAnchors: [
        "rhid:deliberation:b2c3d4e5-f6a7-0002-b2c3-d4e5f6a7b8c9",
        "rhid:reform:c3d4e5f6-a7b8-0001-c3d4-e5f6a7b8c9d0",
      ],
      contentHash: "sha256:b4e8d0f2a6c8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8",
      status: "hosted",
    },
    {
      id: "reform-003",
      title: "Alternative Coverage Matrix",
      description: "Framework for evaluating breadth and depth of alternative strategies considered during deliberation sessions.",
      authorId: "contributor-beta",
      epochRef: "epoch-2026-q1",
      createdAt: "2026-03-13T10:00:00Z",
      lineageAnchors: [],
      contentHash: "sha256:c5f9e1a3b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9",
      status: "hosted",
    },
    {
      id: "reform-004",
      title: "Lineage Anchor Linking Standard v1",
      description: "Standardized format and validation rules for RHID-based lineage anchor references across reform artifacts.",
      authorId: "contributor-alpha",
      epochRef: "epoch-2025-q4",
      createdAt: "2025-12-16T09:00:00Z",
      lineageAnchors: ["rhid:deliberation:d4e5f6a7-b8c9-0004-d4e5-f6a7b8c9d0e1"],
      contentHash: "sha256:d6a0f2b4c8e0a2b4d6c8e0a2b4d6f8a0c2e4b6d8f0a2c4e6b8d0a2c4e6f8a0",
      status: "superseded",
    },
    {
      id: "reform-005",
      title: "Epoch Boundary Normalization Procedure",
      description: "Procedure for normalizing deliberation health scores when sessions span multiple epoch boundaries.",
      authorId: "contributor-gamma",
      epochRef: "epoch-2026-q1",
      createdAt: "2026-03-02T08:00:00Z",
      lineageAnchors: ["rhid:deliberation:e5f6a7b8-c9d0-0005-e5f6-a7b8c9d0e1f2"],
      contentHash: "sha256:e7b1a3c5d9f1b3a5c7e9d1b3a5f7c9e1d3b5a7f9c1e3d5b7a9f1c3e5d7b9a1",
      status: "hosted",
    },
    {
      id: "reform-006",
      title: "Withdrawn: Initial Signal Weighting Draft",
      description: "Original signal weighting draft withdrawn in favor of reform-001 after deliberation feedback.",
      authorId: "contributor-alpha",
      epochRef: "epoch-2026-q1",
      createdAt: "2026-02-28T14:00:00Z",
      lineageAnchors: [],
      contentHash: "sha256:f8c2b4d6e0a2c4b6d8f0a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2",
      status: "withdrawn",
    },
  ];
}

export function mockReformLegitimacyAssessments(): ReformLegitimacyAssessment[] {
  return [
    {
      id: "legit-001",
      reformArtifactRef: "reform-001",
      dimensions: [
        {
          dimension: "SignalLegitimacy",
          score: 0.87,
          disposition: "LEGITIMATE",
          explanation: "Signal sources verified across three independent contributors with consistent weighting.",
        },
        {
          dimension: "CandidateIntegrity",
          score: 0.92,
          disposition: "LEGITIMATE",
          explanation: "Content hash validated; no undisclosed modifications detected since initial submission.",
        },
        {
          dimension: "DeliberationHealth",
          score: 0.78,
          disposition: "LEGITIMATE",
          explanation: "Deliberation session met quorum and duration thresholds with balanced participation.",
        },
        {
          dimension: "AlternativeCoverage",
          score: 0.65,
          disposition: "CONTESTED",
          explanation: "Two alternative approaches were discussed but coverage of edge cases remains incomplete.",
        },
        {
          dimension: "StrategyCompatibility",
          score: 0.81,
          disposition: "LEGITIMATE",
          explanation: "Compatible with current epoch strategy objectives and prior reform lineage.",
        },
      ],
      aggregateDisposition: "LEGITIMATE",
      findings: [
        "AlternativeCoverage dimension scored below 0.70 threshold; flagged for supplementary review.",
        "All other dimensions exceed minimum legitimacy thresholds.",
      ],
      lineageAnchors: ["rhid:reform:c3d4e5f6-a7b8-0001-c3d4-e5f6a7b8c9d0"],
    },
    {
      id: "legit-002",
      reformArtifactRef: "reform-002",
      dimensions: [
        {
          dimension: "SignalLegitimacy",
          score: 0.71,
          disposition: "CONTESTED",
          explanation: "One of two signal sources could not be independently corroborated.",
        },
        {
          dimension: "CandidateIntegrity",
          score: 0.55,
          disposition: "CONTESTED",
          explanation: "Content hash mismatch detected between v1 and v2 submissions without changelog entry.",
        },
        {
          dimension: "DeliberationHealth",
          score: 0.83,
          disposition: "LEGITIMATE",
          explanation: "Session concluded with adequate quorum and recorded rationale for all positions.",
        },
        {
          dimension: "AlternativeCoverage",
          score: 0.40,
          disposition: "INSUFFICIENT_EVIDENCE",
          explanation: "No alternative threshold policies were evaluated during the deliberation.",
        },
        {
          dimension: "StrategyCompatibility",
          score: 0.68,
          disposition: "CONTESTED",
          explanation: "Partial alignment with epoch strategy; potential conflict with reform-005 normalization procedure.",
        },
      ],
      aggregateDisposition: "CONTESTED",
      findings: [
        "CandidateIntegrity flagged: content hash divergence requires author clarification.",
        "AlternativeCoverage insufficient: no competing proposals evaluated.",
        "Recommend supplementary deliberation session before disposition upgrade.",
      ],
      lineageAnchors: [
        "rhid:reform:d4e5f6a7-b8c9-0002-d4e5-f6a7b8c9d0e1",
        "rhid:deliberation:b2c3d4e5-f6a7-0002-b2c3-d4e5f6a7b8c9",
      ],
    },
    {
      id: "legit-003",
      reformArtifactRef: "reform-005",
      dimensions: [
        {
          dimension: "SignalLegitimacy",
          score: 0.90,
          disposition: "LEGITIMATE",
          explanation: "All signal sources validated with epoch-boundary normalization test data.",
        },
        {
          dimension: "CandidateIntegrity",
          score: 0.95,
          disposition: "LEGITIMATE",
          explanation: "Content hash stable across all revisions; full changelog provided.",
        },
        {
          dimension: "DeliberationHealth",
          score: 0.88,
          disposition: "LEGITIMATE",
          explanation: "Three-participant session with documented dissent and resolution.",
        },
        {
          dimension: "AlternativeCoverage",
          score: 0.76,
          disposition: "LEGITIMATE",
          explanation: "Two alternative normalization approaches evaluated and documented.",
        },
        {
          dimension: "StrategyCompatibility",
          score: 0.84,
          disposition: "LEGITIMATE",
          explanation: "Fully compatible with epoch transition strategy and existing reform lineage.",
        },
      ],
      aggregateDisposition: "LEGITIMATE",
      findings: [
        "All dimensions exceed minimum legitimacy thresholds.",
        "Artifact recommended for sustained hosting status.",
      ],
      lineageAnchors: ["rhid:deliberation:e5f6a7b8-c9d0-0005-e5f6-a7b8c9d0e1f2"],
    },
  ];
}
