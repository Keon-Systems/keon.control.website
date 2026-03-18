import type { ReformAdoptionFilterState } from "./dto";

type Primitive = string | number | boolean | null | undefined;
type QueryValues = Record<string, Primitive>;

function buildQuery(params: QueryValues = {}): string {
  const entries = Object.entries(params)
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

export function extractRouteId(value: string | string[] | undefined, name: string): string {
  if (Array.isArray(value)) {
    if (value.length === 1 && value[0]) {
      return value[0];
    }
    throw new Error(`Expected a single route parameter for '${name}'.`);
  }

  if (!value) {
    throw new Error(`Missing route parameter '${name}'.`);
  }

  return value;
}

export const collectiveObservabilityRoutes = {
  api: {
    reformAdoptionList: (filters: ReformAdoptionFilterState = {}) =>
      `/api/collective/reforms/adoption${buildQuery(filters as QueryValues)}`,
    reformAdoptionDetail: (decisionId: string) =>
      `/api/collective/reforms/adoption/${encodeURIComponent(decisionId)}`,
    delegatedAuthorityList: (filters: QueryValues = {}) =>
      `/api/collective/authority/delegations${buildQuery(filters)}`,
    delegatedAuthorityDetail: (grantId: string) =>
      `/api/collective/authority/delegations/${encodeURIComponent(grantId)}`,
    delegatedAuthorityLineage: (grantId: string) =>
      `/api/collective/authority/delegations/${encodeURIComponent(grantId)}/lineage`,
    agentPermissionList: (filters: QueryValues = {}) =>
      `/api/collective/authority/permissions${buildQuery(filters)}`,
    agentPermissionDetail: (grantId: string) =>
      `/api/collective/authority/permissions/${encodeURIComponent(grantId)}`,
    agentPermissionLineage: (grantId: string) =>
      `/api/collective/authority/permissions/${encodeURIComponent(grantId)}/lineage`,
    authorityActivationList: (filters: QueryValues = {}) =>
      `/api/collective/authority/activations${buildQuery(filters)}`,
    authorityActivationDetail: (activationId: string) =>
      `/api/collective/authority/activations/${encodeURIComponent(activationId)}`,
    authorityActivationHistory: (activationId: string) =>
      `/api/collective/authority/activations/${encodeURIComponent(activationId)}/history`,
    authorityActivationLineage: (activationId: string) =>
      `/api/collective/authority/activations/${encodeURIComponent(activationId)}/lineage`,
    preparedEffectList: (filters: QueryValues = {}) =>
      `/api/collective/effects/prepared${buildQuery(filters)}`,
    preparedEffectDetail: (preparedRequestId: string) =>
      `/api/collective/effects/prepared/${encodeURIComponent(preparedRequestId)}`,
    preparedEffectLineage: (preparedRequestId: string) =>
      `/api/collective/effects/prepared/${encodeURIComponent(preparedRequestId)}/lineage`,
  },
} as const;
