import fs from "node:fs";
import path from "node:path";
import { presentPreparedEffectStatus } from "@/lib/collective/normalization";
import { collectiveObservabilityQueryKeys } from "@/lib/collective/queryKeys";
import {
  createAgentPermissionRepository,
  createAuthorityActivationRepository,
  createDelegatedAuthorityRepository,
  createExecutionEligibilityRepository,
  createMockReformAdoptionProvider,
  createPreparedEffectRepository,
  createReformAdoptionRepository,
} from "@/lib/collective/repositories";
import { createInvocationDescriptorRepository } from "@/lib/collective/invocation-descriptor.repositories";
import { createInvocationPreviewRepository } from "@/lib/collective/invocation-preview.repositories";
import { collectiveObservabilityRoutes, extractRouteId } from "@/lib/collective/routes";
import { GUIDED_CONTENT } from "@/components/collective/collective-chain-guided-panel";

const FORBIDDEN_DESCRIPTOR_KEYS = [
  "payload",
  "requestBody",
  "inputPayloadJson",
  "requestedCapability",
  "requestedEffect",
  "command",
  "parameters",
  "href",
] as const;

describe("collective observability helpers", () => {
  function collectKeys(value: unknown, keys = new Set<string>()): Set<string> {
    if (Array.isArray(value)) {
      value.forEach((item) => collectKeys(item, keys));
      return keys;
    }

    if (value && typeof value === "object") {
      Object.entries(value).forEach(([key, nested]) => {
        keys.add(key);
        collectKeys(nested, keys);
      });
    }

    return keys;
  }

  function readSource(relativePath: string): string {
    return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
  }

  it("builds deterministic query keys and route helpers", () => {
    expect(
      collectiveObservabilityQueryKeys.reformAdoption.list({
        anchorEpochId: "epoch-1",
        proposalId: "proposal-1",
      }),
    ).toEqual([
      "collective",
      "reform-adoption",
      "list",
      { anchorEpochId: "epoch-1", proposalId: "proposal-1" },
    ]);

    expect(
      collectiveObservabilityRoutes.api.reformAdoptionList({
        proposalId: "proposal-1",
        anchorEpochId: "epoch-1",
      }),
    ).toBe("/api/collective/reforms/adoption?anchorEpochId=epoch-1&proposalId=proposal-1");

    expect(
      collectiveObservabilityQueryKeys.executionEligibility.detail("prepared-effect-001"),
    ).toEqual([
      "collective",
      "execution-eligibility",
      "detail",
      "prepared-effect-001",
    ]);

    expect(
      collectiveObservabilityQueryKeys.invocationPreview.detail("prepared-effect-001"),
    ).toEqual([
      "collective",
      "invocation-preview",
      "detail",
      "prepared-effect-001",
    ]);

    expect(
      collectiveObservabilityQueryKeys.invocationDescriptor.detail("prepared-effect-001"),
    ).toEqual([
      "collective",
      "invocation-descriptor",
      "detail",
      "prepared-effect-001",
    ]);

    expect(extractRouteId("grant-1", "grantId")).toBe("grant-1");
  });

  it("preserves inert prepared-effect presentation", () => {
    expect(presentPreparedEffectStatus("Invalidated")).toEqual({
      raw: "Invalidated",
      label: "Invalidated",
      tone: "danger",
    });
  });

  it("adapts reform adoption detail with nested mutation receipts from the mock provider", async () => {
    const repository = createReformAdoptionRepository(createMockReformAdoptionProvider());
    const detail = await repository.detail("adoption-decision-001");

    expect(detail.constitutionalMode).toBe("decisional");
    expect(detail.mutationReceiptGroups[0]?.receipts[0]?.operation).toBe("Activate");
    expect(detail.anchorReceiptRefs).toEqual([
      "receipt:reform-adoption:001",
      "receipt:legitimacy:001",
    ]);
  });

  it("evaluates execution eligibility across required mock scenarios", async () => {
    const repository = createExecutionEligibilityRepository({
      clock: () => new Date("2026-03-18T08:00:00Z"),
    });

    await expect(repository.evaluate("prepared-effect-001")).resolves.toMatchObject({
      preparedEffectId: "prepared-effect-001",
      status: "eligible",
      reasons: [],
      statusPresentation: {
        label: "Eligible",
        tone: "success",
      },
    });

    await expect(repository.evaluate("prepared-effect-003")).resolves.toMatchObject({
      status: "not_eligible",
      reasons: [{
        code: "activation_missing",
        message: "Activation record is missing.",
      }],
    });

    await expect(repository.evaluate("prepared-effect-004")).resolves.toMatchObject({
      status: "not_eligible",
      statusPresentation: {
        label: "Not Eligible",
        tone: "warning",
      },
      reasons: [
        {
          code: "permission_invalid",
          message: "Permission is not valid.",
        },
        {
          code: "permission_expired",
          message: "Permission is expired.",
        },
      ],
    });

    await expect(repository.evaluate("prepared-effect-005")).resolves.toMatchObject({
      status: "not_eligible",
      statusPresentation: {
        label: "Not Eligible",
        tone: "danger",
      },
      reasons: [{
        code: "scope_mismatch",
        message: "Effect scope exceeds delegated bounds.",
      }],
    });

    await expect(repository.evaluate("prepared-effect-006")).resolves.toMatchObject({
      status: "not_eligible",
      statusPresentation: {
        label: "Not Eligible",
        tone: "danger",
      },
      reasons: [
        {
          code: "delegation_invalid",
          message: "Delegation is not valid.",
        },
        {
          code: "upstream_revoked",
          message: "Upstream authority has been revoked.",
        },
      ],
    });

    await expect(repository.evaluate("prepared-effect-002")).resolves.toMatchObject({
      status: "not_eligible",
      statusPresentation: {
        label: "Not Eligible",
        tone: "danger",
      },
      reasons: [
        {
          code: "prepared_effect_not_ready",
          message: "Prepared effect is not ready.",
        },
        {
          code: "activation_not_active",
          message: "Activation is not active.",
        },
        {
          code: "permission_invalid",
          message: "Permission is not valid.",
        },
        {
          code: "delegation_invalid",
          message: "Delegation is not valid.",
        },
        {
          code: "upstream_revoked",
          message: "Upstream authority has been revoked.",
        },
      ],
    });
  });

  it("derives invocation preview across required mock scenarios", async () => {
    const previewRepository = createInvocationPreviewRepository();
    const preparedEffects = createPreparedEffectRepository();
    const activations = createAuthorityActivationRepository();
    const permissions = createAgentPermissionRepository();
    const delegations = createDelegatedAuthorityRepository();
    const eligibility = createExecutionEligibilityRepository({
      clock: () => new Date("2026-03-18T08:00:00Z"),
    });

    async function buildPreview(preparedEffectId: string) {
      const preparedEffect = await preparedEffects.detail(preparedEffectId);
      const eligibilityView = await eligibility.evaluate(preparedEffectId);
      const [activation, permission, delegation] = await Promise.all([
        activations.detail(preparedEffect.activationId).catch(() => null),
        permissions.detail(preparedEffect.permissionGrantId).catch(() => null),
        delegations.detail(preparedEffect.delegationGrantId).catch(() => null),
      ]);

      return previewRepository.preview({
        preparedEffect,
        activation,
        permission,
        delegation,
        eligibility: eligibilityView,
        evaluatedAtUtc: "2026-03-18T08:00:00Z",
      });
    }

    const readyPreparedEffect = await preparedEffects.detail("prepared-effect-001");
    const readyPermission = await permissions.detail(readyPreparedEffect.permissionGrantId);
    const readyDelegation = await delegations.detail(readyPreparedEffect.delegationGrantId);
    const readyActivation = await activations.detail(readyPreparedEffect.activationId);

    await expect(buildPreview("prepared-effect-003")).resolves.toMatchObject({
      preparedEffectId: "prepared-effect-003",
      eligibilityStatus: "not_eligible",
      status: "not_available",
      summary: "This preview reflects authority conditions that are not currently available.",
      statusPresentation: {
        label: "Not Available",
        tone: "neutral",
      },
      authorityContext: {
        delegationId: "delegation-grant-001",
        permissionId: "permission-grant-001",
        activationId: "activation-missing",
      },
      requirements: [
        {
          code: "prepared_effect_must_be_ready",
          message: "Prepared effect must be ready",
          satisfied: true,
        },
        {
          code: "activation_must_be_active",
          message: "Activation must be active",
          satisfied: false,
        },
        {
          code: "permission_must_be_valid",
          message: "Permission must be valid",
          satisfied: true,
        },
        {
          code: "delegation_must_be_valid",
          message: "Delegation must be valid",
          satisfied: true,
        },
        {
          code: "scope_must_remain_within_bounds",
          message: "Scope must remain within bounds",
          satisfied: true,
        },
      ],
    });

    await expect(Promise.resolve(previewRepository.preview({
      preparedEffect: readyPreparedEffect,
      activation: readyActivation,
      permission: {
        ...readyPermission,
        expiresAtUtc: "2026-03-18T07:00:00Z",
      },
      delegation: readyDelegation,
      eligibility: {
        preparedEffectId: readyPreparedEffect.preparedRequestId,
        status: "eligible",
        reasons: [],
        evaluatedAtUtc: "2026-03-18T08:00:00Z",
        statusPresentation: {
          label: "Eligible",
          tone: "success",
        },
      },
      evaluatedAtUtc: "2026-03-18T08:00:00Z",
  }))).resolves.toMatchObject({
      preparedEffectId: "prepared-effect-001",
      eligibilityStatus: "eligible",
      status: "constrained",
      summary: "This preview reflects authority conditions that remain constrained by requirements.",
      statusPresentation: {
        label: "Constrained",
        tone: "warning",
      },
      requirements: [
        {
          code: "prepared_effect_must_be_ready",
          message: "Prepared effect must be ready",
          satisfied: true,
        },
        {
          code: "activation_must_be_active",
          message: "Activation must be active",
          satisfied: true,
        },
        {
          code: "permission_must_be_valid",
          message: "Permission must be valid",
          satisfied: false,
        },
        {
          code: "delegation_must_be_valid",
          message: "Delegation must be valid",
          satisfied: true,
        },
        {
          code: "scope_must_remain_within_bounds",
          message: "Scope must remain within bounds",
          satisfied: true,
        },
      ],
    });

    await expect(buildPreview("prepared-effect-001")).resolves.toMatchObject({
      preparedEffectId: "prepared-effect-001",
      eligibilityStatus: "eligible",
      status: "ready",
      summary: "All authority conditions reflected in this preview are satisfied.",
      statusPresentation: {
        label: "Ready",
        tone: "success",
      },
      requirements: [
        {
          code: "prepared_effect_must_be_ready",
          message: "Prepared effect must be ready",
          satisfied: true,
        },
        {
          code: "activation_must_be_active",
          message: "Activation must be active",
          satisfied: true,
        },
        {
          code: "permission_must_be_valid",
          message: "Permission must be valid",
          satisfied: true,
        },
        {
          code: "delegation_must_be_valid",
          message: "Delegation must be valid",
          satisfied: true,
        },
        {
          code: "scope_must_remain_within_bounds",
          message: "Scope must remain within bounds",
          satisfied: true,
        },
      ],
    });
  });

  it("derives invocation descriptor across unavailable, constrained, and ready states", async () => {
    const descriptorRepository = createInvocationDescriptorRepository();
    const previewRepository = createInvocationPreviewRepository();
    const preparedEffects = createPreparedEffectRepository();
    const activations = createAuthorityActivationRepository();
    const permissions = createAgentPermissionRepository();
    const delegations = createDelegatedAuthorityRepository();
    const eligibility = createExecutionEligibilityRepository({
      clock: () => new Date("2026-03-18T08:00:00Z"),
    });

    async function buildDescriptor(
      preparedEffectId: string,
      overrides?: { permissionExpiresAtUtc?: string },
    ) {
      const preparedEffect = await preparedEffects.detail(preparedEffectId);
      const eligibilityView = await eligibility.evaluate(preparedEffectId);
      const [activation, permission, delegation] = await Promise.all([
        activations.detail(preparedEffect.activationId).catch(() => null),
        permissions.detail(preparedEffect.permissionGrantId).catch(() => null),
        delegations.detail(preparedEffect.delegationGrantId).catch(() => null),
      ]);
      const resolvedPermission = permission && overrides?.permissionExpiresAtUtc
        ? { ...permission, expiresAtUtc: overrides.permissionExpiresAtUtc }
        : permission;
      const preview = await previewRepository.preview({
        preparedEffect,
        activation,
        permission: resolvedPermission,
        delegation,
        eligibility: eligibilityView,
        evaluatedAtUtc: "2026-03-18T08:00:00Z",
      });

      return descriptorRepository.describe({
        preparedEffect,
        activation,
        permission: resolvedPermission,
        delegation,
        eligibility: eligibilityView,
        preview,
      });
    }

    await expect(buildDescriptor("prepared-effect-003")).resolves.toMatchObject({
      preparedEffectId: "prepared-effect-003",
      status: "unavailable",
      requiredAuthorityContext: {
        delegationId: "delegation-grant-001",
        permissionId: "permission-grant-001",
        activationId: "activation-missing",
      },
      eligibilityReference: {
        surface: "execution_eligibility",
        status: "not_eligible",
      },
      previewReference: {
        surface: "invocation_preview",
        status: "not_available",
      },
    });

    await expect(buildDescriptor("prepared-effect-001", {
      permissionExpiresAtUtc: "2026-03-18T07:00:00Z",
    })).resolves.toMatchObject({
      preparedEffectId: "prepared-effect-001",
      status: "constrained",
      previewReference: {
        status: "constrained",
      },
    });

    await expect(buildDescriptor("prepared-effect-001")).resolves.toMatchObject({
      preparedEffectId: "prepared-effect-001",
      status: "ready",
      requirementSet: [
        {
          code: "prepared_effect_must_be_ready",
          source: "invocation_preview",
          satisfied: true,
        },
        {
          code: "activation_must_be_active",
          source: "invocation_preview",
          satisfied: true,
        },
        {
          code: "permission_must_be_valid",
          source: "invocation_preview",
          satisfied: true,
        },
        {
          code: "delegation_must_be_valid",
          source: "invocation_preview",
          satisfied: true,
        },
        {
          code: "scope_must_remain_within_bounds",
          source: "invocation_preview",
          satisfied: true,
        },
      ],
      constraintSet: {
        authorityConstraints: expect.arrayContaining([
          expect.objectContaining({
            code: "delegation_lineage_alignment",
            satisfied: true,
          }),
        ]),
        scopeConstraints: expect.arrayContaining([
          expect.objectContaining({
            code: "prepared_scope_within_activation_scope",
            satisfied: true,
          }),
        ]),
        temporalConstraints: expect.arrayContaining([
          expect.objectContaining({
            code: "prepared_window_contained_by_activation_window",
            satisfied: true,
          }),
        ]),
      },
    });
  });

  it("keeps invocation descriptor operationally incomplete and structurally separate from preview", async () => {
    const descriptorRepository = createInvocationDescriptorRepository();
    const previewRepository = createInvocationPreviewRepository();
    const preparedEffects = createPreparedEffectRepository();
    const activations = createAuthorityActivationRepository();
    const permissions = createAgentPermissionRepository();
    const delegations = createDelegatedAuthorityRepository();
    const eligibility = createExecutionEligibilityRepository({
      clock: () => new Date("2026-03-18T08:00:00Z"),
    });

    const preparedEffect = await preparedEffects.detail("prepared-effect-001");
    const eligibilityView = await eligibility.evaluate("prepared-effect-001");
    const [activation, permission, delegation] = await Promise.all([
      activations.detail(preparedEffect.activationId),
      permissions.detail(preparedEffect.permissionGrantId),
      delegations.detail(preparedEffect.delegationGrantId),
    ]);
    const preview = await previewRepository.preview({
      preparedEffect,
      activation,
      permission,
      delegation,
      eligibility: eligibilityView,
      evaluatedAtUtc: "2026-03-18T08:00:00Z",
    });
    const descriptor = await descriptorRepository.describe({
      preparedEffect,
      activation,
      permission,
      delegation,
      eligibility: eligibilityView,
      preview,
    });

    const keys = collectKeys(descriptor);
    FORBIDDEN_DESCRIPTOR_KEYS.forEach((key) => {
      expect(keys.has(key)).toBe(false);
    });

    expect(keys.has("requirements")).toBe(false);
    expect(keys.has("authorityContext")).toBe(false);
    expect(keys.has("summary")).toBe(false);
    expect(keys.has("statusPresentation")).toBe(false);
  });

  it("keeps invocation descriptor repository projection-only in source", () => {
    const source = readSource("src/lib/collective/invocation-descriptor.repositories.ts");

    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("Promise.all(");
    expect(source).not.toContain(".detail(");
    expect(source).not.toContain("createExecutionEligibilityRepository");
    expect(source).not.toContain("createPreparedEffectRepository");
    expect(source).not.toContain("collectiveObservabilityRoutes");
    expect(source).not.toContain("queryFn");
  });

  it("keeps invocation descriptor panel and guided copy non-performative", () => {
    const panelSource = readSource("src/components/collective/invocation-descriptor-panel.tsx");
    const descriptorStep = GUIDED_CONTENT.find((item) => item.key === "invocationDescriptor");

    expect(panelSource).not.toContain("<button");
    expect(panelSource).not.toContain("href=");
    expect(panelSource).not.toContain("onClick=");
    expect(panelSource).toContain("This defines structure, not capability.");

    expect(descriptorStep).toBeDefined();
    const descriptorText = [
      descriptorStep!.meaning,
      descriptorStep!.whyItMatters,
      descriptorStep!.connection,
      descriptorStep!.constitutionalNote,
    ].join(" ");

    expect(descriptorText).not.toMatch(/\b(start|invoke|run|trigger|submit|apply|perform)\b/i);
    expect(descriptorText).toContain("This defines structure, not capability.");
  });

  it("keeps invocation descriptor deterministic for identical inputs", async () => {
    const descriptorRepository = createInvocationDescriptorRepository();
    const previewRepository = createInvocationPreviewRepository();
    const preparedEffects = createPreparedEffectRepository();
    const activations = createAuthorityActivationRepository();
    const permissions = createAgentPermissionRepository();
    const delegations = createDelegatedAuthorityRepository();
    const eligibility = createExecutionEligibilityRepository({
      clock: () => new Date("2026-03-18T08:00:00Z"),
    });

    const preparedEffect = await preparedEffects.detail("prepared-effect-001");
    const eligibilityView = await eligibility.evaluate("prepared-effect-001");
    const [activation, permission, delegation] = await Promise.all([
      activations.detail(preparedEffect.activationId),
      permissions.detail(preparedEffect.permissionGrantId),
      delegations.detail(preparedEffect.delegationGrantId),
    ]);
    const preview = await previewRepository.preview({
      preparedEffect,
      activation,
      permission,
      delegation,
      eligibility: eligibilityView,
      evaluatedAtUtc: "2026-03-18T08:00:00Z",
    });
    const source = {
      preparedEffect,
      activation,
      permission,
      delegation,
      eligibility: eligibilityView,
      preview,
    } as const;

    const first = await descriptorRepository.describe(source);
    const second = await descriptorRepository.describe(source);

    expect(first).toEqual(second);
  });
});
