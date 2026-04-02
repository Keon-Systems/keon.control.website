import type { CollectiveChainEntrypoint, CollectiveChainEntrypointKind } from "./chain.dto";

type QueryValues = Record<string, string | null | undefined>;

function buildQuery(values: QueryValues = {}): string {
  const entries = Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([left], [right]) => left.localeCompare(right));

  if (entries.length === 0) {
    return "";
  }

  const search = new URLSearchParams();
  for (const [key, value] of entries) {
    search.set(key, String(value));
  }

  return `?${search.toString()}`;
}

function buildSurfacePath(kind: CollectiveChainEntrypointKind, id: string, focusedNodeId?: string | null): string {
  return `/collective/chain/${kind}/${encodeURIComponent(id)}${buildQuery({ focus: focusedNodeId ?? null })}`;
}

export function createCollectiveChainNodeHref(entrypoint: CollectiveChainEntrypoint, nodeId: string): string {
  return buildSurfacePath(entrypoint.kind, entrypoint.id, nodeId);
}

export const collectiveChainRoutes = {
  surface: {
    artifact: (artifactId: string, focusedNodeId?: string | null) =>
      buildSurfacePath("artifact", artifactId, focusedNodeId),
    activation: (activationId: string, focusedNodeId?: string | null) =>
      buildSurfacePath("activation", activationId, focusedNodeId),
    preparedEffect: (preparedEffectId: string, focusedNodeId?: string | null) =>
      buildSurfacePath("preparedEffect", preparedEffectId, focusedNodeId),
    decision: (decisionId: string, focusedNodeId?: string | null) =>
      buildSurfacePath("decision", decisionId, focusedNodeId),
    delegation: (delegationId: string, focusedNodeId?: string | null) =>
      buildSurfacePath("delegation", delegationId, focusedNodeId),
  },
} as const;
