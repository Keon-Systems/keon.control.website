import { z } from "zod";
import { IsoDateTimeSchema } from "./common";

export const CommChannelSchema = z.enum(["email", "in-app", "both"]);
export type CommChannel = z.infer<typeof CommChannelSchema>;

export const CommMessageSchema = z.object({
  messageId: z.string(),
  subject: z.string(),
  body: z.string(),
  tenantIds: z.union([z.array(z.string()), z.literal("all")]),
  channel: CommChannelSchema,
  status: z.enum(["draft", "sent", "failed", "scheduled"]),
  templateId: z.string().optional(),
  scheduledFor: IsoDateTimeSchema.optional(),
  sentAt: IsoDateTimeSchema.optional(),
  sentBy: z.string(),
  recipientCount: z.number().int().nonnegative().optional(),
  openRate: z.number().min(0).max(1).optional(),
});
export type CommMessage = z.infer<typeof CommMessageSchema>;

export const CommTemplateSchema = z.object({
  templateId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  subject: z.string(),
  body: z.string(),
  channel: CommChannelSchema,
  variables: z.array(z.string()),
  lastUpdatedAt: IsoDateTimeSchema,
  createdBy: z.string(),
});
export type CommTemplate = z.infer<typeof CommTemplateSchema>;

export const CommHistoryItemSchema = CommMessageSchema.pick({
  messageId: true,
  subject: true,
  channel: true,
  status: true,
  sentAt: true,
  sentBy: true,
  recipientCount: true,
}).extend({
  tenantCount: z.number().int().nonnegative(),
  failureCount: z.number().int().nonnegative(),
});
export type CommHistoryItem = z.infer<typeof CommHistoryItemSchema>;
