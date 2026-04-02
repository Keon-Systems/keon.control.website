function normalizeObject<T extends object>(value: T): T {
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));

  return Object.fromEntries(entries) as T;
}

export const collectiveChainQueryKeys = {
  all: ["collective", "chain"] as const,
  byArtifactId: (artifactId: string) =>
    ["collective", "chain", "artifact", artifactId] as const,
  byPreparedEffectId: (preparedEffectId: string) =>
    ["collective", "chain", "prepared-effect", preparedEffectId] as const,
  byActivationId: (activationId: string) =>
    ["collective", "chain", "activation", activationId] as const,
  byDecisionId: (decisionId: string) =>
    ["collective", "chain", "decision", decisionId] as const,
  byDelegationId: (delegationId: string) =>
    ["collective", "chain", "delegation", delegationId] as const,
  focus: (chainId: string, focusedNodeId?: string | null) =>
    ["collective", "chain", "focus", normalizeObject({ chainId, focusedNodeId: focusedNodeId ?? null })] as const,
} as const;
