import { presentPreparedEffectStatus } from "@/lib/collective/normalization";
import { collectiveObservabilityQueryKeys } from "@/lib/collective/queryKeys";
import {
  createExecutionEligibilityRepository,
  createMockReformAdoptionProvider,
  createReformAdoptionRepository,
} from "@/lib/collective/repositories";
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
});
