import { z } from "zod";
import { IsoDateTimeSchema } from "./common";

export const ThreatSeveritySchema = z.enum(["low", "medium", "high", "critical"]);
export type ThreatSeverity = z.infer<typeof ThreatSeveritySchema>;

export const ThreatSignalSchema = z.object({
  signalId: z.string(),
  type: z.enum(["intrusion_attempt", "data_exfil", "malware", "vulnerability", "policy_violation", "anomaly"]),
  severity: ThreatSeveritySchema,
  tenantId: z.string().optional(),
  actorId: z.string().optional(),
  ip: z.string().optional(),
  timestamp: IsoDateTimeSchema,
  description: z.string(),
  mitigated: z.boolean(),
  mitigatedAt: IsoDateTimeSchema.optional(),
});
export type ThreatSignal = z.infer<typeof ThreatSignalSchema>;

export const AuthAnomalySchema = z.object({
  anomalyId: z.string(),
  type: z.enum(["geo_jump", "credential_spray", "impossible_travel", "session_hijack", "mfa_bypass"]),
  confidence: z.number().min(0).max(1),
  tenantId: z.string().optional(),
  actorId: z.string().optional(),
  detectedAt: IsoDateTimeSchema,
  sourceIp: z.string().optional(),
  userAgent: z.string().optional(),
  reviewStatus: z.enum(["pending", "confirmed", "dismissed"]),
});
export type AuthAnomaly = z.infer<typeof AuthAnomalySchema>;

export const AbuseEventSchema = z.object({
  abuseId: z.string(),
  type: z.enum(["rate_limit_breach", "content_policy", "api_scraping", "data_exfil_attempt", "tos_violation"]),
  tenantId: z.string().optional(),
  actorId: z.string().optional(),
  severity: ThreatSeveritySchema,
  detectedAt: IsoDateTimeSchema,
  description: z.string(),
  actionTaken: z.enum(["none", "warned", "throttled", "suspended", "terminated"]),
});
export type AbuseEvent = z.infer<typeof AbuseEventSchema>;

export const ComplianceCheckSchema = z.object({
  checkId: z.string(),
  name: z.string(),
  category: z.enum(["soc2", "iso27001", "gdpr", "hipaa", "custom"]),
  status: z.enum(["passing", "failing", "warning", "not_applicable"]),
  lastCheckedAt: IsoDateTimeSchema,
  description: z.string(),
  remediationSteps: z.array(z.string()).optional(),
});
export type ComplianceCheck = z.infer<typeof ComplianceCheckSchema>;
