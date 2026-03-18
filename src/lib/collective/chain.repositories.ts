import type {
  CollectiveChainDetail,
  CollectiveChainEntrypoint,
  CollectiveChainLookupRefs,
} from "./chain.dto";
import { buildCollectiveChainDetail, createCollectiveChainNodeId } from "./chain.normalization";
import {
  type CollectiveChainFixture,
  materializeCollectiveChainView,
  mockCollectiveChainFixtures,
} from "./chain.mocks";

function findFocusedNodeId(entrypoint: CollectiveChainEntrypoint, lookups: CollectiveChainLookupRefs): string | null {
  switch (entrypoint.kind) {
    case "artifact":
      return lookups.artifactId ? createCollectiveChainNodeId("reform", lookups.artifactId) : null;
    case "activation":
      return lookups.activationId ? createCollectiveChainNodeId("activation", lookups.activationId) : null;
    case "preparedEffect":
      return lookups.preparedEffectId ? createCollectiveChainNodeId("preparedEffect", lookups.preparedEffectId) : null;
    case "decision":
      return lookups.decisionId ? createCollectiveChainNodeId("adoption", lookups.decisionId) : null;
    case "delegation":
      return lookups.delegationId ? createCollectiveChainNodeId("delegation", lookups.delegationId) : null;
    default:
      return null;
  }
}

export interface CollectiveChainProvider {
  getByArtifactId(artifactId: string): Promise<CollectiveChainFixture | null>;
  getByPreparedEffectId(preparedEffectId: string): Promise<CollectiveChainFixture | null>;
  getByActivationId(activationId: string): Promise<CollectiveChainFixture | null>;
  getByDecisionId?(decisionId: string): Promise<CollectiveChainFixture | null>;
  getByDelegationId?(delegationId: string): Promise<CollectiveChainFixture | null>;
}

export interface CollectiveChainRepository {
  getByArtifactId(artifactId: string): Promise<CollectiveChainDetail>;
  getByPreparedEffectId(preparedEffectId: string): Promise<CollectiveChainDetail>;
  getByActivationId(activationId: string): Promise<CollectiveChainDetail>;
  getByDecisionId?(decisionId: string): Promise<CollectiveChainDetail>;
  getByDelegationId?(delegationId: string): Promise<CollectiveChainDetail>;
}

export function createMockCollectiveChainProvider(
  fixtures: readonly CollectiveChainFixture[] = mockCollectiveChainFixtures,
): CollectiveChainProvider {
  const byLookup = <TKey extends keyof CollectiveChainLookupRefs>(key: TKey, value: string) =>
    fixtures.find((fixture) => fixture.lookups[key] === value) ?? null;

  return {
    async getByArtifactId(artifactId) {
      return byLookup("artifactId", artifactId);
    },
    async getByPreparedEffectId(preparedEffectId) {
      return byLookup("preparedEffectId", preparedEffectId);
    },
    async getByActivationId(activationId) {
      return byLookup("activationId", activationId);
    },
    async getByDecisionId(decisionId) {
      return byLookup("decisionId", decisionId);
    },
    async getByDelegationId(delegationId) {
      return byLookup("delegationId", delegationId);
    },
  };
}

function materializeDetail(
  fixture: CollectiveChainFixture | null,
  entrypoint: CollectiveChainEntrypoint,
  notFoundLabel: string,
): CollectiveChainDetail {
  if (!fixture) {
    throw new Error(`Unknown collective chain for ${notFoundLabel} '${entrypoint.id}'.`);
  }

  const view = materializeCollectiveChainView(fixture, entrypoint);
  return buildCollectiveChainDetail(view, findFocusedNodeId(entrypoint, fixture.lookups));
}

export function createCollectiveChainRepository(
  provider: CollectiveChainProvider = createMockCollectiveChainProvider(),
): CollectiveChainRepository {
  return {
    async getByArtifactId(artifactId) {
      return materializeDetail(
        await provider.getByArtifactId(artifactId),
        { kind: "artifact", id: artifactId },
        "artifact",
      );
    },
    async getByPreparedEffectId(preparedEffectId) {
      return materializeDetail(
        await provider.getByPreparedEffectId(preparedEffectId),
        { kind: "preparedEffect", id: preparedEffectId },
        "prepared effect",
      );
    },
    async getByActivationId(activationId) {
      return materializeDetail(
        await provider.getByActivationId(activationId),
        { kind: "activation", id: activationId },
        "activation",
      );
    },
    async getByDecisionId(decisionId) {
      if (!provider.getByDecisionId) {
        throw new Error("Decision-rooted collective chain lookup is not configured.");
      }

      return materializeDetail(
        await provider.getByDecisionId(decisionId),
        { kind: "decision", id: decisionId },
        "decision",
      );
    },
    async getByDelegationId(delegationId) {
      if (!provider.getByDelegationId) {
        throw new Error("Delegation-rooted collective chain lookup is not configured.");
      }

      return materializeDetail(
        await provider.getByDelegationId(delegationId),
        { kind: "delegation", id: delegationId },
        "delegation",
      );
    },
  };
}
