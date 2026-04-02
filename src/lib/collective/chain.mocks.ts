import type {
  CollectiveChainEntrypoint,
  CollectiveChainLookupRefs,
  CollectiveChainNode,
  CollectiveChainStage,
  CollectiveChainView,
} from "./chain.dto";
import {
  buildCollectiveChainEdges,
  buildCollectiveChainDetail,
  buildMissingCollectiveChainNode,
  computeCollectiveChainCompleteness,
  createCollectiveChainNodeId,
  normalizeCollectiveChainState,
} from "./chain.normalization";
import { createCollectiveChainNodeHref } from "./chain.routes";
import type { PresentationTone } from "./dto";

type CollectiveChainNodeSeed = {
  recordId: string;
  stage: CollectiveChainStage;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  stateLabel: string;
  rawState: string;
  stateTone: PresentationTone;
  constitutionalMode: string;
  anchorReceiptRefs: readonly string[];
  lineageRefs: readonly string[];
  badges: readonly string[];
  timestampUtc?: string | null;
};

export type CollectiveChainFixture = {
  fixtureName: string;
  chainId: string;
  rootArtifactId?: string | null;
  lookups: CollectiveChainLookupRefs;
  stages: Partial<Record<CollectiveChainStage, CollectiveChainNodeSeed>>;
};

function createNodeSeed(seed: Omit<CollectiveChainNodeSeed, "stateTone"> & { stateTone?: PresentationTone }): CollectiveChainNodeSeed {
  const presentation = normalizeCollectiveChainState(seed.rawState, seed.stateLabel);
  return {
    ...seed,
    stateLabel: presentation.stateLabel,
    stateTone: seed.stateTone ?? presentation.stateTone,
  };
}

function materializeChainNode(seed: CollectiveChainNodeSeed, entrypoint: CollectiveChainEntrypoint): CollectiveChainNode {
  const nodeId = createCollectiveChainNodeId(seed.stage, seed.recordId);

  return {
    id: nodeId,
    recordId: seed.recordId,
    stage: seed.stage,
    title: seed.title,
    subtitle: seed.subtitle ?? null,
    description: seed.description ?? null,
    href: createCollectiveChainNodeHref(entrypoint, nodeId),
    stateLabel: seed.stateLabel,
    rawState: seed.rawState,
    stateTone: seed.stateTone,
    constitutionalMode: seed.constitutionalMode,
    anchorReceiptRefs: seed.anchorReceiptRefs,
    lineageRefs: seed.lineageRefs,
    badges: seed.badges,
    timestampUtc: seed.timestampUtc ?? null,
    isPresent: true,
  };
}

export function materializeCollectiveChainView(
  fixture: CollectiveChainFixture,
  entrypoint: CollectiveChainEntrypoint,
): CollectiveChainView {
  const nodes = ([
    "reform",
    "legitimacy",
    "adoption",
    "mutation",
    "delegation",
    "permission",
    "activation",
    "preparedEffect",
  ] as const).map((stage) => {
    const seed = fixture.stages[stage];
    return seed ? materializeChainNode(seed, entrypoint) : buildMissingCollectiveChainNode(stage);
  });

  return {
    chainId: fixture.chainId,
    fixtureName: fixture.fixtureName,
    entrypoint,
    lookups: fixture.lookups,
    rootArtifactId: fixture.rootArtifactId ?? fixture.lookups.artifactId ?? null,
    nodes,
    edges: buildCollectiveChainEdges(nodes),
    completeness: computeCollectiveChainCompleteness(nodes),
  };
}

export const mockCollectiveChainFull: CollectiveChainFixture = {
  fixtureName: "mockCollectiveChainFull",
  chainId: "chain-signal-weighting-v2",
  rootArtifactId: "reform-001",
  lookups: {
    artifactId: "reform-001",
    legitimacyAssessmentId: "legit-001",
    decisionId: "adoption-decision-001",
    mutationReceiptId: "strategy-mutation-001",
    delegationId: "delegation-grant-001",
    permissionId: "permission-grant-001",
    activationId: "activation-001",
    preparedEffectId: "prepared-effect-001",
  },
  stages: {
    reform: createNodeSeed({
      recordId: "reform-001",
      stage: "reform",
      title: "Signal Weighting v2 Specification",
      subtitle: "Epoch 2026-Q1 reform artifact",
      description: "Revised multi-agent signal weighting methodology anchored to deliberation evidence.",
      stateLabel: "Hosted",
      rawState: "hosted",
      constitutionalMode: "hosted",
      anchorReceiptRefs: ["receipt:reform:001", "rhid:deliberation:a1b2c3d4-e5f6-0001-a1b2-c3d4e5f6a7b8"],
      lineageRefs: ["lineage:reform:001", "lineage:epoch:2026-q1", "lineage:proposal:signal-weighting-v2"],
      badges: ["artifact-root", "lineage-rich", "read-only"],
      timestampUtc: "2026-03-08T12:00:00Z",
    }),
    legitimacy: createNodeSeed({
      recordId: "legit-001",
      stage: "legitimacy",
      title: "Signal Weighting v2 Legitimacy Assessment",
      subtitle: "Aggregate legitimacy retained with alternative coverage warning",
      description: "Dimension set remains legitimate overall while recording contested alternative coverage.",
      stateLabel: "Legitimate",
      rawState: "LEGITIMATE",
      constitutionalMode: "assessed",
      anchorReceiptRefs: ["receipt:legitimacy:001", "rhid:reform:c3d4e5f6-a7b8-0001-c3d4-e5f6a7b8c9d0"],
      lineageRefs: ["lineage:legitimacy:001", "lineage:reform:001", "lineage:assessment:signal-weighting-v2"],
      badges: ["aggregate-legitimate", "dimension-backed", "read-only"],
      timestampUtc: "2026-03-17T09:50:00Z",
    }),
    adoption: createNodeSeed({
      recordId: "adoption-decision-001",
      stage: "adoption",
      title: "Adoption Decision 001",
      subtitle: "Approved for adoption by CollectiveCouncil",
      description: "Read-only adoption decision preserving anchored lineage and constitutional posture.",
      stateLabel: "Approved for Adoption",
      rawState: "ApprovedForAdoption",
      constitutionalMode: "decisional",
      anchorReceiptRefs: ["receipt:reform-adoption:001", "receipt:legitimacy:001"],
      lineageRefs: ["lineage:adoption:001", "lineage:proposal:signal-weighting-v2", "lineage:epoch:2026-q1"],
      badges: ["decision", "receipt-backed", "read-only"],
      timestampUtc: "2026-03-17T10:15:00Z",
    }),
    mutation: createNodeSeed({
      recordId: "strategy-mutation-001",
      stage: "mutation",
      title: "Strategy Mutation Receipt 001",
      subtitle: "Signal weighting strategy activated",
      description: "Mutation receipt records activation of the adopted strategy without collapsing later stages.",
      stateLabel: "Activated",
      rawState: "Activate",
      constitutionalMode: "mutated",
      anchorReceiptRefs: ["receipt:strategy-mutation:001", "receipt:reform-adoption:001"],
      lineageRefs: ["lineage:mutation:001", "lineage:strategy:signal-weighting-v2", "lineage:proposal:signal-weighting-v2"],
      badges: ["mutation-receipt", "strategy-linked", "read-only"],
      timestampUtc: "2026-03-17T10:20:00Z",
    }),
    delegation: createNodeSeed({
      recordId: "delegation-grant-001",
      stage: "delegation",
      title: "Delegation Grant 001",
      subtitle: "Observation scope delegated to governance steward",
      description: "Delegated authority narrows the post-mutation strategy into an actor-bound observation grant.",
      stateLabel: "Active",
      rawState: "Active",
      constitutionalMode: "granted",
      anchorReceiptRefs: ["receipt:delegation:001"],
      lineageRefs: ["lineage:delegation:001", "lineage:mutation:001", "lineage:epoch:2026-q1"],
      badges: ["delegation-record", "scope-narrowed", "read-only"],
      timestampUtc: "2026-03-17T09:00:00Z",
    }),
    permission: createNodeSeed({
      recordId: "permission-grant-001",
      stage: "permission",
      title: "Permission Grant 001",
      subtitle: "Explicit observation permission for agent-omega",
      description: "Permission reduces delegation into specific read and observe categories.",
      stateLabel: "Active",
      rawState: "Active",
      constitutionalMode: "scoped",
      anchorReceiptRefs: ["receipt:permission:001"],
      lineageRefs: ["lineage:permission:001", "lineage:delegation:001", "lineage:agent:omega"],
      badges: ["permission-record", "category-bounded", "read-only"],
      timestampUtc: "2026-03-17T09:05:00Z",
    }),
    activation: createNodeSeed({
      recordId: "activation-001",
      stage: "activation",
      title: "Activation 001",
      subtitle: "Eligibility confirmed within delegated scope",
      description: "Activation remains present as its own stage and does not imply execution.",
      stateLabel: "Eligible",
      rawState: "Eligible",
      constitutionalMode: "active",
      anchorReceiptRefs: ["receipt:activation:001"],
      lineageRefs: ["lineage:activation:001", "lineage:permission:001", "lineage:delegation:001"],
      badges: ["activation-record", "eligibility-confirmed", "read-only"],
      timestampUtc: "2026-03-17T09:12:00Z",
    }),
    preparedEffect: createNodeSeed({
      recordId: "prepared-effect-001",
      stage: "preparedEffect",
      title: "Prepared Effect 001",
      subtitle: "Inert materialization for downstream observation",
      description: "Prepared effect remains inert and read-only; it authorizes no execution flow.",
      stateLabel: "Materialized",
      rawState: "Materialized",
      constitutionalMode: "inert",
      anchorReceiptRefs: ["receipt:prepared-effect:001", "receipt:activation:001"],
      lineageRefs: ["lineage:prepared-effect:001", "lineage:activation:001", "lineage:permission:001", "lineage:branch:001"],
      badges: ["prepared-effect", "preparation-only", "inert", "read-only"],
      timestampUtc: "2026-03-17T09:22:00Z",
    }),
  },
};

export const mockCollectiveChainPartialAdoption: CollectiveChainFixture = {
  fixtureName: "mockCollectiveChainPartialAdoption",
  chainId: "chain-threshold-policy",
  rootArtifactId: "reform-002",
  lookups: {
    artifactId: "reform-002",
    legitimacyAssessmentId: "legit-002",
    decisionId: "adoption-decision-002",
  },
  stages: {
    reform: createNodeSeed({
      recordId: "reform-002",
      stage: "reform",
      title: "Candidate Integrity Threshold Policy",
      subtitle: "Threshold policy artifact under review",
      description: "Reform artifact defining minimum integrity thresholds before legitimacy advancement.",
      stateLabel: "Hosted",
      rawState: "hosted",
      constitutionalMode: "hosted",
      anchorReceiptRefs: ["receipt:reform:002", "rhid:deliberation:b2c3d4e5-f6a7-0002-b2c3-d4e5f6a7b8c9"],
      lineageRefs: ["lineage:reform:002", "lineage:proposal:threshold-policy", "lineage:epoch:2026-q1"],
      badges: ["artifact-root", "deliberation-linked", "read-only"],
      timestampUtc: "2026-03-09T15:30:00Z",
    }),
    legitimacy: createNodeSeed({
      recordId: "legit-002",
      stage: "legitimacy",
      title: "Threshold Policy Legitimacy Assessment",
      subtitle: "Contested due to integrity drift and missing alternatives",
      description: "Assessment records contested legitimacy and insufficient evidence for alternative coverage.",
      stateLabel: "Contested",
      rawState: "CONTESTED",
      constitutionalMode: "assessed",
      anchorReceiptRefs: ["receipt:legitimacy:002", "rhid:reform:d4e5f6a7-b8c9-0002-d4e5-f6a7b8c9d0e1"],
      lineageRefs: ["lineage:legitimacy:002", "lineage:reform:002", "lineage:assessment:threshold-policy"],
      badges: ["contested", "supplementary-review", "read-only"],
      timestampUtc: "2026-03-17T11:45:00Z",
    }),
    adoption: createNodeSeed({
      recordId: "adoption-decision-002",
      stage: "adoption",
      title: "Adoption Decision 002",
      subtitle: "Rejected after legitimacy review",
      description: "The chain stops at adoption because no downstream mutation, delegation, permission, activation, or prepared effect was anchored.",
      stateLabel: "Rejected",
      rawState: "Rejected",
      constitutionalMode: "decisional",
      anchorReceiptRefs: ["receipt:reform-adoption:002", "receipt:legitimacy:002"],
      lineageRefs: ["lineage:adoption:002", "lineage:proposal:threshold-policy", "lineage:epoch:2026-q1"],
      badges: ["decision", "partial-chain", "read-only"],
      timestampUtc: "2026-03-17T12:30:00Z",
    }),
  },
};

export const mockCollectiveChainPartialActivation: CollectiveChainFixture = {
  fixtureName: "mockCollectiveChainPartialActivation",
  chainId: "chain-epoch-boundary-normalization",
  rootArtifactId: "reform-005",
  lookups: {
    artifactId: "reform-005",
    legitimacyAssessmentId: "legit-003",
    decisionId: "adoption-decision-003",
    mutationReceiptId: "strategy-mutation-003",
    delegationId: "delegation-grant-003",
    permissionId: "permission-grant-003",
    activationId: "activation-003",
  },
  stages: {
    reform: createNodeSeed({
      recordId: "reform-005",
      stage: "reform",
      title: "Epoch Boundary Normalization Procedure",
      subtitle: "Normalization procedure for cross-epoch deliberations",
      description: "Artifact establishes normalization logic when deliberation health spans epoch boundaries.",
      stateLabel: "Hosted",
      rawState: "hosted",
      constitutionalMode: "hosted",
      anchorReceiptRefs: ["receipt:reform:005", "rhid:deliberation:e5f6a7b8-c9d0-0005-e5f6-a7b8c9d0e1f2"],
      lineageRefs: ["lineage:reform:005", "lineage:epoch:2026-q1", "lineage:proposal:epoch-boundary-normalization"],
      badges: ["artifact-root", "epoch-sensitive", "read-only"],
      timestampUtc: "2026-03-02T08:00:00Z",
    }),
    legitimacy: createNodeSeed({
      recordId: "legit-003",
      stage: "legitimacy",
      title: "Normalization Procedure Legitimacy Assessment",
      subtitle: "All dimensions exceed minimum legitimacy thresholds",
      description: "Assessment shows stable legitimacy across all evaluation dimensions.",
      stateLabel: "Legitimate",
      rawState: "LEGITIMATE",
      constitutionalMode: "assessed",
      anchorReceiptRefs: ["receipt:legitimacy:003", "rhid:deliberation:e5f6a7b8-c9d0-0005-e5f6-a7b8c9d0e1f2"],
      lineageRefs: ["lineage:legitimacy:003", "lineage:reform:005", "lineage:assessment:epoch-boundary-normalization"],
      badges: ["aggregate-legitimate", "lineage-rich", "read-only"],
      timestampUtc: "2026-03-16T14:05:00Z",
    }),
    adoption: createNodeSeed({
      recordId: "adoption-decision-003",
      stage: "adoption",
      title: "Adoption Decision 003",
      subtitle: "Approved for normalization coverage",
      description: "Adoption moves the normalization procedure forward without implying later effect preparation.",
      stateLabel: "Approved for Adoption",
      rawState: "ApprovedForAdoption",
      constitutionalMode: "decisional",
      anchorReceiptRefs: ["receipt:reform-adoption:003", "receipt:legitimacy:003"],
      lineageRefs: ["lineage:adoption:003", "lineage:proposal:epoch-boundary-normalization", "lineage:epoch:2026-q1"],
      badges: ["decision", "read-only", "lineage-rich"],
      timestampUtc: "2026-03-16T15:00:00Z",
    }),
    mutation: createNodeSeed({
      recordId: "strategy-mutation-003",
      stage: "mutation",
      title: "Strategy Mutation Receipt 003",
      subtitle: "Epoch normalization strategy activated",
      description: "Mutation receipt captures the strategic shift that precedes operational delegation.",
      stateLabel: "Activated",
      rawState: "Activate",
      constitutionalMode: "mutated",
      anchorReceiptRefs: ["receipt:strategy-mutation:003", "receipt:reform-adoption:003"],
      lineageRefs: ["lineage:mutation:003", "lineage:strategy:epoch-boundary-normalization", "lineage:proposal:epoch-boundary-normalization"],
      badges: ["mutation-receipt", "strategy-linked", "read-only"],
      timestampUtc: "2026-03-16T15:04:00Z",
    }),
    delegation: createNodeSeed({
      recordId: "delegation-grant-003",
      stage: "delegation",
      title: "Delegation Grant 003",
      subtitle: "Normalization oversight delegated to operator mesh",
      description: "Delegation narrows strategy mutation into a specific observation authority chain.",
      stateLabel: "Active",
      rawState: "Active",
      constitutionalMode: "granted",
      anchorReceiptRefs: ["receipt:delegation:003"],
      lineageRefs: ["lineage:delegation:003", "lineage:mutation:003", "lineage:operator-mesh:normalization"],
      badges: ["delegation-record", "scope-narrowed", "read-only"],
      timestampUtc: "2026-03-16T15:10:00Z",
    }),
    permission: createNodeSeed({
      recordId: "permission-grant-003",
      stage: "permission",
      title: "Permission Grant 003",
      subtitle: "Observation permission for agent-boundary-auditor",
      description: "Permission stage remains distinct from delegation and activation while narrowing categories.",
      stateLabel: "Active",
      rawState: "Active",
      constitutionalMode: "scoped",
      anchorReceiptRefs: ["receipt:permission:003"],
      lineageRefs: ["lineage:permission:003", "lineage:delegation:003", "lineage:agent:boundary-auditor"],
      badges: ["permission-record", "category-bounded", "read-only"],
      timestampUtc: "2026-03-16T15:18:00Z",
    }),
    activation: createNodeSeed({
      recordId: "activation-003",
      stage: "activation",
      title: "Activation 003",
      subtitle: "Eligibility confirmed for normalization observation",
      description: "This chain intentionally stops at activation. No prepared effect has been anchored yet.",
      stateLabel: "Eligible",
      rawState: "Eligible",
      constitutionalMode: "active",
      anchorReceiptRefs: ["receipt:activation:003"],
      lineageRefs: ["lineage:activation:003", "lineage:permission:003", "lineage:delegation:003"],
      badges: ["activation-record", "partial-chain", "read-only"],
      timestampUtc: "2026-03-16T15:21:00Z",
    }),
  },
};

export const mockCollectiveChainFixtures = [
  mockCollectiveChainFull,
  mockCollectiveChainPartialAdoption,
  mockCollectiveChainPartialActivation,
] as const satisfies readonly CollectiveChainFixture[];

export const mockCollectiveChainPreparedEffectFirstLookup = {
  preparedEffectId: "prepared-effect-001",
  chain: buildCollectiveChainDetail(
    materializeCollectiveChainView(mockCollectiveChainFull, { kind: "preparedEffect", id: "prepared-effect-001" }),
    createCollectiveChainNodeId("preparedEffect", "prepared-effect-001"),
  ),
} as const;
