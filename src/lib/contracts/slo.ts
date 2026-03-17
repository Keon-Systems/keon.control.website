import { z } from "zod";
import { IsoDateTimeSchema } from "./common";

export const SloDefinitionSchema = z.object({
  sloId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  target: z.number().min(0).max(1),
  window: z.enum(["7d", "30d", "90d"]),
  service: z.string(),
  indicator: z.enum(["availability", "latency_p99", "latency_p50", "error_rate", "throughput"]),
});
export type SloDefinition = z.infer<typeof SloDefinitionSchema>;

export const SloBurnRateSchema = z.object({
  sloId: z.string(),
  sloName: z.string(),
  target: z.number().min(0).max(1),
  window: z.string(),
  burnRate: z.number().nonnegative(),
  errorBudgetRemaining: z.number().min(0).max(1),
  errorBudgetTotal: z.number().min(0).max(1),
  currentErrorRate: z.number().min(0).max(1),
  status: z.enum(["healthy", "at_risk", "burning", "exhausted"]),
  calculatedAt: IsoDateTimeSchema,
});
export type SloBurnRate = z.infer<typeof SloBurnRateSchema>;

export const ErrorBudgetSchema = z.object({
  sloId: z.string(),
  budgetRemainingMinutes: z.number(),
  budgetTotalMinutes: z.number(),
  percentRemaining: z.number().min(0).max(100),
  projectedExhaustionAt: IsoDateTimeSchema.optional(),
});
export type ErrorBudget = z.infer<typeof ErrorBudgetSchema>;
