import { z } from "zod";
import { IsoDateTimeSchema, RhidSchema, Sha256Schema } from "./common";

// ============================================================
// CANONICAL SCHEMAS — backed by merged PT-C2 backend contracts
// ============================================================

// --- Deliberation (PT-C2-T) ---

export const DeliberationStatusSchema = z.enum(["active", "concluded", "archived"]);
export type DeliberationStatus = z.infer<typeof DeliberationStatusSchema>;

export const DeliberationSessionSchema = z.object({
  id: z.string(),
  epochRef: z.string(),
  topic: z.string(),
  status: DeliberationStatusSchema,
  participants: z.array(z.string()),
  startedAt: IsoDateTimeSchema,
  concludedAt: IsoDateTimeSchema.optional(),
});
export type DeliberationSession = z.infer<typeof DeliberationSessionSchema>;

export const DeliberationRecordSchema = z.object({
  sessionId: z.string(),
  contributorId: z.string(),
  position: z.string(),
  reasoning: z.string(),
  evidenceRefs: z.array(RhidSchema).default([]),
  timestamp: IsoDateTimeSchema,
});
export type DeliberationRecord = z.infer<typeof DeliberationRecordSchema>;

export const DeliberationSummarySchema = z.object({
  sessionId: z.string(),
  outcomeDisposition: z.string(),
  participantCount: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
});
export type DeliberationSummary = z.infer<typeof DeliberationSummarySchema>;

// --- Reform Artifacts (PT-C2-U) ---

export const ReformArtifactStatusSchema = z.enum(["hosted", "superseded", "withdrawn"]);
export type ReformArtifactStatus = z.infer<typeof ReformArtifactStatusSchema>;

export const ReformArtifactSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  authorId: z.string(),
  epochRef: z.string(),
  createdAt: IsoDateTimeSchema,
  lineageAnchors: z.array(RhidSchema).default([]),
  contentHash: Sha256Schema,
  status: ReformArtifactStatusSchema,
});
export type ReformArtifact = z.infer<typeof ReformArtifactSchema>;

export const ReformArtifactLineageSchema = z.object({
  artifactId: z.string(),
  predecessors: z.array(z.string()).default([]),
  deliberationRef: z.string().optional(),
  evidenceRefs: z.array(RhidSchema).default([]),
});
export type ReformArtifactLineage = z.infer<typeof ReformArtifactLineageSchema>;

// --- Legitimacy Assessment (PT-C2-V) ---

export const LegitimacyDispositionSchema = z.enum([
  "LEGITIMATE",
  "CONTESTED",
  "INSUFFICIENT_EVIDENCE",
  "REJECTED",
]);
export type LegitimacyDisposition = z.infer<typeof LegitimacyDispositionSchema>;

export const LegitimacyDimensionSchema = z.enum([
  "SignalLegitimacy",
  "CandidateIntegrity",
  "DeliberationHealth",
  "AlternativeCoverage",
  "StrategyCompatibility",
]);
export type LegitimacyDimension = z.infer<typeof LegitimacyDimensionSchema>;

export const LegitimacyDimensionOutcomeSchema = z.object({
  dimension: LegitimacyDimensionSchema,
  score: z.number().min(0).max(1),
  disposition: LegitimacyDispositionSchema,
  explanation: z.string(),
});
export type LegitimacyDimensionOutcome = z.infer<typeof LegitimacyDimensionOutcomeSchema>;

export const ReformLegitimacyAssessmentSchema = z.object({
  id: z.string(),
  reformArtifactRef: z.string(),
  dimensions: z.array(LegitimacyDimensionOutcomeSchema),
  aggregateDisposition: LegitimacyDispositionSchema,
  findings: z.array(z.string()).default([]),
  lineageAnchors: z.array(RhidSchema).default([]),
  reproducibilityMetadata: z.record(z.string(), z.unknown()).optional(),
});
export type ReformLegitimacyAssessment = z.infer<typeof ReformLegitimacyAssessmentSchema>;

// ============================================================
// LIST / DETAIL RESPONSE WRAPPERS (canonical)
// ============================================================

export const ListDeliberationsResponseSchema = z.object({
  items: z.array(DeliberationSessionSchema),
});
export type ListDeliberationsResponse = z.infer<typeof ListDeliberationsResponseSchema>;

export const GetDeliberationDetailResponseSchema = z.object({
  session: DeliberationSessionSchema,
  records: z.array(DeliberationRecordSchema),
  summary: DeliberationSummarySchema.optional(),
});
export type GetDeliberationDetailResponse = z.infer<typeof GetDeliberationDetailResponseSchema>;

export const ListReformsResponseSchema = z.object({
  items: z.array(ReformArtifactSchema),
});
export type ListReformsResponse = z.infer<typeof ListReformsResponseSchema>;

export const GetReformDetailResponseSchema = z.object({
  artifact: ReformArtifactSchema,
  lineage: ReformArtifactLineageSchema,
});
export type GetReformDetailResponse = z.infer<typeof GetReformDetailResponseSchema>;

export const ListLegitimacyResponseSchema = z.object({
  items: z.array(ReformLegitimacyAssessmentSchema),
});
export type ListLegitimacyResponse = z.infer<typeof ListLegitimacyResponseSchema>;

// ============================================================
// PROJECTION-ONLY — local UI scaffolds, no merged backend contract
// These exist solely to type mock/demo data.
// They do NOT imply a real backend surface.
// ============================================================

export const HeatStateSchema = z.enum(["Cool", "Warm", "Hot", "Critical"]);
export type HeatState = z.infer<typeof HeatStateSchema>;

export const CivicHealthSnapshotSchema = z.object({
  epoch: z.string(),
  heatState: HeatStateSchema,
  oversightMode: z.string(),
  activeDeliberations: z.number().int().nonnegative(),
  pendingReforms: z.number().int().nonnegative(),
  lastHeartbeat: IsoDateTimeSchema,
});
export type CivicHealthSnapshot = z.infer<typeof CivicHealthSnapshotSchema>;

export const OversightSignalSchema = z.object({
  id: z.string(),
  type: z.string(),
  severity: z.enum(["info", "warning", "error", "critical"]),
  source: z.string(),
  description: z.string(),
  timestamp: IsoDateTimeSchema,
  resolved: z.boolean(),
});
export type OversightSignal = z.infer<typeof OversightSignalSchema>;

// DEFERRED — schema exists for future use only

export const LineageNodeSchema = z.object({
  artifactRef: z.string(),
  type: z.string(),
  predecessors: z.array(z.string()).default([]),
  successors: z.array(z.string()).default([]),
  epochRef: z.string(),
});
export type LineageNode = z.infer<typeof LineageNodeSchema>;

export const LineageEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  relationship: z.string(),
});
export type LineageEdge = z.infer<typeof LineageEdgeSchema>;

export const LineageGraphSchema = z.object({
  nodes: z.array(LineageNodeSchema),
  edges: z.array(LineageEdgeSchema),
  rootRef: z.string(),
});
export type LineageGraph = z.infer<typeof LineageGraphSchema>;
