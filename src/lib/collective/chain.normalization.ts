import type {
  CollectiveChainDetail,
  CollectiveChainEdge,
  CollectiveChainEntrypoint,
  CollectiveChainNode,
  CollectiveChainStage,
  CollectiveChainView,
} from "./chain.dto";
import type { PresentationTone } from "./dto";

export const COLLECTIVE_CHAIN_STAGES = [
  "reform",
  "legitimacy",
  "adoption",
  "mutation",
  "delegation",
  "permission",
  "activation",
  "preparedEffect",
] as const satisfies readonly CollectiveChainStage[];

const STAGE_LABELS: Record<CollectiveChainStage, string> = {
  reform: "Reform",
  legitimacy: "Legitimacy",
  adoption: "Adoption",
  mutation: "Strategy Mutation",
  delegation: "Delegation",
  permission: "Permission",
  activation: "Activation",
  preparedEffect: "Prepared Effect",
};

const STAGE_EDGE_LABELS: Record<CollectiveChainStage, string | null> = {
  reform: "assessed for legitimacy",
  legitimacy: "informed adoption",
  adoption: "triggered strategy mutation",
  mutation: "delegated into operational scope",
  delegation: "narrowed into permission",
  permission: "activated under permission",
  activation: "prepared inert effect",
  preparedEffect: null,
};

function toTitleCase(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
}

export function isCollectiveChainStage(value: string): value is CollectiveChainStage {
  return (COLLECTIVE_CHAIN_STAGES as readonly string[]).includes(value);
}

export function getCollectiveChainStageLabel(stage: CollectiveChainStage): string {
  return STAGE_LABELS[stage];
}

export function getCollectiveChainStageIndex(stage: CollectiveChainStage): number {
  return COLLECTIVE_CHAIN_STAGES.indexOf(stage);
}

export function createCollectiveChainNodeId(stage: CollectiveChainStage, recordId: string): string {
  return `${stage}/${encodeURIComponent(recordId)}`;
}

export function parseCollectiveChainNodeId(nodeId: string): { stage: CollectiveChainStage; recordId: string } | null {
  const [rawStage, ...rest] = nodeId.split("/");
  if (!rawStage || rest.length === 0 || !isCollectiveChainStage(rawStage)) {
    return null;
  }

  return {
    stage: rawStage,
    recordId: decodeURIComponent(rest.join("/")),
  };
}

export function normalizeCollectiveChainState(rawState: string, stateLabel?: string | null): {
  rawState: string;
  stateLabel: string;
  stateTone: PresentationTone;
} {
  const lowered = rawState.toLowerCase();
  const tone: PresentationTone = lowered.includes("reject") || lowered.includes("revoke") || lowered.includes("invalid") || lowered.includes("missing")
    ? "danger"
    : lowered.includes("contest") || lowered.includes("expire") || lowered.includes("suspend") || lowered.includes("withdraw")
      ? "warning"
      : lowered.includes("active") || lowered.includes("approve") || lowered.includes("eligible") || lowered.includes("materialized") || lowered.includes("legitimate")
        ? "success"
        : lowered.includes("pending") || lowered.includes("review")
          ? "info"
          : "neutral";

  return {
    rawState,
    stateLabel: stateLabel?.trim() ? stateLabel : toTitleCase(rawState),
    stateTone: tone,
  };
}

export function buildMissingCollectiveChainNode(stage: CollectiveChainStage): CollectiveChainNode {
  return {
    id: createCollectiveChainNodeId(stage, "missing"),
    recordId: null,
    stage,
    title: `${getCollectiveChainStageLabel(stage)} unavailable`,
    subtitle: `No ${getCollectiveChainStageLabel(stage).toLowerCase()} substrate is anchored to this chain.`,
    description: "This stage is intentionally represented as absent. It is not a real constitutional record.",
    href: null,
    stateLabel: "Missing",
    rawState: "missing",
    stateTone: "neutral",
    constitutionalMode: "absent",
    anchorReceiptRefs: [],
    lineageRefs: [],
    badges: ["missing-stage", "read-only"],
    timestampUtc: null,
    isPresent: false,
  };
}

export function sortCollectiveChainNodes(nodes: readonly CollectiveChainNode[]): CollectiveChainNode[] {
  return [...nodes].sort((left, right) => getCollectiveChainStageIndex(left.stage) - getCollectiveChainStageIndex(right.stage));
}

export function computeCollectiveChainCompleteness(nodes: readonly CollectiveChainNode[]): CollectiveChainView["completeness"] {
  const presentStages = COLLECTIVE_CHAIN_STAGES.filter((stage) => nodes.some((node) => node.stage === stage && node.isPresent));
  const missingStages = COLLECTIVE_CHAIN_STAGES.filter((stage) => !presentStages.includes(stage));

  return {
    presentStages,
    missingStages,
    isPartial: missingStages.length > 0,
  };
}

export function buildCollectiveChainEdges(nodes: readonly CollectiveChainNode[]): CollectiveChainEdge[] {
  const ordered = sortCollectiveChainNodes(nodes);
  const edges: CollectiveChainEdge[] = [];

  for (let index = 0; index < ordered.length - 1; index += 1) {
    const current = ordered[index];
    const next = ordered[index + 1];
    const relationshipLabel = STAGE_EDGE_LABELS[current.stage];

    if (!current.isPresent || !next.isPresent || !relationshipLabel) {
      continue;
    }

    edges.push({
      fromNodeId: current.id,
      toNodeId: next.id,
      relationshipLabel,
    });
  }

  return edges;
}

export function buildCollectiveChainDetail(view: CollectiveChainView, focusedNodeId?: string | null): CollectiveChainDetail {
  const effectiveFocusedNodeId = focusedNodeId ?? view.nodes.find((node) => node.isPresent)?.id ?? null;
  const focusedNode = effectiveFocusedNodeId
    ? view.nodes.find((node) => node.id === effectiveFocusedNodeId) ?? null
    : null;

  return {
    view,
    focusedNodeId: effectiveFocusedNodeId,
    focusedNode,
  };
}

export function createCollectiveChainEntrypoint(kind: CollectiveChainEntrypoint["kind"], id: string): CollectiveChainEntrypoint {
  return { kind, id };
}
