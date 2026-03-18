import { presentPreparedEffectStatus } from "@/lib/collective/normalization";
import { collectiveObservabilityQueryKeys } from "@/lib/collective/queryKeys";
import {
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
});
