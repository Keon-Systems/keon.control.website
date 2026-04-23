import type {
    CollectiveLiveBranch,
    CollectiveLiveRun,
    CollectiveLiveRunIndexEntry,
    CollectiveLiveTraceStep,
} from "@/lib/contracts/collective-live";

const GOVERNANCE_STEP_KEYWORDS = ["authorize", "approval", "policy", "governance"];
const EXECUTION_STEP_KEYWORDS = ["execute", "execution", "outcome", "receipt"];

export function classifyCollectivePlane(step: string): CollectiveLiveTraceStep["plane"] {
  const normalized = step.trim().toLowerCase();

  if (EXECUTION_STEP_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "execution";
  }

  if (GOVERNANCE_STEP_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "governance";
  }

  return "cognition";
}

export function collectiveLiveRunStorageKey(intentId: string) {
  return `keon-control.collective-live-run.${intentId}`;
}

export function collectiveLiveRunIndexStorageKey() {
  return "keon-control.collective-live-run-index";
}

export function toCollectiveLiveRunIndexEntry(run: CollectiveLiveRun): CollectiveLiveRunIndexEntry {
  return {
    intentId: run.run.intentId,
    correlationId: run.run.correlationId,
    objective: run.submission.objective,
    submittedAtUtc: run.run.submittedAtUtc,
    completedAtUtc: run.run.completedAtUtc,
    statusLabel: run.run.statusLabel,
    tenantId: run.submission.tenantId,
    actorId: run.submission.actorId,
    hostSource: run.hostSource,
  };
}

export function readCollectiveLiveRunIndex(): CollectiveLiveRunIndexEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = localStorage.getItem(collectiveLiveRunIndexStorageKey());
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is CollectiveLiveRunIndexEntry => {
      return Boolean(
        entry &&
          typeof entry === "object" &&
          typeof (entry as CollectiveLiveRunIndexEntry).intentId === "string" &&
          typeof (entry as CollectiveLiveRunIndexEntry).correlationId === "string",
      );
    });
  } catch {
    return [];
  }
}

export function persistCollectiveLiveRun(run: CollectiveLiveRun) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(collectiveLiveRunStorageKey(run.run.intentId), JSON.stringify(run));

  const entry = toCollectiveLiveRunIndexEntry(run);
  const nextIndex = [
    entry,
    ...readCollectiveLiveRunIndex().filter((item) => item.intentId !== entry.intentId),
  ].slice(0, 25);

  localStorage.setItem(collectiveLiveRunIndexStorageKey(), JSON.stringify(nextIndex));
}

export function readCollectiveLiveRun(intentId: string): CollectiveLiveRun | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(collectiveLiveRunStorageKey(intentId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CollectiveLiveRun;
  } catch {
    localStorage.removeItem(collectiveLiveRunStorageKey(intentId));
    return null;
  }
}

const EMPTY_LIVE_RUN_INDEX: readonly CollectiveLiveRunIndexEntry[] = Object.freeze([]);
let liveRunIndexSnapshotRaw: string | null | undefined;
let liveRunIndexSnapshotValue: readonly CollectiveLiveRunIndexEntry[] = EMPTY_LIVE_RUN_INDEX;
const liveRunSnapshotByIntent = new Map<string, { raw: string | null; value: CollectiveLiveRun | null }>();

function subscribeCollectiveLiveStore(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export const subscribeCollectiveLiveRunIndex = subscribeCollectiveLiveStore;
export const subscribeCollectiveLiveRun = subscribeCollectiveLiveStore;

export function snapshotCollectiveLiveRunIndex(): readonly CollectiveLiveRunIndexEntry[] {
  if (typeof window === "undefined") {
    return EMPTY_LIVE_RUN_INDEX;
  }
  const raw = localStorage.getItem(collectiveLiveRunIndexStorageKey());
  if (raw === liveRunIndexSnapshotRaw) {
    return liveRunIndexSnapshotValue;
  }
  liveRunIndexSnapshotRaw = raw;
  liveRunIndexSnapshotValue = raw ? Object.freeze(readCollectiveLiveRunIndex()) : EMPTY_LIVE_RUN_INDEX;
  return liveRunIndexSnapshotValue;
}

export function serverSnapshotCollectiveLiveRunIndex(): readonly CollectiveLiveRunIndexEntry[] {
  return EMPTY_LIVE_RUN_INDEX;
}

export function snapshotCollectiveLiveRun(intentId: string): CollectiveLiveRun | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = localStorage.getItem(collectiveLiveRunStorageKey(intentId));
  const cached = liveRunSnapshotByIntent.get(intentId);
  if (cached && cached.raw === raw) {
    return cached.value;
  }
  const value = readCollectiveLiveRun(intentId);
  liveRunSnapshotByIntent.set(intentId, { raw, value });
  return value;
}

export function serverSnapshotCollectiveLiveRun(): CollectiveLiveRun | null {
  return null;
}

export function collectiveLiveRunPhase(run: CollectiveLiveRun) {
  if (run.execution.status !== "unavailable") {
    return {
      plane: "execution" as const,
      label: run.execution.label,
      detail: run.execution.detail,
    };
  }

  if (run.governance.status !== "unavailable") {
    return {
      plane: "governance" as const,
      label: run.governance.label,
      detail: run.governance.detail,
    };
  }

  return {
    plane: "cognition" as const,
    label: run.run.status === "blocked" ? "Cognition Blocked" : "Cognition Completed",
    detail:
      run.run.status === "blocked"
        ? "The inert cognition run did not produce a promotable path."
        : "The inert cognition run completed and remained non-effecting.",
  };
}

export function collectiveLiveStageStates(run: CollectiveLiveRun) {
  return [
    {
      key: "cognition",
      label: "Cognition",
      scope: "Collective",
      status:
        run.run.status === "blocked"
          ? "Blocked"
          : "Complete",
      tone: run.run.status === "blocked" ? "warning" : "healthy",
      detail:
        run.run.status === "blocked"
          ? "The Collective did not produce a promotable inert result."
          : "The Collective completed inert deliberation and selected a branch.",
    },
    {
      key: "governance",
      label: "Governance",
      scope: "Authorization",
      status: run.governance.status === "unavailable" ? "Not Invoked" : run.governance.label,
      tone: run.governance.status === "unavailable" ? "warning" : "healthy",
      detail: run.governance.detail,
    },
    {
      key: "execution",
      label: "Execution",
      scope: "Reality",
      status: run.execution.status === "unavailable" ? "Not Attempted" : run.execution.label,
      tone: run.execution.status === "unavailable" ? "critical" : "healthy",
      detail: run.execution.detail,
    },
  ] as const;
}

export function summarizeBranch(branch: CollectiveLiveBranch | undefined) {
  if (!branch) {
    return "No selected branch returned.";
  }

  return `${branch.branchId} · ${branch.state} · utility ${branch.utilityScore.toFixed(2)} · risk ${branch.riskScore.toFixed(2)}`;
}
