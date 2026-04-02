import { z } from "zod";
import { IsoDateTimeSchema } from "./common";

export const RolloutStatusSchema = z.enum(["scheduled", "active", "paused", "completed", "rolled_back"]);
export type RolloutStatus = z.infer<typeof RolloutStatusSchema>;

export const RolloutSchema = z.object({
  rolloutId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: RolloutStatusSchema,
  canaryPercentage: z.number().min(0).max(100),
  startedAt: IsoDateTimeSchema.optional(),
  scheduledFor: IsoDateTimeSchema.optional(),
  completedAt: IsoDateTimeSchema.optional(),
  targetVersion: z.string(),
  currentVersion: z.string().optional(),
  affectedServices: z.array(z.string()),
  createdBy: z.string(),
});
export type Rollout = z.infer<typeof RolloutSchema>;

export const MaintenanceWindowSchema = z.object({
  windowId: z.string(),
  name: z.string(),
  scheduledStart: IsoDateTimeSchema,
  scheduledEnd: IsoDateTimeSchema,
  affectedServices: z.array(z.string()),
  status: z.enum(["scheduled", "active", "completed", "cancelled"]),
  createdBy: z.string(),
  tenantNotified: z.boolean(),
});
export type MaintenanceWindow = z.infer<typeof MaintenanceWindowSchema>;

export const TenantOverrideSchema = z.object({
  tenantId: z.string(),
  value: z.boolean(),
  setBy: z.string(),
  setAt: IsoDateTimeSchema,
});

export const FeatureFlagSchema = z.object({
  flagId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  enabled: z.boolean(),
  rolloutPercentage: z.number().min(0).max(100),
  tenantOverrides: z.array(TenantOverrideSchema),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  tags: z.array(z.string()).optional(),
});
export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;

export const EntitlementSchema = z.object({
  entitlementId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  enabledForPlans: z.array(z.string()),
  tenantOverrides: z.array(TenantOverrideSchema),
});
export type Entitlement = z.infer<typeof EntitlementSchema>;
