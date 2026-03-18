import type { ReformAdoptionFilterState } from "./dto";

function normalizeObject<T extends object>(value: T = {} as T): T {
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));

  return Object.fromEntries(entries) as T;
}

export const collectiveObservabilityQueryKeys = {
  reformAdoption: {
    all: ["collective", "reform-adoption"] as const,
    list: (filters: ReformAdoptionFilterState = {}) =>
      ["collective", "reform-adoption", "list", normalizeObject(filters)] as const,
    detail: (decisionId: string) =>
      ["collective", "reform-adoption", "detail", decisionId] as const,
  },
  delegatedAuthority: {
    all: ["collective", "delegated-authority"] as const,
    list: (filters: Record<string, unknown> = {}) =>
      ["collective", "delegated-authority", "list", normalizeObject(filters)] as const,
    detail: (grantId: string) =>
      ["collective", "delegated-authority", "detail", grantId] as const,
    lineage: (grantId: string) =>
      ["collective", "delegated-authority", "lineage", grantId] as const,
  },
  agentPermissions: {
    all: ["collective", "agent-permissions"] as const,
    list: (filters: Record<string, unknown> = {}) =>
      ["collective", "agent-permissions", "list", normalizeObject(filters)] as const,
    detail: (grantId: string) =>
      ["collective", "agent-permissions", "detail", grantId] as const,
    lineage: (grantId: string) =>
      ["collective", "agent-permissions", "lineage", grantId] as const,
  },
  authorityActivations: {
    all: ["collective", "authority-activations"] as const,
    list: (filters: Record<string, unknown> = {}) =>
      ["collective", "authority-activations", "list", normalizeObject(filters)] as const,
    detail: (activationId: string) =>
      ["collective", "authority-activations", "detail", activationId] as const,
    history: (activationId: string) =>
      ["collective", "authority-activations", "history", activationId] as const,
    lineage: (activationId: string) =>
      ["collective", "authority-activations", "lineage", activationId] as const,
  },
  preparedEffects: {
    all: ["collective", "prepared-effects"] as const,
    list: (filters: Record<string, unknown> = {}) =>
      ["collective", "prepared-effects", "list", normalizeObject(filters)] as const,
    detail: (preparedRequestId: string) =>
      ["collective", "prepared-effects", "detail", preparedRequestId] as const,
    lineage: (preparedRequestId: string) =>
      ["collective", "prepared-effects", "lineage", preparedRequestId] as const,
  },
} as const;
