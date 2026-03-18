import { collectiveChainQueryKeys } from "@/lib/collective/chain.queryKeys";
import {
  createCollectiveChainNodeId,
  parseCollectiveChainNodeId,
} from "@/lib/collective/chain.normalization";
import {
  createCollectiveChainRepository,
  createMockCollectiveChainProvider,
} from "@/lib/collective/chain.repositories";
import { collectiveChainRoutes } from "@/lib/collective/chain.routes";

describe("collective chain substrate", () => {
  it("builds deterministic query keys and route helpers", () => {
    expect(collectiveChainQueryKeys.byArtifactId("reform-001")).toEqual([
      "collective",
      "chain",
      "artifact",
      "reform-001",
    ]);

    expect(collectiveChainQueryKeys.focus("chain-signal-weighting-v2", "activation/activation-001")).toEqual([
      "collective",
      "chain",
      "focus",
      { chainId: "chain-signal-weighting-v2", focusedNodeId: "activation/activation-001" },
    ]);

    expect(collectiveChainRoutes.surface.preparedEffect("prepared-effect-001", "preparedEffect/prepared-effect-001"))
      .toBe("/collective/chain/preparedEffect/prepared-effect-001?focus=preparedEffect%2Fprepared-effect-001");
  });

  it("creates route-safe node identifiers", () => {
    const nodeId = createCollectiveChainNodeId("preparedEffect", "prepared-effect-001");

    expect(nodeId).toBe("preparedEffect/prepared-effect-001");
    expect(parseCollectiveChainNodeId(nodeId)).toEqual({
      stage: "preparedEffect",
      recordId: "prepared-effect-001",
    });
  });

  it("materializes a full chain from an artifact entrypoint", async () => {
    const repository = createCollectiveChainRepository(createMockCollectiveChainProvider());
    const detail = await repository.getByArtifactId("reform-001");

    expect(detail.view.completeness.isPartial).toBe(false);
    expect(detail.view.nodes).toHaveLength(8);
    expect(detail.focusedNodeId).toBe("reform/reform-001");
    expect(detail.view.nodes.at(-1)?.id).toBe("preparedEffect/prepared-effect-001");
  });

  it("preserves visibly missing stages for adoption-partial chains", async () => {
    const repository = createCollectiveChainRepository(createMockCollectiveChainProvider());
    const detail = await repository.getByArtifactId("reform-002");

    expect(detail.view.completeness.missingStages).toEqual([
      "mutation",
      "delegation",
      "permission",
      "activation",
      "preparedEffect",
    ]);
    expect(detail.view.edges).toHaveLength(2);
    expect(detail.view.nodes.find((node) => node.stage === "mutation")).toMatchObject({
      isPresent: false,
      constitutionalMode: "absent",
      href: null,
    });
  });

  it("supports activation-rooted and prepared-effect-rooted traversal", async () => {
    const repository = createCollectiveChainRepository(createMockCollectiveChainProvider());
    const activationDetail = await repository.getByActivationId("activation-003");
    const preparedEffectDetail = await repository.getByPreparedEffectId("prepared-effect-001");

    expect(activationDetail.focusedNodeId).toBe("activation/activation-003");
    expect(activationDetail.view.completeness.missingStages).toEqual(["preparedEffect"]);
    expect(preparedEffectDetail.focusedNodeId).toBe("preparedEffect/prepared-effect-001");
    expect(preparedEffectDetail.focusedNode?.isPresent).toBe(true);
  });
});
