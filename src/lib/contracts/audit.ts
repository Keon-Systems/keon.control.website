import { z } from "zod";
import { IsoDateTimeSchema, PrivilegeLevelSchema } from "./common";

export const AuditEntrySchema = z.object({
  entryId: z.string(),
  actorId: z.string(),
  actorDisplay: z.string(),
  action: z.string(),
  target: z.string(),
  privilegeLevel: PrivilegeLevelSchema,
  timestamp: IsoDateTimeSchema,
  receiptId: z.string().optional(),
  rationale: z.string().optional(),
  result: z.enum(["allowed", "denied", "escalated"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type AuditEntry = z.infer<typeof AuditEntrySchema>;
