# Collective Observability Data Layer

Claude should bind to `src/lib/collective/index.ts`. The main frontend-facing surfaces are:

- DTOs: `src/lib/collective/dto.ts`
- Adapters: `src/lib/collective/adapters.ts`
- Repository and provider interfaces: `src/lib/collective/repositories.ts`
- Query keys: `src/lib/collective/queryKeys.ts`
- Route-safe helpers: `src/lib/collective/routes.ts`
- Mock fixtures: `src/lib/collective/mocks.ts`

The repository factories default to mock providers so page work can proceed immediately. When GET routes are available, swap to the API providers from `src/lib/collective/repositories.ts` without changing DTO bindings.

Contract caveats:

- `anchorReceiptRefs`, `lineageRefs`, and `badges` are preserved on adapted detail and lineage models even when empty.
- Strategy mutation receipts remain nested under reform adoption detail only.
- Prepared effects are adapted from record-shaped contracts rather than a dedicated backend query-view contract. The DTOs make inertness explicit with `isPreparationOnly`, `executionAuthorized = false`, and `constitutionalMode = "inert"`.
- `artifactId` in `ReformAdoptionFilterState` is a lookup convenience against mock proposal-to-artifact linkage and is not promoted into the canonical adoption DTOs.
