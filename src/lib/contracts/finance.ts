import { z } from "zod";
import { IsoDateTimeSchema } from "./common";

export const MrrSummarySchema = z.object({
  mrr: z.number().nonnegative(),
  arr: z.number().nonnegative(),
  activeSubscriptions: z.number().int().nonnegative(),
  trialSubscriptions: z.number().int().nonnegative(),
  newMrr30d: z.number(),
  churned30d: z.number().nonnegative(),
  expansionMrr30d: z.number(),
  contractionMrr30d: z.number(),
  netMrrGrowth30d: z.number(),
  calculatedAt: IsoDateTimeSchema,
});
export type MrrSummary = z.infer<typeof MrrSummarySchema>;

export const BillingEventSchema = z.object({
  eventId: z.string(),
  tenantId: z.string(),
  type: z.enum(["charge", "refund", "credit", "invoice", "dispute"]),
  amountCents: z.number().int(),
  currency: z.string().default("usd"),
  status: z.enum(["succeeded", "failed", "pending", "refunded"]),
  timestamp: IsoDateTimeSchema,
  invoiceId: z.string().optional(),
  description: z.string().optional(),
});
export type BillingEvent = z.infer<typeof BillingEventSchema>;

export const CollectionItemSchema = z.object({
  tenantId: z.string(),
  tenantName: z.string(),
  invoiceId: z.string(),
  amountCents: z.number().int().nonnegative(),
  currency: z.string().default("usd"),
  failedAt: IsoDateTimeSchema,
  nextRetryAt: IsoDateTimeSchema.optional(),
  dunningStep: z.number().int().min(0).max(4),
  status: z.enum(["open", "closed", "written_off"]),
  planTier: z.string().optional(),
});
export type CollectionItem = z.infer<typeof CollectionItemSchema>;

export const AzureSpendByServiceSchema = z.object({
  service: z.string(),
  spendUsd: z.number().nonnegative(),
  budgetUsd: z.number().nonnegative().optional(),
  percentOfTotal: z.number().min(0).max(100),
});

export const AzureSpendAnomalySchema = z.object({
  service: z.string(),
  description: z.string(),
  deltaUsd: z.number(),
  detectedAt: IsoDateTimeSchema,
});

export const AzureSpendSchema = z.object({
  period: z.enum(["30d", "60d", "90d"]),
  totalSpend: z.number().nonnegative(),
  budgetAmount: z.number().nonnegative(),
  forecastSpend: z.number().nonnegative(),
  byService: z.array(AzureSpendByServiceSchema),
  anomalies: z.array(AzureSpendAnomalySchema),
  calculatedAt: IsoDateTimeSchema,
});
export type AzureSpend = z.infer<typeof AzureSpendSchema>;
