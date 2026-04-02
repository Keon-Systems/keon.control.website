import { z } from "zod";
import { IsoDateTimeSchema } from "./common";

export const GovernanceIndicatorsSchema = z.object({
  determinismStatus: z.enum(["SEALED", "DEGRADED", "UNKNOWN"]),
  sealValidationResult: z.enum(["VALID", "INVALID", "UNKNOWN"]),
  incidentFlag: z.boolean(),
});

export type GovernanceIndicators = z.infer<typeof GovernanceIndicatorsSchema>;

export const GovernanceTelemetrySchema = z.object({
  pendingDecisions: z.number().int().nonnegative(),
  runsByStatus: z.record(z.string(), z.number().int().nonnegative()).default({}),
  denyRate: z.number().min(0).max(1).nullable().default(null),
  gateRate: z.number().min(0).max(1).nullable().default(null),
  sealRate: z.number().min(0).max(1).nullable().default(null),
});

export type GovernanceTelemetry = z.infer<typeof GovernanceTelemetrySchema>;

export const RecentActivityItemSchema = z.object({
  kind: z.enum(["decision", "run", "alert", "seal"]),
  id: z.string(),
  label: z.string(),
  timestamp: IsoDateTimeSchema,
  status: z.string().optional(),
});

export type RecentActivityItem = z.infer<typeof RecentActivityItemSchema>;

export const CollectivePulseSchema = z.object({
  generatedAt: IsoDateTimeSchema,
  mode: z.enum(["MOCK", "LIVE"]),
  indicators: GovernanceIndicatorsSchema,
  telemetry: GovernanceTelemetrySchema,
  counts: z.object({
    tenants: z.number().int().nonnegative(),
    policies: z.number().int().nonnegative(),
    runs: z.number().int().nonnegative(),
    alerts: z.number().int().nonnegative(),
  }),
  recentActivity: z.array(RecentActivityItemSchema).default([]),
});

export type CollectivePulse = z.infer<typeof CollectivePulseSchema>;
