import { z } from "zod";
import { IsoDateTimeSchema } from "./common";

export const JobStatusSchema = z.enum(["pending", "running", "succeeded", "failed", "stuck"]);
export type JobStatus = z.infer<typeof JobStatusSchema>;

export const JobSchema = z.object({
  jobId: z.string(),
  queue: z.string(),
  name: z.string(),
  status: JobStatusSchema,
  attempts: z.number().int().nonnegative(),
  maxAttempts: z.number().int().positive(),
  enqueuedAt: IsoDateTimeSchema,
  startedAt: IsoDateTimeSchema.optional(),
  completedAt: IsoDateTimeSchema.optional(),
  lastError: z.string().optional(),
  tenantId: z.string().optional(),
  priority: z.number().int().optional(),
});
export type Job = z.infer<typeof JobSchema>;

export const QueueHealthSchema = z.object({
  queueName: z.string(),
  depth: z.number().int().nonnegative(),
  processingRate: z.number().nonnegative(),
  failureRate: z.number().min(0).max(1),
  oldestPendingAge: z.number().nonnegative(),
  stuckCount: z.number().int().nonnegative(),
  status: z.enum(["healthy", "degraded", "stuck", "empty"]),
});
export type QueueHealth = z.infer<typeof QueueHealthSchema>;
