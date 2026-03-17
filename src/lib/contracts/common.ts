import { z } from "zod";

export const RiskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const RunModeSchema = z.enum(["AUDIT_ONLY", "ENFORCE"]);
export type RunMode = z.infer<typeof RunModeSchema>;

export const RunStatusSchema = z.enum([
  "QUEUED",
  "RUNNING",
  "GATE_REQUIRED",
  "COMPLETED",
  "DENIED",
  "FAILED",
  "SEALED",
]);
export type RunStatus = z.infer<typeof RunStatusSchema>;

export const IsoDateTimeSchema = z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
  message: "Invalid ISO datetime",
});

export const Sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/, "Expected sha256:<64-hex>");

export const RhidSchema = z.string().regex(/^rhid:(receipt|artifact|llm|toolio|policy|gate|logslice|deliberation|reform|lineage):[a-f0-9-]+$/, "Invalid RHID format");
export type Rhid = z.infer<typeof RhidSchema>;

