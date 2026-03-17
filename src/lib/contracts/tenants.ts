import { z } from "zod";
import { IsoDateTimeSchema } from "./common";

export const TenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["active", "inactive", "suspended", "trial"]),
  plan: z.enum(["starter", "growth", "scale", "enterprise"]),
  createdAt: IsoDateTimeSchema,
  trialEndsAt: IsoDateTimeSchema.optional(),
  mrrCents: z.number().int().nonnegative(),
  seatCount: z.number().int().nonnegative(),
  region: z.string().optional(),
});
export type Tenant = z.infer<typeof TenantSchema>;

export const TenantDetailSchema = TenantSchema.extend({
  billingEmail: z.string().email(),
  billingCycle: z.enum(["monthly", "annual"]),
  nextBillingAt: IsoDateTimeSchema.optional(),
  receiptCountThisPeriod: z.number().int().nonnegative(),
  entitlements: z.array(z.string()),
  supportTier: z.enum(["standard", "priority", "enterprise"]),
});
export type TenantDetail = z.infer<typeof TenantDetailSchema>;

export const CustomerHealthSchema = z.object({
  tenantId: z.string(),
  healthScore: z.number().min(0).max(100),
  trend: z.enum(["improving", "stable", "declining"]),
  churnRisk: z.enum(["low", "medium", "high", "critical"]),
  signals: z.array(z.object({
    type: z.string(),
    severity: z.enum(["info", "warning", "critical"]),
    description: z.string(),
    detectedAt: IsoDateTimeSchema,
  })),
  lastActiveAt: IsoDateTimeSchema.optional(),
});
export type CustomerHealth = z.infer<typeof CustomerHealthSchema>;

export const ActivationFunnelSchema = z.object({
  tenantId: z.string(),
  step: z.enum(["signup", "onboarding", "first_run", "active", "churned"]),
  stuckSince: IsoDateTimeSchema.optional(),
  completedSteps: z.array(z.string()),
});
export type ActivationFunnel = z.infer<typeof ActivationFunnelSchema>;
