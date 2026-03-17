/**
 * Collective Cognition — read-only view models and mapping functions.
 *
 * All interfaces are fully readonly. No mutation methods. No action callbacks.
 */

import type {
  CivicHealthSnapshot,
  DeliberationRecord,
  DeliberationSession,
  DeliberationStatus,
  HeatState,
  LegitimacyDimension,
  LegitimacyDisposition,
  LegitimacyDimensionOutcome,
  OversightSignal,
  ReformArtifact,
  ReformArtifactLineage,
  ReformArtifactStatus,
  ReformLegitimacyAssessment,
} from "@/lib/contracts/collective";

// ============================================================
// Badge variant type — shared across all collective view models
// ============================================================

export type BadgeVariant = "healthy" | "warning" | "critical" | "neutral" | "offline";

// ============================================================
// Color mapping functions
// ============================================================

export function heatStateToVariant(state: HeatState): BadgeVariant {
  switch (state) {
    case "Cool":
      return "healthy";
    case "Warm":
      return "warning";
    case "Hot":
      return "critical";
    case "Critical":
      return "critical";
  }
}

export function dispositionToVariant(disposition: LegitimacyDisposition): BadgeVariant {
  switch (disposition) {
    case "LEGITIMATE":
      return "healthy";
    case "CONTESTED":
      return "warning";
    case "INSUFFICIENT_EVIDENCE":
      return "neutral";
    case "REJECTED":
      return "critical";
  }
}

export function deliberationStatusToVariant(status: DeliberationStatus): BadgeVariant {
  switch (status) {
    case "active":
      return "healthy";
    case "concluded":
      return "neutral";
    case "archived":
      return "offline";
  }
}

export function reformStatusToVariant(status: ReformArtifactStatus): BadgeVariant {
  switch (status) {
    case "hosted":
      return "healthy";
    case "superseded":
      return "neutral";
    case "withdrawn":
      return "offline";
  }
}

export function signalSeverityToVariant(
  severity: "info" | "warning" | "error" | "critical",
): BadgeVariant {
  switch (severity) {
    case "info":
      return "neutral";
    case "warning":
      return "warning";
    case "error":
      return "critical";
    case "critical":
      return "critical";
  }
}

// ============================================================
// Dimension display labels
// ============================================================

const DIMENSION_LABELS: Readonly<Record<LegitimacyDimension, string>> = {
  SignalLegitimacy: "Signal Legitimacy",
  CandidateIntegrity: "Candidate Integrity",
  DeliberationHealth: "Deliberation Health",
  AlternativeCoverage: "Alternative Coverage",
  StrategyCompatibility: "Strategy Compatibility",
};

// ============================================================
// View model interfaces (all readonly)
// ============================================================

export interface UIDeliberationSession {
  readonly id: string;
  readonly epochRef: string;
  readonly topic: string;
  readonly status: DeliberationStatus;
  readonly statusBadgeVariant: BadgeVariant;
  readonly participantCount: number;
  readonly startedAt: string;
  readonly concludedAt: string | undefined;
  readonly durationLabel: string;
}

export interface UIDeliberationRecord {
  readonly sessionId: string;
  readonly contributorId: string;
  readonly position: string;
  readonly reasoning: string;
  readonly evidenceRefs: readonly string[];
  readonly evidenceRefCount: number;
  readonly timestamp: string;
}

export interface UIReformArtifactCard {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly authorId: string;
  readonly epochRef: string;
  readonly createdAt: string;
  readonly status: ReformArtifactStatus;
  readonly statusBadgeVariant: BadgeVariant;
  readonly lineageAnchorCount: number;
  readonly hasLegitimacyAssessment: boolean;
}

export interface UIReformArtifactDetail {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly authorId: string;
  readonly epochRef: string;
  readonly createdAt: string;
  readonly contentHash: string;
  readonly status: ReformArtifactStatus;
  readonly statusBadgeVariant: BadgeVariant;
  readonly lineageAnchors: readonly string[];
  readonly predecessors: readonly string[];
  readonly deliberationRef: string | undefined;
  readonly evidenceRefs: readonly string[];
}

export interface UILegitimacyDimensionOutcome {
  readonly dimension: LegitimacyDimension;
  readonly dimensionLabel: string;
  readonly score: number;
  readonly scorePercent: number;
  readonly disposition: LegitimacyDisposition;
  readonly dispositionBadgeVariant: BadgeVariant;
  readonly explanation: string;
}

export interface UILegitimacyAssessment {
  readonly id: string;
  readonly reformArtifactRef: string;
  readonly dimensions: readonly UILegitimacyDimensionOutcome[];
  readonly aggregateDisposition: LegitimacyDisposition;
  readonly aggregateBadgeVariant: BadgeVariant;
  readonly findingCount: number;
  readonly findings: readonly string[];
}

export interface UICivicHealthSnapshot {
  readonly epoch: string;
  readonly heatState: HeatState;
  readonly heatBadgeVariant: BadgeVariant;
  readonly oversightMode: string;
  readonly activeDeliberations: number;
  readonly pendingReforms: number;
  readonly lastHeartbeat: string;
  readonly heartbeatAgeLabel: string;
}

export interface UIOversightSignal {
  readonly id: string;
  readonly type: string;
  readonly severity: "info" | "warning" | "error" | "critical";
  readonly severityBadgeVariant: BadgeVariant;
  readonly source: string;
  readonly description: string;
  readonly timestamp: string;
  readonly resolved: boolean;
}

// ============================================================
// Mapping functions
// ============================================================

function computeDurationLabel(startedAt: string, concludedAt?: string): string {
  const start = new Date(startedAt).getTime();
  const end = concludedAt ? new Date(concludedAt).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);

  if (diffMs < 60_000) {
    return `${Math.round(diffMs / 1_000)}s`;
  }
  if (diffMs < 3_600_000) {
    return `${Math.round(diffMs / 60_000)}m`;
  }
  if (diffMs < 86_400_000) {
    const hours = Math.floor(diffMs / 3_600_000);
    const mins = Math.round((diffMs % 3_600_000) / 60_000);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  const days = Math.floor(diffMs / 86_400_000);
  return `${days}d`;
}

function computeHeartbeatAgeLabel(heartbeat: string): string {
  const ageMs = Math.max(0, Date.now() - new Date(heartbeat).getTime());

  if (ageMs < 60_000) {
    return "just now";
  }
  if (ageMs < 3_600_000) {
    return `${Math.round(ageMs / 60_000)}m ago`;
  }
  if (ageMs < 86_400_000) {
    return `${Math.round(ageMs / 3_600_000)}h ago`;
  }
  return `${Math.round(ageMs / 86_400_000)}d ago`;
}

export function toUIDeliberationSession(session: DeliberationSession): UIDeliberationSession {
  return {
    id: session.id,
    epochRef: session.epochRef,
    topic: session.topic,
    status: session.status,
    statusBadgeVariant: deliberationStatusToVariant(session.status),
    participantCount: session.participants.length,
    startedAt: session.startedAt,
    concludedAt: session.concludedAt,
    durationLabel: computeDurationLabel(session.startedAt, session.concludedAt),
  };
}

export function toUIDeliberationRecord(record: DeliberationRecord): UIDeliberationRecord {
  return {
    sessionId: record.sessionId,
    contributorId: record.contributorId,
    position: record.position,
    reasoning: record.reasoning,
    evidenceRefs: record.evidenceRefs,
    evidenceRefCount: record.evidenceRefs.length,
    timestamp: record.timestamp,
  };
}

export function toUIReformArtifactCard(
  artifact: ReformArtifact,
  assessmentIds: ReadonlySet<string>,
): UIReformArtifactCard {
  return {
    id: artifact.id,
    title: artifact.title,
    description: artifact.description,
    authorId: artifact.authorId,
    epochRef: artifact.epochRef,
    createdAt: artifact.createdAt,
    status: artifact.status,
    statusBadgeVariant: reformStatusToVariant(artifact.status),
    lineageAnchorCount: artifact.lineageAnchors.length,
    hasLegitimacyAssessment: assessmentIds.has(artifact.id),
  };
}

export function toUIReformArtifactDetail(
  artifact: ReformArtifact,
  lineage: ReformArtifactLineage,
): UIReformArtifactDetail {
  return {
    id: artifact.id,
    title: artifact.title,
    description: artifact.description,
    authorId: artifact.authorId,
    epochRef: artifact.epochRef,
    createdAt: artifact.createdAt,
    contentHash: artifact.contentHash,
    status: artifact.status,
    statusBadgeVariant: reformStatusToVariant(artifact.status),
    lineageAnchors: artifact.lineageAnchors,
    predecessors: lineage.predecessors,
    deliberationRef: lineage.deliberationRef,
    evidenceRefs: lineage.evidenceRefs,
  };
}

function toUIDimensionOutcome(outcome: LegitimacyDimensionOutcome): UILegitimacyDimensionOutcome {
  return {
    dimension: outcome.dimension,
    dimensionLabel: DIMENSION_LABELS[outcome.dimension],
    score: outcome.score,
    scorePercent: Math.round(outcome.score * 100),
    disposition: outcome.disposition,
    dispositionBadgeVariant: dispositionToVariant(outcome.disposition),
    explanation: outcome.explanation,
  };
}

export function toUILegitimacyAssessment(
  assessment: ReformLegitimacyAssessment,
): UILegitimacyAssessment {
  return {
    id: assessment.id,
    reformArtifactRef: assessment.reformArtifactRef,
    dimensions: assessment.dimensions.map(toUIDimensionOutcome),
    aggregateDisposition: assessment.aggregateDisposition,
    aggregateBadgeVariant: dispositionToVariant(assessment.aggregateDisposition),
    findingCount: assessment.findings.length,
    findings: assessment.findings,
  };
}

export function toUICivicHealthSnapshot(snapshot: CivicHealthSnapshot): UICivicHealthSnapshot {
  return {
    epoch: snapshot.epoch,
    heatState: snapshot.heatState,
    heatBadgeVariant: heatStateToVariant(snapshot.heatState),
    oversightMode: snapshot.oversightMode,
    activeDeliberations: snapshot.activeDeliberations,
    pendingReforms: snapshot.pendingReforms,
    lastHeartbeat: snapshot.lastHeartbeat,
    heartbeatAgeLabel: computeHeartbeatAgeLabel(snapshot.lastHeartbeat),
  };
}

export function toUIOversightSignal(signal: OversightSignal): UIOversightSignal {
  return {
    id: signal.id,
    type: signal.type,
    severity: signal.severity,
    severityBadgeVariant: signalSeverityToVariant(signal.severity),
    source: signal.source,
    description: signal.description,
    timestamp: signal.timestamp,
    resolved: signal.resolved,
  };
}
