import type { PresentationTone } from "./dto";

export type CollectiveChainStage =
  | "reform"
  | "legitimacy"
  | "adoption"
  | "mutation"
  | "delegation"
  | "permission"
  | "activation"
  | "preparedEffect";

export type CollectiveChainEntrypointKind =
  | "artifact"
  | "activation"
  | "preparedEffect"
  | "decision"
  | "delegation";

export type CollectiveChainEntrypoint = {
  kind: CollectiveChainEntrypointKind;
  id: string;
};

export type CollectiveChainLookupRefs = {
  artifactId?: string | null;
  legitimacyAssessmentId?: string | null;
  decisionId?: string | null;
  mutationReceiptId?: string | null;
  delegationId?: string | null;
  permissionId?: string | null;
  activationId?: string | null;
  preparedEffectId?: string | null;
};

export type CollectiveChainNode = {
  id: string;
  recordId?: string | null;
  stage: CollectiveChainStage;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  href?: string | null;
  stateLabel: string;
  rawState: string;
  stateTone: PresentationTone;
  constitutionalMode: string;
  anchorReceiptRefs: readonly string[];
  lineageRefs: readonly string[];
  badges: readonly string[];
  timestampUtc?: string | null;
  isPresent: boolean;
};

export type CollectiveChainEdge = {
  fromNodeId: string;
  toNodeId: string;
  relationshipLabel: string;
};

export type CollectiveChainView = {
  chainId: string;
  fixtureName?: string | null;
  entrypoint: CollectiveChainEntrypoint;
  lookups: CollectiveChainLookupRefs;
  rootArtifactId?: string | null;
  nodes: readonly CollectiveChainNode[];
  edges: readonly CollectiveChainEdge[];
  completeness: {
    presentStages: readonly CollectiveChainStage[];
    missingStages: readonly CollectiveChainStage[];
    isPartial: boolean;
  };
};

export type CollectiveChainDetail = {
  view: CollectiveChainView;
  focusedNodeId?: string | null;
  focusedNode?: CollectiveChainNode | null;
};
