import { z } from "zod";
import { IsoDateTimeSchema } from "./common";

export const DeliveryChannelSchema = z.object({
  channel: z.enum(["email", "webhook"]),
  successRate: z.number().min(0).max(1),
  bounceCount: z.number().int().nonnegative(),
  retryQueueDepth: z.number().int().nonnegative(),
  last24hSent: z.number().int().nonnegative(),
  last24hFailed: z.number().int().nonnegative(),
  avgDeliveryMs: z.number().nonnegative().optional(),
  status: z.enum(["healthy", "degraded", "down"]),
  lastCheckedAt: IsoDateTimeSchema,
});
export type DeliveryChannel = z.infer<typeof DeliveryChannelSchema>;

export const DeliveryEventSchema = z.object({
  eventId: z.string(),
  channel: z.enum(["email", "webhook"]),
  tenantId: z.string().optional(),
  recipient: z.string(),
  status: z.enum(["delivered", "bounced", "failed", "pending", "retrying"]),
  attempts: z.number().int().nonnegative(),
  sentAt: IsoDateTimeSchema,
  deliveredAt: IsoDateTimeSchema.optional(),
  errorMessage: z.string().optional(),
});
export type DeliveryEvent = z.infer<typeof DeliveryEventSchema>;
