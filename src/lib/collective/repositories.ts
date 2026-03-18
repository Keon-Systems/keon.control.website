import { z } from "zod";
import { ApiError } from "@/lib/api/http";
import {
  GetAgentPermissionGrantDetailResponseSchema,
  GetAgentPermissionLineageResponseSchema,
  GetAuthorityActivationDetailResponseSchema,
  GetAuthorityActivationHistoryResponseSchema,
  GetAuthorityActivationLineageResponseSchema,
  GetDelegatedAuthorityGrantDetailResponseSchema,
  GetDelegatedAuthorityLineageResponseSchema,
  GetPreparedEffectLineageResponseSchema,
  GetPreparedEffectRequestDetailResponseSchema,
  GetReformAdoptionDecisionDetailResponseSchema,
  ListAgentPermissionGrantsResponseSchema,
  ListAuthorityActivationsResponseSchema,
  ListDelegatedAuthorityGrantsResponseSchema,
  ListPreparedEffectRequestsResponseSchema,
  ListReformAdoptionDecisionsResponseSchema,
} from "@/lib/contracts/collective-observability";
import {
  adaptAgentPermissionGrantDetail,
  adaptAgentPermissionGrantListItem,
  adaptAgentPermissionLineage,
  adaptAuthorityActivationDetail,
  adaptAuthorityActivationHistory,
  adaptAuthorityActivationLineage,
  adaptAuthorityActivationListItem,
  adaptDelegatedAuthorityGrantDetail,
  adaptDelegatedAuthorityGrantListItem,
  adaptDelegatedAuthorityLineage,
  adaptPreparedEffectDetail,
  adaptPreparedEffectLineage,
  adaptPreparedEffectListItem,
  adaptReformAdoptionDecisionDetail,
  adaptReformAdoptionDecisionListItem,
} from "./adapters";
import type {
  AgentPermissionGrantDetail,
  AgentPermissionGrantListItem,
  AgentPermissionLineageNode,
  AuthorityActivationDetail,
  AuthorityActivationHistoryEntry,
  AuthorityActivationLineageNode,
  AuthorityActivationListItem,
  DelegatedAuthorityGrantDetail,
  DelegatedAuthorityGrantListItem,
  DelegatedAuthorityLineageNode,
  PreparedEffectLineageNode,
  PreparedEffectRequestDetail,
  PreparedEffectRequestListItem,
  ReformAdoptionDecisionDetail,
  ReformAdoptionDecisionListItem,
  ReformAdoptionFilterState,
} from "./dto";
import {
  buildMockAgentPermissionListResponse,
  buildMockAuthorityActivationListResponse,
  buildMockDelegatedAuthorityListResponse,
  buildMockPreparedEffectListResponse,
  buildMockReformAdoptionListResponse,
  getMockAgentPermissionDetailResponse,
  getMockAgentPermissionLineageResponse,
  getMockAuthorityActivationDetailResponse,
  getMockAuthorityActivationHistoryResponse,
  getMockAuthorityActivationLineageResponse,
  getMockDelegatedAuthorityDetailResponse,
  getMockDelegatedAuthorityLineageResponse,
  getMockPreparedEffectDetailResponse,
  getMockPreparedEffectLineageResponse,
  getMockReformAdoptionDetailResponse,
} from "./mocks";
import { collectiveObservabilityRoutes } from "./routes";

const envelopeSchema = <TSchema extends z.ZodTypeAny>(schema: TSchema) =>
  z.object({
    mode: z.enum(["MOCK", "LIVE"]).optional(),
    generatedAt: z.string().optional(),
    governance: z.object({
      determinismStatus: z.string(),
      sealValidationResult: z.string(),
      incidentFlag: z.boolean(),
    }).optional(),
    data: z.array(schema),
    source: z.string().optional(),
    mockLabel: z.string().optional(),
  });

type Fetcher = typeof fetch;

type PrimitiveFilter = Record<string, string | undefined>;

async function fetchEnvelope<TSchema extends z.ZodTypeAny>(fetcher: Fetcher, path: string, schema: TSchema): Promise<z.infer<TSchema>> {
  const response = await fetcher(path, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  const text = await response.text();
  const json = text ? safeJson(text) : undefined;

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      code: "HTTP_ERROR",
      message: response.statusText,
      details: json,
    });
  }

  const parsed = envelopeSchema(schema).safeParse(json);
  if (!parsed.success || parsed.data.data.length === 0) {
    throw new ApiError({
      status: 500,
      code: "SCHEMA_MISMATCH",
      message: "Collective observability response did not match expected schema.",
      details: parsed.success ? undefined : parsed.error.flatten(),
    });
  }

  return parsed.data.data[0];
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export interface ReformAdoptionProvider {
  list(filters?: ReformAdoptionFilterState): Promise<ReturnType<typeof buildMockReformAdoptionListResponse>>;
  detail(decisionId: string): Promise<NonNullable<ReturnType<typeof getMockReformAdoptionDetailResponse>>>;
}

export interface DelegatedAuthorityProvider {
  list(filters?: PrimitiveFilter): Promise<ReturnType<typeof buildMockDelegatedAuthorityListResponse>>;
  detail(grantId: string): Promise<NonNullable<ReturnType<typeof getMockDelegatedAuthorityDetailResponse>>>;
  lineage(grantId: string): Promise<NonNullable<ReturnType<typeof getMockDelegatedAuthorityLineageResponse>>>;
}

export interface AgentPermissionProvider {
  list(filters?: PrimitiveFilter): Promise<ReturnType<typeof buildMockAgentPermissionListResponse>>;
  detail(grantId: string): Promise<NonNullable<ReturnType<typeof getMockAgentPermissionDetailResponse>>>;
  lineage(grantId: string): Promise<NonNullable<ReturnType<typeof getMockAgentPermissionLineageResponse>>>;
}

export interface AuthorityActivationProvider {
  list(filters?: PrimitiveFilter): Promise<ReturnType<typeof buildMockAuthorityActivationListResponse>>;
  detail(activationId: string): Promise<NonNullable<ReturnType<typeof getMockAuthorityActivationDetailResponse>>>;
  history(activationId: string): Promise<NonNullable<ReturnType<typeof getMockAuthorityActivationHistoryResponse>>>;
  lineage(activationId: string): Promise<NonNullable<ReturnType<typeof getMockAuthorityActivationLineageResponse>>>;
}

export interface PreparedEffectProvider {
  list(filters?: PrimitiveFilter): Promise<ReturnType<typeof buildMockPreparedEffectListResponse>>;
  detail(preparedRequestId: string): Promise<NonNullable<ReturnType<typeof getMockPreparedEffectDetailResponse>>>;
  lineage(preparedRequestId: string): Promise<NonNullable<ReturnType<typeof getMockPreparedEffectLineageResponse>>>;
}

export function createMockReformAdoptionProvider(): ReformAdoptionProvider {
  return {
    async list(filters = {}) {
      return buildMockReformAdoptionListResponse(filters);
    },
    async detail(decisionId) {
      const result = getMockReformAdoptionDetailResponse(decisionId);
      if (!result) throw new Error(`Unknown reform adoption decision '${decisionId}'.`);
      return result;
    },
  };
}

export function createMockDelegatedAuthorityProvider(): DelegatedAuthorityProvider {
  return {
    async list() {
      return buildMockDelegatedAuthorityListResponse();
    },
    async detail(grantId) {
      const result = getMockDelegatedAuthorityDetailResponse(grantId);
      if (!result) throw new Error(`Unknown delegation grant '${grantId}'.`);
      return result;
    },
    async lineage(grantId) {
      const result = getMockDelegatedAuthorityLineageResponse(grantId);
      if (!result) throw new Error(`Unknown delegation lineage '${grantId}'.`);
      return result;
    },
  };
}

export function createMockAgentPermissionProvider(): AgentPermissionProvider {
  return {
    async list() {
      return buildMockAgentPermissionListResponse();
    },
    async detail(grantId) {
      const result = getMockAgentPermissionDetailResponse(grantId);
      if (!result) throw new Error(`Unknown permission grant '${grantId}'.`);
      return result;
    },
    async lineage(grantId) {
      const result = getMockAgentPermissionLineageResponse(grantId);
      if (!result) throw new Error(`Unknown permission lineage '${grantId}'.`);
      return result;
    },
  };
}

export function createMockAuthorityActivationProvider(): AuthorityActivationProvider {
  return {
    async list() {
      return buildMockAuthorityActivationListResponse();
    },
    async detail(activationId) {
      const result = getMockAuthorityActivationDetailResponse(activationId);
      if (!result) throw new Error(`Unknown authority activation '${activationId}'.`);
      return result;
    },
    async history(activationId) {
      const result = getMockAuthorityActivationHistoryResponse(activationId);
      if (!result) throw new Error(`Unknown authority activation history '${activationId}'.`);
      return result;
    },
    async lineage(activationId) {
      const result = getMockAuthorityActivationLineageResponse(activationId);
      if (!result) throw new Error(`Unknown authority activation lineage '${activationId}'.`);
      return result;
    },
  };
}

export function createMockPreparedEffectProvider(): PreparedEffectProvider {
  return {
    async list() {
      return buildMockPreparedEffectListResponse();
    },
    async detail(preparedRequestId) {
      const result = getMockPreparedEffectDetailResponse(preparedRequestId);
      if (!result) throw new Error(`Unknown prepared effect '${preparedRequestId}'.`);
      return result;
    },
    async lineage(preparedRequestId) {
      const result = getMockPreparedEffectLineageResponse(preparedRequestId);
      if (!result) throw new Error(`Unknown prepared effect lineage '${preparedRequestId}'.`);
      return result;
    },
  };
}

export function createApiReformAdoptionProvider(fetcher: Fetcher = fetch): ReformAdoptionProvider {
  return {
    async list(filters = {}) {
      return fetchEnvelope(fetcher, collectiveObservabilityRoutes.api.reformAdoptionList(filters), ListReformAdoptionDecisionsResponseSchema);
    },
    async detail(decisionId) {
      return fetchEnvelope(fetcher, collectiveObservabilityRoutes.api.reformAdoptionDetail(decisionId), GetReformAdoptionDecisionDetailResponseSchema);
    },
  };
}

export function createApiDelegatedAuthorityProvider(fetcher: Fetcher = fetch): DelegatedAuthorityProvider {
  return {
    async list(filters = {}) {
      return fetchEnvelope(fetcher, collectiveObservabilityRoutes.api.delegatedAuthorityList(filters), ListDelegatedAuthorityGrantsResponseSchema);
    },
    async detail(grantId) {
      return fetchEnvelope(fetcher, collectiveObservabilityRoutes.api.delegatedAuthorityDetail(grantId), GetDelegatedAuthorityGrantDetailResponseSchema);
    },
    async lineage(grantId) {
      return fetchEnvelope(fetcher, collectiveObservabilityRoutes.api.delegatedAuthorityLineage(grantId), GetDelegatedAuthorityLineageResponseSchema);
    },
  };
}

export function createApiAgentPermissionProvider(fetcher: Fetcher = fetch): AgentPermissionProvider {
  return {
    async list(filters = {}) {
      return fetchEnvelope(fetcher, collectiveObservabilityRoutes.api.agentPermissionList(filters), ListAgentPermissionGrantsResponseSchema);
    },
    async detail(grantId) {
      return fetchEnvelope(fetcher, collectiveObservabilityRoutes.api.agentPermissionDetail(grantId), GetAgentPermissionGrantDetailResponseSchema);
    },
    async lineage(grantId) {
      return fetchEnvelope(fetcher, collectiveObservabilityRoutes.api.agentPermissionLineage(grantId), GetAgentPermissionLineageResponseSchema);
    },
  };
}

export function createApiAuthorityActivationProvider(fetcher: Fetcher = fetch): AuthorityActivationProvider {
  return {
    async list(filters = {}) {
      return fetchEnvelope(fetcher, collectiveObservabilityRoutes.api.authorityActivationList(filters), ListAuthorityActivationsResponseSchema);
    },
    async detail(activationId) {
      return fetchEnvelope(fetcher, collectiveObservabilityRoutes.api.authorityActivationDetail(activationId), GetAuthorityActivationDetailResponseSchema);
    },
    async history(activationId) {
      return fetchEnvelope(fetcher, collectiveObservabilityRoutes.api.authorityActivationHistory(activationId), GetAuthorityActivationHistoryResponseSchema);
    },
    async lineage(activationId) {
      return fetchEnvelope(fetcher, collectiveObservabilityRoutes.api.authorityActivationLineage(activationId), GetAuthorityActivationLineageResponseSchema);
    },
  };
}

export function createApiPreparedEffectProvider(fetcher: Fetcher = fetch): PreparedEffectProvider {
  return {
    async list(filters = {}) {
      return fetchEnvelope(fetcher, collectiveObservabilityRoutes.api.preparedEffectList(filters), ListPreparedEffectRequestsResponseSchema);
    },
    async detail(preparedRequestId) {
      return fetchEnvelope(fetcher, collectiveObservabilityRoutes.api.preparedEffectDetail(preparedRequestId), GetPreparedEffectRequestDetailResponseSchema);
    },
    async lineage(preparedRequestId) {
      return fetchEnvelope(fetcher, collectiveObservabilityRoutes.api.preparedEffectLineage(preparedRequestId), GetPreparedEffectLineageResponseSchema);
    },
  };
}

export interface ReformAdoptionRepository {
  list(filters?: ReformAdoptionFilterState): Promise<readonly ReformAdoptionDecisionListItem[]>;
  detail(decisionId: string): Promise<ReformAdoptionDecisionDetail>;
}

export interface DelegatedAuthorityRepository {
  list(filters?: PrimitiveFilter): Promise<readonly DelegatedAuthorityGrantListItem[]>;
  detail(grantId: string): Promise<DelegatedAuthorityGrantDetail>;
  lineage(grantId: string): Promise<DelegatedAuthorityLineageNode>;
}

export interface AgentPermissionRepository {
  list(filters?: PrimitiveFilter): Promise<readonly AgentPermissionGrantListItem[]>;
  detail(grantId: string): Promise<AgentPermissionGrantDetail>;
  lineage(grantId: string): Promise<AgentPermissionLineageNode>;
}

export interface AuthorityActivationRepository {
  list(filters?: PrimitiveFilter): Promise<readonly AuthorityActivationListItem[]>;
  detail(activationId: string): Promise<AuthorityActivationDetail>;
  history(activationId: string): Promise<readonly AuthorityActivationHistoryEntry[]>;
  lineage(activationId: string): Promise<AuthorityActivationLineageNode>;
}

export interface PreparedEffectRepository {
  list(filters?: PrimitiveFilter): Promise<readonly PreparedEffectRequestListItem[]>;
  detail(preparedRequestId: string): Promise<PreparedEffectRequestDetail>;
  lineage(preparedRequestId: string): Promise<PreparedEffectLineageNode>;
}

export function createReformAdoptionRepository(provider: ReformAdoptionProvider = createMockReformAdoptionProvider()): ReformAdoptionRepository {
  return {
    async list(filters = {}) {
      const payload = await provider.list(filters);
      return payload.items.map(adaptReformAdoptionDecisionListItem);
    },
    async detail(decisionId) {
      const payload = await provider.detail(decisionId);
      return adaptReformAdoptionDecisionDetail(payload.decision, payload.mutationReceiptGroups);
    },
  };
}

export function createDelegatedAuthorityRepository(provider: DelegatedAuthorityProvider = createMockDelegatedAuthorityProvider()): DelegatedAuthorityRepository {
  return {
    async list(filters = {}) {
      const payload = await provider.list(filters);
      return payload.items.map(adaptDelegatedAuthorityGrantListItem);
    },
    async detail(grantId) {
      const payload = await provider.detail(grantId);
      return adaptDelegatedAuthorityGrantDetail(payload.grant);
    },
    async lineage(grantId) {
      const payload = await provider.lineage(grantId);
      return adaptDelegatedAuthorityLineage(payload.lineage);
    },
  };
}

export function createAgentPermissionRepository(provider: AgentPermissionProvider = createMockAgentPermissionProvider()): AgentPermissionRepository {
  return {
    async list(filters = {}) {
      const payload = await provider.list(filters);
      return payload.items.map(adaptAgentPermissionGrantListItem);
    },
    async detail(grantId) {
      const payload = await provider.detail(grantId);
      return adaptAgentPermissionGrantDetail(payload.grant);
    },
    async lineage(grantId) {
      const payload = await provider.lineage(grantId);
      return adaptAgentPermissionLineage(payload.lineage);
    },
  };
}

export function createAuthorityActivationRepository(provider: AuthorityActivationProvider = createMockAuthorityActivationProvider()): AuthorityActivationRepository {
  return {
    async list(filters = {}) {
      const payload = await provider.list(filters);
      return payload.items.map(adaptAuthorityActivationListItem);
    },
    async detail(activationId) {
      const payload = await provider.detail(activationId);
      return adaptAuthorityActivationDetail(payload.activation);
    },
    async history(activationId) {
      const payload = await provider.history(activationId);
      return adaptAuthorityActivationHistory(payload.history);
    },
    async lineage(activationId) {
      const payload = await provider.lineage(activationId);
      return adaptAuthorityActivationLineage(payload.lineage);
    },
  };
}

export function createPreparedEffectRepository(provider: PreparedEffectProvider = createMockPreparedEffectProvider()): PreparedEffectRepository {
  return {
    async list(filters = {}) {
      const payload = await provider.list(filters);
      return payload.items.map(adaptPreparedEffectListItem);
    },
    async detail(preparedRequestId) {
      const payload = await provider.detail(preparedRequestId);
      return adaptPreparedEffectDetail(payload.preparedEffect);
    },
    async lineage(preparedRequestId) {
      const payload = await provider.lineage(preparedRequestId);
      return adaptPreparedEffectLineage(payload.lineage);
    },
  };
}
