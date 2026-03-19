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
import { createInvocationPreviewRepository } from "@/lib/collective/invocation-preview.repositories";
import { collectiveObservabilityRoutes, extractRouteId } from "@/lib/collective/routes";

describe("collective observability helpers", () => {
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
});
