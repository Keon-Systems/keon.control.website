import { z } from "zod";
import { IsoDateTimeSchema, PrivilegeLevelSchema } from "./common";

export const OverrideRequestSchema = z.object({
  tenantId: z.string(),
  targetType: z.enum(["feature_flag", "rate_limit", "entitlement", "quota", "billing"]),
  targetId: z.string(),
  requestedValue: z.unknown(),
  rationale: z.string().min(10),
  requestedBy: z.string(),
  requestedAt: IsoDateTimeSchema.optional(),
  expiresAt: IsoDateTimeSchema.optional(),
  requiredPrivilegeLevel: PrivilegeLevelSchema,
});
export type OverrideRequest = z.infer<typeof OverrideRequestSchema>;

export const OverrideReceiptSchema = z.object({
  receiptId: z.string(),
  overrideId: z.string(),
  tenantId: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  appliedValue: z.unknown(),
  previousValue: z.unknown().optional(),
  appliedBy: z.string(),
  appliedAt: IsoDateTimeSchema,
  expiresAt: IsoDateTimeSchema.optional(),
  rationale: z.string(),
  status: z.enum(["active", "expired", "revoked"]),
});
export type OverrideReceipt = z.infer<typeof OverrideReceiptSchema>;
