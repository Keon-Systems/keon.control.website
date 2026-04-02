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
import { presentExecutionEligibilityStatus } from "./normalization";
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


export function createExecutionEligibilityRepository(
  dependencies: Partial<ExecutionEligibilityDependencies> = {},
): ExecutionEligibilityRepository {
  const preparedEffects = dependencies.preparedEffects ?? createPreparedEffectRepository();
  const activations = dependencies.activations ?? createAuthorityActivationRepository();
  const permissions = dependencies.permissions ?? createAgentPermissionRepository();
  const delegations = dependencies.delegations ?? createDelegatedAuthorityRepository();
  const clock = dependencies.clock ?? (() => new Date());

  return {
    async evaluate(preparedEffectId) {
      const preparedEffect = await preparedEffects.detail(preparedEffectId);
      const evaluatedAt = clock();
      const evaluatedAtUtc = evaluatedAt.toISOString();
      const nowUtc = evaluatedAt.getTime();

      const [activation, permission, delegation] = await Promise.all([
        activations.detail(preparedEffect.activationId).catch(() => null),
        permissions.detail(preparedEffect.permissionGrantId).catch(() => null),
        delegations.detail(preparedEffect.delegationGrantId).catch(() => null),
      ]);

      const reasons: ExecutionEligibilityReason[] = [];

      if (!isPreparedEffectReady(preparedEffect, nowUtc)) {
        reasons.push(reason("prepared_effect_not_ready", "Prepared effect is not ready."));
      }

      if (!activation) {
        reasons.push(reason("activation_missing", "Activation record is missing."));
      }

      if (activation && !isActivationActive(activation, nowUtc)) {
        reasons.push(reason("activation_not_active", "Activation is not active."));
      }

      if (!permission || !isPermissionLifecycleValid(permission, nowUtc)) {
        reasons.push(reason("permission_invalid", "Permission is not valid."));
      }

      if (permission && Date.parse(permission.expiresAtUtc) <= nowUtc) {
        reasons.push(reason("permission_expired", "Permission is expired."));
      }

      if (!delegation || !isDelegationLifecycleValid(delegation, nowUtc)) {
        reasons.push(reason("delegation_invalid", "Delegation is not valid."));
      }

      if (permission?.revocation || delegation?.revocation || activation?.termination?.terminalStatus === "Revoked") {
        reasons.push(reason("upstream_revoked", "Upstream authority has been revoked."));
      }

      const scopeMismatch = Boolean(
        activation
          && permission
          && delegation
          && (
            !isScopeAligned(
              {
                tenantId: preparedEffect.tenantId,
                domainScope: preparedEffect.domainScope,
                authorityClass: preparedEffect.authorityClass,
                effectClass: preparedEffect.effectClass,
                actionCategories: [preparedEffect.actionCategory],
                capabilityCategories: [preparedEffect.capabilityCategory],
                targetClass: preparedEffect.targetClass,
              },
              {
                tenantId: preparedEffect.activatedScope.tenantId,
                domainScope: preparedEffect.activatedScope.domainScope,
                policyScope: preparedEffect.activatedScope.policyScope,
                authorityClass: preparedEffect.activatedScope.authorityClass,
                effectClass: preparedEffect.activatedScope.effectClass,
                actionCategories: preparedEffect.activatedScope.actionCategories,
                capabilityCategories: preparedEffect.activatedScope.capabilityCategories,
                targetClass: preparedEffect.inheritedTargetClass,
              },
            )
            || !isScopeAligned(
              {
                tenantId: activation.permittedAuthorityScope?.tenantId ?? activation.tenantId,
                domainScope: activation.permittedAuthorityScope?.domainScope ?? activation.domainScope,
                policyScope: activation.permittedAuthorityScope?.policyScope ?? activation.policyScope,
                authorityClass: activation.permittedAuthorityScope?.authorityClass ?? activation.authorityClass,
                effectClass: activation.permittedAuthorityScope?.effectClass ?? activation.effectClass,
                actionCategories: activation.permittedAuthorityScope?.actionCategories ?? activation.actionCategories,
                capabilityCategories: activation.permittedAuthorityScope?.capabilityCategories ?? activation.capabilityCategories,
              },
              {
                tenantId: permission.tenantId,
                domainScope: permission.domainScope,
                policyScope: permission.policyScope,
                authorityClass: permission.authorityClass,
                effectClass: permission.effectClass,
                actionCategories: permission.actionCategories,
                capabilityCategories: permission.capabilityCategories,
              },
            )
            || !isScopeAligned(
              {
                tenantId: permission.delegatedAuthorityScope?.tenantId ?? permission.tenantId,
                domainScope: permission.delegatedAuthorityScope?.domainScope ?? permission.domainScope,
                policyScope: permission.delegatedAuthorityScope?.policyScope ?? permission.policyScope,
                authorityClass: permission.delegatedAuthorityScope?.authorityClass ?? permission.authorityClass,
                effectClass: permission.delegatedAuthorityScope?.effectClass ?? permission.effectClass,
              },
              {
                tenantId: delegation.tenantId,
                domainScope: delegation.domainScope,
                policyScope: delegation.policyScope,
                authorityClass: delegation.authorityClass,
                effectClass: delegation.effectClass,
              },
            )
          ),
      );

      if (scopeMismatch) {
        reasons.push(reason("scope_mismatch", "Effect scope exceeds delegated bounds."));
      }

      const status = reasons.length === 0 ? "eligible" : "not_eligible";
      const presentation = presentExecutionEligibilityStatus(status);
      const tone = resolveExecutionEligibilityTone(status, reasons);

      return {
        preparedEffectId,
        status,
        reasons,
        evaluatedAtUtc,
        statusPresentation: {
          label: presentation.label,
          tone,
        },
      };
    },
  };
}
