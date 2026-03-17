# KC-WEB-CD2: Collective Dashboard Contract Reconciliation

## Context

PT-C2-T (Civilizational Reform Deliberation), PT-C2-U (Reform Artifact Hosting), and PT-C2-V (Reform Legitimacy Evaluation) are complete and merged. The keon.control.website frontend currently has zero `/collective/*` routes and zero collective-tier Zod contracts. The existing three-surface architecture designated "Collective Cognition" as deferred — it is now ready to activate.

**Goal:** Reconcile the Collective Dashboard UI architecture with real backend contracts such that every surface maps to real contracts, remains read-only, and respects constitutional authority boundaries.

**Constitutional rule:** Operator visibility ≠ execution authority. No UI element may adopt reforms, mutate strategy/epochs, or trigger governance execution.

**Read-only transport invariant:** Under `src/app/api/collective/**`, only `GET` handlers are permitted. No POST, PUT, PATCH, DELETE. No action callbacks (`onApprove`, `onAdopt`, `onExecute`, `mutate*`) in any component props. No client methods beyond retrieval (`list*`, `get*` only). This boundary is enforceable, not aspirational — violation is a build-gate failure.

**Lineage anchoring invariant:** Every deliberation detail, reform detail, and legitimacy detail view must visibly render its lineage anchors and artifact refs. No view may degrade into narrative-only display. Receipts and causal anchors outrank story — this is straight doctrine.

---

## Lane A — Dashboard Information Architecture

### Route Map (`src/app/collective/`)

| Route | Purpose | Backend Status | Classification |
|-------|---------|----------------|---------------|
| `/collective` | Overview — deliberation + reform activity summary | canonical | observational |
| `/collective/deliberations` | Deliberation session list | canonical (PT-C2-T) | observational |
| `/collective/deliberations/[sessionId]` | Session detail — records, contributions, outcome, anchors | canonical (PT-C2-T) | inspection-only |
| `/collective/reforms` | Reform Memory — artifact list | canonical (PT-C2-U) | observational |
| `/collective/reforms/[artifactId]` | Reform artifact detail with lineage anchors | canonical (PT-C2-U) | inspection-only |
| `/collective/reforms/[artifactId]/legitimacy` | Legitimacy assessment per reform | canonical (PT-C2-V) | inspection-only |
| `/collective/legitimacy` | Legitimacy Explorer — cross-reform comparison | canonical (PT-C2-V) | analytical |
| `/collective/civic-health` | Heat state, oversight mode, epoch context | **projection-only** (demo) | observational |
| `/collective/oversight` | Oversight signals with severity | **projection-only** (demo) | observational |
| `/collective/timeline` | Civic timeline (epoch-anchored) | **deferred** | DeferredPanel |
| `/collective/lineage/[artifactRef]` | Artifact lineage DAG inspector | **deferred** | DeferredPanel |

**Layout:** `src/app/collective/layout.tsx` wraps all routes with `CollectiveBanner` + Shell. Banner text: *"Collective Cognition — Read-only constitutional observation surface."*

---

## Lane B — Backend-to-UI Mapping

| View | Backend Contracts | Query Surface | Backend Status | Classification |
|------|------------------|---------------|----------------|---------------|
| Collective Overview | DeliberationSummary, ReformArtifact (counts) | GET deliberations?limit=5, GET reforms?limit=5 | **canonical** | observational |
| Deliberation List | DeliberationSession[] | GET deliberations | **canonical** (PT-C2-T) | observational |
| Deliberation Detail | DeliberationSession, DeliberationRecord[] | GET deliberations/[id] | **canonical** (PT-C2-T) | inspection-only |
| Reform Memory | ReformArtifact[] | GET reforms | **canonical** (PT-C2-U) | observational |
| Reform Detail | ReformArtifact, ReformArtifactLineage | GET reforms/[id] | **canonical** (PT-C2-U) | inspection-only |
| Legitimacy Assessment | ReformLegitimacyAssessment | GET legitimacy?artifactRef=[id] | **canonical** (PT-C2-V) | inspection-only |
| Legitimacy Explorer | ReformLegitimacyAssessment[] | GET legitimacy | **canonical** (PT-C2-V) | analytical |
| Civic Health | CivicHealthSnapshot, OversightSignal | *projection-only / mock-demo* | **projection** — no merged contract | observational |
| Oversight Signals | OversightSignal[] | *projection-only / mock-demo* | **projection** — no merged contract | observational |
| Civic Timeline | Mixed civic events | *none* | **deferred** | DeferredPanel |
| Lineage Inspector | LineageGraph | *none* | **deferred** | DeferredPanel |

**All views are non-authoritative. GET-only. No POST/PUT/PATCH/DELETE. No mutation endpoints. No action callbacks.**

**Projection-only views** (Civic Health, Oversight Signals) render mock/demo data and are visually labeled as demo. They do NOT ship authoritative-looking API handlers — data is generated inline in the page component or via a clearly-labeled mock utility.

---

## Lane C — View Model Definitions

### New Contract File: `src/lib/contracts/collective.ts`

All Zod schemas, importing from `common.ts`. **Split into canonical vs projection-only:**

#### Canonical Schemas (backed by merged PT-C2-T/U/V)

**Deliberation (PT-C2-T):**
- `DeliberationSessionSchema` — id, epochRef, topic, status (active/concluded/archived), participants, timestamps
- `DeliberationRecordSchema` — sessionId, contributorId, position, reasoning, evidenceRefs, timestamp
- `DeliberationSummarySchema` — sessionId, outcomeDisposition, participantCount, durationMs

**Reform Artifacts (PT-C2-U):**
- `ReformArtifactSchema` — id, title, description, authorId, epochRef, contentHash (Sha256), status (hosted/superseded/withdrawn), lineageAnchors
- `ReformArtifactLineageSchema` — artifactId, predecessors, deliberationRef, evidenceRefs

**Legitimacy Assessment (PT-C2-V):**
- `LegitimacyDimensionSchema` — enum: SignalLegitimacy, CandidateIntegrity, DeliberationHealth, AlternativeCoverage, StrategyCompatibility
- `LegitimacyDispositionSchema` — enum: LEGITIMATE, CONTESTED, INSUFFICIENT_EVIDENCE, REJECTED
- `LegitimacyDimensionOutcomeSchema` — dimension, score (0-1), disposition, explanation
- `ReformLegitimacyAssessmentSchema` — id, reformArtifactRef, dimensions[], aggregateDisposition, findings, lineageAnchors, reproducibilityMetadata

#### Projection-Only Schemas (local UI scaffolds, no merged backend query contract)

These schemas are explicitly labeled `// PROJECTION-ONLY: no merged backend contract` in code. They exist solely to type mock/demo data. They do NOT imply a real backend surface.

**Civic Health (derived/projected, not a direct PT-C2-V output):**
- `HeatStateSchema` — enum: Cool, Warm, Hot, Critical
- `CivicHealthSnapshotSchema` — epoch, heatState, oversightMode, activeDeliberations, pendingReforms, lastHeartbeat
- `OversightSignalSchema` — id, type, severity (info/warning/error/critical), source, description, timestamp, resolved

**Lineage (deferred — no merged query surface):**
- `LineageGraphSchema` — nodes, edges, rootRef — **deferred, schema exists for future use only**

### View Model Interfaces: `src/lib/mappers/collective.ts`

Read-only UI projections with badge variant mappings:
- `UIDeliberationSession`, `UIDeliberationRecord`
- `UIReformArtifactCard`, `UIReformArtifactDetail`
- `UILegitimacyAssessment`, `UILegitimacyDimensionOutcome`
- `UICivicHealthSnapshot` (with heatBadgeVariant mapped from HeatState)
- `UIOversightSignal` (with severityBadgeVariant)
- `UILineageGraph`, `UILineageNode`

**Color semantic mapping** (extends existing contract):
- Cool → healthy, Warm → warning, Hot/Critical → critical
- LEGITIMATE → healthy, CONTESTED → warning, INSUFFICIENT_EVIDENCE → neutral, REJECTED → critical
- active → healthy (cyan), concluded → neutral (blue), archived → offline (grey)
- hosted → healthy, superseded → neutral, withdrawn → offline

**Language rule (visible and latent):**
- Visible UI copy: Assessment, Inspection, Coverage, Compatibility, Integrity, Health. NEVER Approve, Adopt, Execute, Promote.
- Component props: No `onApprove`, `onAdopt`, `onExecute`, `onPromote`, `mutate*` callbacks. Read-only data props only.
- Client methods: `list*` and `get*` only. No `submit*`, `create*`, `update*`, `delete*`.
- Route handlers: `export async function GET()` only. No other HTTP method exports.
- Verification: grep for forbidden patterns is a build-gate check, not a manual review step.

### Extension to `common.ts`

Extend `RhidSchema` regex to accept: `rhid:deliberation:`, `rhid:reform:`, `rhid:lineage:` kinds.

---

## Lane D — Component Architecture

All components in `src/components/collective/`.

| Component | Data Source | Interactions |
|-----------|-----------|-------------|
| `CollectiveBanner` | static | none |
| `CollectiveStatusHeader` | UICivicHealthSnapshot | drilldown to civic-health |
| `CivicHealthPanel` | UICivicHealthSnapshot | display only |
| `HeatStateBadge` | HeatState | tooltip |
| `DeliberationTimeline` | UIDeliberationSession[] | click to detail |
| `DeliberationDetailView` | UIDeliberationRecord[] | filter by contributor |
| `ReformArtifactCard` | UIReformArtifactCard | click to detail |
| `ArtifactInspector` | UIReformArtifactDetail | drilldown to lineage |
| `LegitimacyAssessmentPanel` | UILegitimacyAssessment | display only |
| `LegitimacyRadar` | UILegitimacyDimensionOutcome[] | tooltip per dimension |
| `LegitimacyComparisonTable` | UILegitimacyAssessment[] | column sorting |
| `LineageGraphView` | UILineageGraph | click node to inspect |
| `OversightSignalPanel` | UIOversightSignal[] | filter by severity |
| `CivicTimelineView` | mixed events | drilldown per event |
| `DispositionBadge` | LegitimacyDisposition | tooltip |

**DeferredPanel** (shared at `src/components/ui/deferred-panel.tsx`): Panel with "DEFERRED" badge, feature name, prerequisite text.

**LegitimacyRadar**: SVG-based pentagon radar chart — no external charting library. 5 dimensions → pentagon vertices, score values → filled polygon.

**All interactions: drilldown, filtering, inspection. Never execution.**

---

## Deferred UI Concepts (not backend-supported)

| Feature | Prerequisite | Route |
|---------|-------------|-------|
| Civic Timeline (full history) | Temporal Event Store API (not yet merged) | `/collective/timeline` |
| Lineage Inspector (full DAG) | Lineage Graph API (not yet merged) | `/collective/lineage/[artifactRef]` |
| Agent Constellation | Constellation API (not scoped) | not routed |
| Topology View | Topology API (not scoped) | not routed |
| Fossil Record | Fossil Archive API (not scoped) | not routed |
| Temporal Branches | Branch API (not scoped) | not routed |

These render DeferredPanel stubs where routed.

---

## Outdated Spec Sections

The memory file `project_keon_surface_architecture.md` lists under "Future Collective Cognition" as deferred: *"branches, deliberations, heat, reforms, fossils, constellation, topology"*. Update:
- **deliberations** → now active (PT-C2-T: Civilizational Reform Deliberation)
- **reforms** → now active (PT-C2-U: Reform Artifact Hosting)
- **legitimacy evaluation** → now active (PT-C2-V: Reform Legitimacy Evaluation) — this is legitimacy assessment specifically, NOT a blanket civic-health substrate
- **heat** (civic health) → remains **projection-only**. PT-C2-V was legitimacy evaluation, not authorization to invent a full civic-health substrate. CivicHealthSnapshot and OversightSignal are UI scaffolds without merged backend contracts.
- branches, fossils, constellation, topology → remain deferred

---

## New API Routes

All in `src/app/api/collective/`, following existing GovernanceEnvelope pattern. **GET-only. No POST/PUT/PATCH/DELETE handlers permitted under this path.**

### Canonical API Routes (backed by merged PT-C2 contracts)

| Route | Response Schema | Backend Round |
|-------|----------------|---------------|
| `deliberations/route.ts` | ListDeliberationsResponseSchema | PT-C2-T |
| `deliberations/[sessionId]/route.ts` | GetDeliberationDetailResponseSchema | PT-C2-T |
| `reforms/route.ts` | ListReformsResponseSchema | PT-C2-U |
| `reforms/[artifactId]/route.ts` | GetReformDetailResponseSchema | PT-C2-U |
| `legitimacy/route.ts` | ListLegitimacyResponseSchema | PT-C2-V |

### NOT created as API routes

| Surface | Reason |
|---------|--------|
| `civic-health/` | No merged backend query contract. Civic health is a projection-only UI scaffold, served via inline mock utility. |
| `oversight-signals/` | No merged backend query contract. Same treatment as civic health. |
| `lineage/[artifactRef]/` | No merged backend query contract. Route renders DeferredPanel. |
| `timeline/` | No merged backend query contract. Route renders DeferredPanel. |

**Server-side:** Add `getCollectiveCollection()` to `governance-api.ts` with mock data generators for the 3 canonical surfaces (deliberations, reforms, legitimacy). Civic health mock data lives in a separate `collectiveMockProjections.ts` utility, clearly labeled as demo-only.

**Client-side:** Extend `governanceClient.ts` with retrieval-only methods: `listDeliberations()`, `getDeliberation(id)`, `listReforms()`, `getReform(id)`, `listLegitimacyAssessments()`. No `getCivicHealth()`, `listOversightSignals()`, or `getLineageGraph()` — these have no real backend to call.

---

## Implementation Sequence

### Phase 1 — Contracts & Infrastructure (no UI)
1. Create `src/lib/contracts/collective.ts` — canonical schemas (deliberation, reform, legitimacy) clearly separated from projection-only schemas (civic health, oversight, lineage)
2. Extend `src/lib/contracts/common.ts` — RHID new kinds
3. Create `src/lib/mappers/collective.ts` — view models + color mappers (all read-only interfaces, no mutation signatures)
4. Create `src/components/ui/deferred-panel.tsx`
5. Create `src/lib/server/collectiveMockProjections.ts` — demo data utility for projection-only schemas, clearly labeled
6. Extend `governance-api.ts` with collective mock data for canonical surfaces only

### Phase 2 — Canonical API Routes (server-only, GET-only)
1. 5 canonical route handlers: deliberations (list + detail), reforms (list + detail), legitimacy (list)
2. Extend `governanceClient.ts` with retrieval-only methods (`list*`, `get*`)
3. **No API routes for civic-health, oversight-signals, lineage, or timeline**

### Phase 3 — Layout & Overview (first UI)
1. `src/app/collective/layout.tsx` + `CollectiveBanner`
2. `CollectiveStatusHeader` (sourced from canonical deliberation + reform counts, not projection)
3. `/collective` overview page — activity summary from canonical data
4. Sidebar navigation update

### Phase 4 — Deliberation Views
1. `DeliberationTimeline`, `DeliberationDetailView` (must render lineage anchors and evidence refs)
2. `/collective/deliberations` and `[sessionId]` pages

### Phase 5 — Reform & Legitimacy Views
1. `ReformArtifactCard`, `ArtifactInspector` (must render content hash, lineage anchors)
2. `LegitimacyAssessmentPanel`, `LegitimacyRadar`, `DispositionBadge` (must render dimension outcomes and lineage)
3. `LegitimacyComparisonTable`
4. All reform and legitimacy pages

### Phase 6 — Projection-Only Views (clearly labeled demo)
1. `CivicHealthPanel`, `HeatStateBadge`, `OversightSignalPanel` — sourced from `collectiveMockProjections.ts`
2. `/collective/civic-health` and `/collective/oversight` pages — labeled "DEMO — awaiting backend contract"

### Phase 7 — Deferred Stubs
1. `/collective/timeline` with DeferredPanel
2. `/collective/lineage/[artifactRef]` with DeferredPanel

### Phase 8 — Integration & Polish
1. Wire GovernanceStatusPanel to include collective counts (canonical only)
2. Color contract validation across all new badges
3. Constitutional tooltips on civic health badges
4. **Read-only enforcement check:** grep all `src/app/api/collective/` for non-GET exports, all `src/components/collective/` for forbidden prop patterns (`onApprove|onAdopt|onExecute|mutate`)
5. **Lineage anchoring check:** verify every detail view renders its anchors/refs
6. Smoke test all routes in MOCK mode

---

## Verification

1. `pnpm build` — all routes compile without error
2. `pnpm dev` — navigate every `/collective/*` route, verify read-only behavior
3. **Read-only transport gate:** `grep -rn "export.*function\s\+\(POST\|PUT\|PATCH\|DELETE\)" src/app/api/collective/` must return zero matches
4. **Authority language gate:** `grep -rn "onApprove\|onAdopt\|onExecute\|onPromote\|mutate" src/components/collective/ src/app/collective/` must return zero matches
5. **Lineage anchoring gate:** every detail view (`deliberations/[sessionId]`, `reforms/[artifactId]`, `reforms/[artifactId]/legitimacy`) renders `lineageAnchors` or `evidenceRefs` visibly
6. Verify all new badges use formalized color semantic contract
7. Verify DeferredPanel renders correctly for timeline and lineage routes
8. Verify projection-only views (civic-health, oversight) are visually labeled as demo
9. `pnpm test` — existing tests remain green
10. `pnpm smoke:governance` — extended to cover collective routes

---

## Critical Files

| File | Action |
|------|--------|
| `src/lib/contracts/common.ts` | Extend RHID regex |
| `src/lib/contracts/collective.ts` | **Create** — canonical + projection-only Zod schemas (clearly labeled) |
| `src/lib/mappers/collective.ts` | **Create** — read-only view model interfaces + mapping functions |
| `src/lib/server/governance-api.ts` | Extend with canonical collective mock data |
| `src/lib/server/collectiveMockProjections.ts` | **Create** — demo data for projection-only schemas (civic health, oversight) |
| `src/lib/api/governanceClient.ts` | Extend with retrieval-only methods (`list*`, `get*` only) |
| `src/components/ui/deferred-panel.tsx` | **Create** — shared deferred panel |
| `src/app/collective/layout.tsx` | **Create** — collective layout |
| `src/components/collective/*.tsx` | **Create** — ~15 components (read-only props, no action callbacks) |
| `src/app/api/collective/*/route.ts` | **Create** — 5 canonical GET-only API routes |
| `src/app/collective/*/page.tsx` | **Create** — 11 pages (7 canonical, 2 projection-demo, 2 deferred) |
