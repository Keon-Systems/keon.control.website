import { z } from "zod";
import { IsoDateTimeSchema, PrivilegeLevelSchema, OperatorRoleSchema } from "./common";

export const OperatorRoleDefinitionSchema = z.object({
  roleId: z.string(),
  name: z.string(),
  description: z.string(),
  privilegeLevel: PrivilegeLevelSchema,
  permissions: z.array(z.string()),
  canDelegate: z.boolean(),
});
export type OperatorRoleDefinition = z.infer<typeof OperatorRoleDefinitionSchema>;

export const OperatorSchema = z.object({
  operatorId: z.string(),
  displayName: z.string(),
  email: z.string().email(),
  role: OperatorRoleSchema,
  privilegeLevel: PrivilegeLevelSchema,
  status: z.enum(["active", "inactive", "locked"]),
  createdAt: IsoDateTimeSchema,
  lastActiveAt: IsoDateTimeSchema.optional(),
  mfaEnabled: z.boolean(),
  teams: z.array(z.string()).optional(),
});
export type Operator = z.infer<typeof OperatorSchema>;

export const ApiKeySchema = z.object({
  keyId: z.string(),
  name: z.string(),
  prefix: z.string(),
  operatorId: z.string(),
  scopes: z.array(z.string()),
  createdAt: IsoDateTimeSchema,
  lastUsedAt: IsoDateTimeSchema.optional(),
  expiresAt: IsoDateTimeSchema.optional(),
  status: z.enum(["active", "revoked", "expired"]),
});
export type ApiKey = z.infer<typeof ApiKeySchema>;
