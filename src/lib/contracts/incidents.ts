import { z } from "zod";
import { IsoDateTimeSchema } from "./common";

export const IncidentSeveritySchema = z.enum(["sev1", "sev2", "sev3", "sev4"]);
export type IncidentSeverity = z.infer<typeof IncidentSeveritySchema>;

export const IncidentStatusSchema = z.enum(["open", "investigating", "mitigated", "resolved", "postmortem"]);
export type IncidentStatus = z.infer<typeof IncidentStatusSchema>;

export const IncidentSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: IncidentSeveritySchema,
  status: IncidentStatusSchema,
  startedAt: IsoDateTimeSchema,
  resolvedAt: IsoDateTimeSchema.optional(),
  tenantIds: z.array(z.string()),
  affectedSubsystems: z.array(z.string()),
  incidentCommander: z.string().optional(),
  receiptId: z.string().optional(),
});
export type Incident = z.infer<typeof IncidentSchema>;

export const IncidentEventSchema = z.object({
  eventId: z.string(),
  incidentId: z.string(),
  type: z.enum(["status_change", "update", "action", "communication", "resolved"]),
  actorId: z.string(),
  description: z.string(),
  timestamp: IsoDateTimeSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type IncidentEvent = z.infer<typeof IncidentEventSchema>;

export const IncidentDeclarationSchema = z.object({
  title: z.string(),
  severity: IncidentSeveritySchema,
  rootSubsystem: z.string(),
  affectedComponents: z.array(z.string()),
  tenantIds: z.array(z.string()).optional(),
  initialSummary: z.string(),
  incidentCommander: z.string().optional(),
});
export type IncidentDeclaration = z.infer<typeof IncidentDeclarationSchema>;

export const IncidentCommsSchema = z.object({
  messageId: z.string(),
  incidentId: z.string(),
  channel: z.enum(["internal", "status_page", "email", "slack"]),
  content: z.string(),
  sentAt: IsoDateTimeSchema,
  sentBy: z.string(),
  tenantIds: z.array(z.string()).optional(),
});
export type IncidentComms = z.infer<typeof IncidentCommsSchema>;
