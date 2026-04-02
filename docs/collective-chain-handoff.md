# Collective Chain Data Substrate

Repository entrypoints live in `src/lib/collective/chain.repositories.ts`.

- `createCollectiveChainRepository()`
- `getByArtifactId(artifactId: string)`
- `getByPreparedEffectId(preparedEffectId: string)`
- `getByActivationId(activationId: string)`
- Optional: `getByDecisionId(decisionId: string)` and `getByDelegationId(delegationId: string)`

DTOs to consume live in `src/lib/collective/chain.dto.ts`.

- `CollectiveChainView` is the chain surface model.
- `CollectiveChainDetail` adds `focusedNodeId` and `focusedNode` for the detail rail/panel.
- `CollectiveChainNode` preserves stage identity, raw state, constitutional mode, anchor receipt refs, and lineage refs.

Stage meanings:

- `reform`: source reform artifact.
- `legitimacy`: legitimacy assessment for the reform artifact.
- `adoption`: explicit adoption decision.
- `mutation`: strategy mutation receipt linked to adoption.
- `delegation`: delegated authority grant.
- `permission`: scoped agent permission grant.
- `activation`: authority activation state.
- `preparedEffect`: inert prepared effect only, never execution.

Partial chains are represented with all eight stages present in `nodes`, but missing stages are placeholder nodes where `isPresent === false`, `recordId === null`, `href === null`, and `constitutionalMode === "absent"`. The same stages are also surfaced in `view.completeness.missingStages`. No fake intermediate records are synthesized.

Traversal and route-safe helpers:

- Query keys: `src/lib/collective/chain.queryKeys.ts`
- Node id helpers and completeness helpers: `src/lib/collective/chain.normalization.ts`
- Deep-link helpers for a future chain page: `src/lib/collective/chain.routes.ts`

Mock fixtures live in `src/lib/collective/chain.mocks.ts`.

- `mockCollectiveChainFull`
- `mockCollectiveChainPartialAdoption`
- `mockCollectiveChainPartialActivation`
- `mockCollectiveChainPreparedEffectFirstLookup`

The repository defaults to the fixture-backed mock provider, so Claude can render a demo chain page immediately without inspecting backend contracts.
