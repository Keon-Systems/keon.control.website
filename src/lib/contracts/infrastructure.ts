import { z } from "zod";
import { IsoDateTimeSchema } from "./common";

export const ResourceStatusSchema = z.enum(["healthy", "degraded", "unhealthy", "unknown"]);
export type ResourceStatus = z.infer<typeof ResourceStatusSchema>;

export const AzureResourceSchema = z.object({
  resourceId: z.string(),
  name: z.string(),
  type: z.string(),
  resourceGroup: z.string(),
  location: z.string(),
  status: ResourceStatusSchema,
  monthlyCostUsd: z.number().nonnegative(),
  tags: z.record(z.string(), z.string()).optional(),
  lastUpdatedAt: IsoDateTimeSchema,
});
export type AzureResource = z.infer<typeof AzureResourceSchema>;

export const AzureBudgetAlertSchema = z.object({
  alertId: z.string(),
  budgetName: z.string(),
  severity: z.enum(["warning", "critical"]),
  currentSpendUsd: z.number().nonnegative(),
  budgetAmountUsd: z.number().nonnegative(),
  percentUsed: z.number().min(0),
  delta: z.number(),
  triggeredAt: IsoDateTimeSchema,
  period: z.string(),
});
export type AzureBudgetAlert = z.infer<typeof AzureBudgetAlertSchema>;

export const ResourceGroupHealthSchema = z.object({
  resourceGroup: z.string(),
  region: z.string(),
  status: ResourceStatusSchema,
  resourceCount: z.number().int().nonnegative(),
  unhealthyCount: z.number().int().nonnegative(),
  totalMonthlyCostUsd: z.number().nonnegative(),
  lastCheckedAt: IsoDateTimeSchema,
});
export type ResourceGroupHealth = z.infer<typeof ResourceGroupHealthSchema>;
