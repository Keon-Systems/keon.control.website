import { z } from "zod";
import { IsoDateTimeSchema } from "./common";

export const LegalHoldSchema = z.object({
  holdId: z.string(),
  tenantId: z.string(),
  reason: z.string(),
  createdAt: IsoDateTimeSchema,
  status: z.enum(["ACTIVE", "RELEASED"]),
});

export type LegalHold = z.infer<typeof LegalHoldSchema>;

export const AuditCaseSchema = z.object({
  caseId: z.string(),
  tenantId: z.string(),
  status: z.string(),
  createdAt: IsoDateTimeSchema,
  evidencePackIds: z.array(z.string()).default([]),
});

export type AuditCase = z.infer<typeof AuditCaseSchema>;

export const ComplianceSummarySchema = z.object({
  legalHolds: z.array(LegalHoldSchema),
  auditCases: z.array(AuditCaseSchema),
});

export type ComplianceSummary = z.infer<typeof ComplianceSummarySchema>;
