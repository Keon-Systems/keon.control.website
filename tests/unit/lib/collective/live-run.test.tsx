import { CollectiveLiveRunView } from "@/components/collective/collective-live-run-view";
import {
    classifyCollectivePlane,
    collectiveLiveRunPhase,
    collectiveLiveStageStates,
    persistCollectiveLiveRun,
    readCollectiveLiveRun,
    readCollectiveLiveRunIndex,
} from "@/lib/collective/live-run";
import type { CollectiveLiveRun } from "@/lib/contracts/collective-live";
import { lookupCollectiveLiveRun, mapCollectiveLiveError, submitCollectiveLiveRun } from "@/lib/server/collective-live";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

function buildHostPayload(overrides: Record<string, unknown> = {}) {
  return {
    intentId: { value: "intent:tenant-keon:corr:123" },
    selectedBranchId: { value: "branch:selected" },
    status: 0,
    summary: "Selected branch anchored by collapse, review, and heat truth.",
    timestampUtc: "2026-04-02T12:05:00Z",
    runtimeTrace: [
      {
        step: "intent_received",
        detail: "Intent accepted for cognition.",
        metadata: { phase: "intent" },
        timestampUtc: "2026-04-02T12:00:00Z",
      },
      {
        step: "collapse_selected",
        detail: "Branch collapse completed.",
        metadata: { collapseId: "collapse:1" },
        timestampUtc: "2026-04-02T12:04:00Z",
      },
    ],
    materializedBranches: [
      {
        branchId: { value: "branch:selected" },
        parentBranchId: null,
        state: 1,
        hypothesis: "Primary branch",
        heatProfileId: { value: "heat:1" },
        adversarialReviewId: { value: "review:1" },
        utilityScore: 0.91,
        riskScore: 0.22,
        collapseRationale: "Best balance",
        lineageDepth: 1,
        participants: [{ value: "agent:alpha" }],
        spawnedUtc: "2026-04-02T12:01:00Z",
        lastUpdatedUtc: "2026-04-02T12:04:00Z",
        claimRefs: [{ value: "claim:1" }],
      },
    ],
    evaluatedBranches: [
      {
        branchId: { value: "branch:selected" },
        parentBranchId: null,
        state: 3,
        hypothesis: "Primary branch",
        heatProfileId: { value: "heat:1" },
        adversarialReviewId: { value: "review:1" },
        utilityScore: 0.91,
        riskScore: 0.22,
        collapseRationale: "Best balance",
        lineageDepth: 1,
        participants: [{ value: "agent:alpha" }],
        spawnedUtc: "2026-04-02T12:01:00Z",
        lastUpdatedUtc: "2026-04-02T12:04:00Z",
        claimRefs: [{ value: "claim:1" }],
      },
      {
        branchId: { value: "branch:alternate" },
        parentBranchId: null,
        state: 3,
        hypothesis: "Alternate branch",
        heatProfileId: { value: "heat:2" },
        adversarialReviewId: { value: "review:2" },
        utilityScore: 0.62,
        riskScore: 0.48,
        collapseRationale: "Lower utility",
        lineageDepth: 1,
        participants: [{ value: "agent:beta" }],
        spawnedUtc: "2026-04-02T12:01:30Z",
        lastUpdatedUtc: "2026-04-02T12:04:00Z",
        claimRefs: [{ value: "claim:2" }],
      },
    ],
    winningBranch: {
      branchId: { value: "branch:selected" },
      parentBranchId: null,
      state: 4,
      hypothesis: "Primary branch",
      heatProfileId: { value: "heat:1" },
      adversarialReviewId: { value: "review:1" },
      utilityScore: 0.91,
      riskScore: 0.22,
      collapseRationale: "Best balance",
      lineageDepth: 1,
      participants: [{ value: "agent:alpha" }],
      spawnedUtc: "2026-04-02T12:01:00Z",
      lastUpdatedUtc: "2026-04-02T12:04:00Z",
      claimRefs: [{ value: "claim:1" }],
    },
    losingBranches: [],
    review: {
      reviewId: { value: "review:1" },
      intentId: { value: "intent:tenant-keon:corr:123" },
      branchId: { value: "branch:selected" },
      status: 3,
      challengeDepth: 2,
      inducedHeat: 0.34,
      findings: [
        {
          findingCode: "FINDING_01",
          category: "risk",
          narrative: "One unresolved operational risk remained open during review.",
          severity: 0.54,
          resolved: false,
        },
      ],
      summary: "Review completed with one material finding.",
      timestampUtc: "2026-04-02T12:03:00Z",
    },
    heatProfile: {
      heatProfileId: { value: "heat:1" },
      entityHeat: 0.12,
      branchHeat: 0.22,
      interactionHeat: 0.16,
      challengeHeat: 0.34,
      boundaryHeat: 0.18,
      swarmHeat: 0.11,
      compositeHeat: 0.24,
      thresholdState: 1,
      calculationVersion: "v1",
      contributors: [
        {
          source: "challenge-depth",
          weight: 0.5,
          description: "Challenge depth contribution",
        },
      ],
      timestampUtc: "2026-04-02T12:03:30Z",
    },
    collapseRecord: {
      collapseId: { value: "collapse:1" },
      intentId: { value: "intent:tenant-keon:corr:123" },
      candidateBranchIds: [{ value: "branch:selected" }, { value: "branch:alternate" }],
      selectedBranchId: { value: "branch:selected" },
      disposition: 2,
      selectionRationale: "Selected for strongest utility/risk ratio.",
      comparativeHeatSummary: "Selected branch remained warm but below critical threshold.",
      comparativeUtilitySummary: "Selected branch dominated utility across compared alternatives.",
      challengeSummary: "One finding remained open and accepted into witness narrative.",
      witnessDigestId: { value: "witness:1" },
      timestampUtc: "2026-04-02T12:04:00Z",
      loserBranchIds: [{ value: "branch:alternate" }],
    },
    witnessTruth: {
      intentId: { value: "intent:tenant-keon:corr:123" },
      collapseId: { value: "collapse:1" },
      winningBranchId: { value: "branch:selected" },
      losingBranchIds: [{ value: "branch:alternate" }],
      reviewId: { value: "review:1" },
      heatProfileId: { value: "heat:1" },
      collapseDisposition: 2,
      compositeHeat: 0.24,
      heatThresholdState: 1,
      truthRefs: ["receipt:truth:1", "receipt:truth:2"],
      witnessNarrative: "Witness narrative anchored to collapse and review.",
      truthNarrative: "Truth narrative anchored to receipt refs.",
      timestampUtc: "2026-04-02T12:05:00Z",
    },
    claimGraph: {
      nodes: {
        first: { isEffectBearing: true },
        second: { isEffectBearing: false },
      },
      edges: [{ from: "first", to: "second" }],
    },
    ...overrides,
  };
}

function buildSubmission() {
  return {
    objective: "Create a plan to colonize Mars",
    context: "Include phases and constraints.",
    constraints: "No execution authority.",
    oversightMode: "observer-supervised",
    governanceAuthority: "collective.operator.supervision",
    governanceBindingRef: "gov:binding:1",
    tenantId: "tenant-keon",
    tenantPartition: "default",
    actorId: "operator:control",
    actorType: "human-operator",
    delegatedBy: "",
    correlationId: "corr:123",
    parentCorrelationId: "",
    interactionId: "",
    causationId: "",
  };
}

async function makeResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("collective live workflow", () => {
  beforeEach(() => {
    process.env.KEON_COLLECTIVE_HOST_BASE_URL = "http://localhost:5122";
    process.env.KEON_COLLECTIVE_HOST_TIMEOUT_MS = "15000";
  });

  it("rejects malformed task payloads", async () => {
    await expect(submitCollectiveLiveRun({ objective: "" })).rejects.toMatchObject({
      name: "ZodError",
    });
  });

  it("maps backend errors cleanly", async () => {
    const error = await submitCollectiveLiveRun(buildSubmission(), async () =>
      new Response("gateway down", { status: 503 }),
    ).catch((caught) => caught);

    expect(mapCollectiveLiveError(error)).toEqual({
      status: 503,
      code: "UPSTREAM_UNAVAILABLE",
      detail: "Collective host returned HTTP 503: gateway down",
    });
  });

  it("fails closed when required anchors are missing", async () => {
    const error = await submitCollectiveLiveRun(
      buildSubmission(),
      async () => makeResponse(buildHostPayload({ collapseRecord: null })),
    ).catch((caught) => caught);

    expect(mapCollectiveLiveError(error)).toEqual({
      status: 502,
      code: "ANCHOR_VALIDATION_FAILED",
      detail:
        "Completed cognition run is missing collapse, review, heat, witness, or winning-branch anchors.",
    });
  });

  it("returns a live run without mock fallback and marks governance or execution unavailable", async () => {
    const fetchMock = vi.fn(async () => makeResponse(buildHostPayload()));
    const run = await submitCollectiveLiveRun(buildSubmission(), fetchMock);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5122/intents",
      expect.objectContaining({ method: "POST" }),
    );
    expect(run.dataMode).toBe("LIVE");
    expect(run.governance.status).toBe("unavailable");
    expect(run.execution.status).toBe("unavailable");
    expect(run.anchors.truthRefs).toEqual(["receipt:truth:1", "receipt:truth:2"]);
    expect(run.cognition.claimGraph).toEqual({
      nodeCount: 2,
      edgeCount: 1,
      effectBearingClaimCount: 1,
    });
  });

  it("returns structured NOT_YET_AVAILABLE when durable backend retrieval is absent", async () => {
    const result = await lookupCollectiveLiveRun(
      "intent:tenant-keon:corr:123",
      "corr:123",
      async () => new Response("", { status: 404 }),
    );

    expect(result).toEqual({
      status: "NOT_YET_AVAILABLE",
      intentId: "intent:tenant-keon:corr:123",
      correlationId: "corr:123",
      detail: "The Collective host does not yet expose durable run retrieval for this intent.",
      hostSource: "http://localhost:5122",
      attemptedEndpoint: "http://localhost:5122/intents/intent%3Atenant-keon%3Acorr%3A123",
    });
  });

  it("renders cognition, governance, execution, and anchor surfaces legibly", () => {
    const run: CollectiveLiveRun = {
      dataMode: "LIVE",
      retrievalMode: "session-cache",
      hostSource: "http://localhost:5122",
      run: {
        intentId: "intent:tenant-keon:corr:123",
        selectedBranchId: "branch:selected",
        correlationId: "corr:123",
        status: "completed",
        statusLabel: "Completed",
        summary: "Selected branch anchored by truth refs.",
        submittedAtUtc: "2026-04-02T12:00:00Z",
        completedAtUtc: "2026-04-02T12:05:00Z",
      },
      submission: {
        objective: "Create a plan to colonize Mars",
        context: "Include phases and constraints.",
        constraints: "No execution authority.",
        oversightMode: "observer-supervised",
        governanceAuthority: "collective.operator.supervision",
        governanceBindingRef: "gov:binding:1",
        challengePreset: "mars-colony-plan",
        tenantId: "tenant-keon",
        tenantPartition: "default",
        actorId: "operator:control",
        actorType: "human-operator",
        delegatedBy: "",
        correlationId: "corr:123",
        parentCorrelationId: "",
        interactionId: "",
        causationId: "",
      },
      cognition: {
        runtimeTrace: [
          {
            step: "intent_received",
            detail: "Intent accepted for cognition.",
            plane: "cognition",
            timestampUtc: "2026-04-02T12:00:00Z",
            metadata: { phase: "intent" },
          },
        ],
        materializedBranches: [],
        evaluatedBranches: [
          {
            branchId: "branch:selected",
            parentBranchId: null,
            state: "Collapsed Winner",
            hypothesis: "Primary branch",
            utilityScore: 0.91,
            riskScore: 0.22,
            lineageDepth: 1,
            participants: ["agent:alpha"],
            spawnedUtc: "2026-04-02T12:01:00Z",
            lastUpdatedUtc: "2026-04-02T12:04:00Z",
            collapseRationale: "Best balance",
          },
        ],
        winningBranch: {
          branchId: "branch:selected",
          parentBranchId: null,
          state: "Collapsed Winner",
          hypothesis: "Primary branch",
          utilityScore: 0.91,
          riskScore: 0.22,
          lineageDepth: 1,
          participants: ["agent:alpha"],
          spawnedUtc: "2026-04-02T12:01:00Z",
          lastUpdatedUtc: "2026-04-02T12:04:00Z",
          collapseRationale: "Best balance",
        },
        losingBranches: [],
        review: {
          reviewId: "review:1",
          branchId: "branch:selected",
          status: "Completed With Findings",
          challengeDepth: 2,
          inducedHeat: 0.34,
          summary: "Review completed with one material finding.",
          timestampUtc: "2026-04-02T12:03:00Z",
          findings: [
            {
              code: "FINDING_01",
              category: "risk",
              narrative: "One unresolved operational risk remained open during review.",
              severity: 0.54,
              resolved: false,
            },
          ],
        },
        heatProfile: {
          heatProfileId: "heat:1",
          entityHeat: 0.12,
          branchHeat: 0.22,
          interactionHeat: 0.16,
          challengeHeat: 0.34,
          boundaryHeat: 0.18,
          swarmHeat: 0.11,
          compositeHeat: 0.24,
          thresholdState: "Warm",
          calculationVersion: "v1",
          timestampUtc: "2026-04-02T12:03:30Z",
          contributors: [],
        },
        collapseRecord: {
          collapseId: "collapse:1",
          selectedBranchId: "branch:selected",
          disposition: "Resolved",
          selectionRationale: "Selected for strongest utility/risk ratio.",
          comparativeHeatSummary: "Selected branch remained warm but below critical threshold.",
          comparativeUtilitySummary: "Selected branch dominated utility across compared alternatives.",
          challengeSummary: "One finding remained open and accepted into witness narrative.",
          candidateBranchIds: ["branch:selected", "branch:alternate"],
          loserBranchIds: ["branch:alternate"],
          witnessDigestId: "witness:1",
          timestampUtc: "2026-04-02T12:04:00Z",
        },
        witnessTruth: {
          collapseId: "collapse:1",
          reviewId: "review:1",
          heatProfileId: "heat:1",
          winningBranchId: "branch:selected",
          losingBranchIds: ["branch:alternate"],
          collapseDisposition: "Resolved",
          compositeHeat: 0.24,
          heatThresholdState: "Warm",
          truthRefs: ["receipt:truth:1"],
          witnessNarrative: "Witness narrative anchored to collapse and review.",
          truthNarrative: "Truth narrative anchored to receipt refs.",
          timestampUtc: "2026-04-02T12:05:00Z",
        },
        claimGraph: {
          nodeCount: 2,
          edgeCount: 1,
          effectBearingClaimCount: 1,
        },
      },
      governance: {
        status: "unavailable",
        label: "Governed Authorization Unavailable",
        detail: "No governed receipt was returned.",
      },
      execution: {
        status: "unavailable",
        label: "Reality Execution Unavailable",
        detail: "No execution receipt was returned.",
      },
      anchors: {
        collapseId: "collapse:1",
        reviewId: "review:1",
        heatProfileId: "heat:1",
        truthRefs: ["receipt:truth:1"],
      },
      operatorMessages: ["Receipts outrank stories."],
    };

    render(<CollectiveLiveRunView run={run} />);

    expect(screen.getByText("Not Invoked")).toBeInTheDocument();
    expect(screen.getByText("Not Attempted")).toBeInTheDocument();
    expect(screen.getByText("receipt:truth:1")).toBeInTheDocument();
    expect(screen.getByText("Witness narrative anchored to collapse and review.")).toBeInTheDocument();
    expect(screen.getByText("View In Runtime")).toBeInTheDocument();
    expect(screen.getByText("View Receipts")).toBeInTheDocument();
  });

  it("classifies planes and phases without misrepresenting cognition as authorization", () => {
    expect(classifyCollectivePlane("policy_review")).toBe("governance");
    expect(classifyCollectivePlane("execution_receipt")).toBe("execution");
    expect(classifyCollectivePlane("collapse_selected")).toBe("cognition");

    const phase = collectiveLiveRunPhase({
      dataMode: "LIVE",
      retrievalMode: "session-cache",
      hostSource: "http://localhost:5122",
      run: {
        intentId: "intent:1",
        selectedBranchId: "branch:1",
        correlationId: "corr:1",
        status: "completed",
        statusLabel: "Completed",
        summary: "summary",
        submittedAtUtc: "2026-04-02T12:00:00Z",
        completedAtUtc: "2026-04-02T12:05:00Z",
      },
      submission: {
        objective: "objective",
        tenantId: "tenant",
        actorId: "actor",
        actorType: "human-operator",
        correlationId: "corr:1",
      },
      cognition: {
        runtimeTrace: [],
        materializedBranches: [],
        evaluatedBranches: [],
        losingBranches: [],
      },
      governance: {
        status: "unavailable",
        label: "Governed Authorization Unavailable",
        detail: "No governed receipt was returned.",
      },
      execution: {
        status: "unavailable",
        label: "Reality Execution Unavailable",
        detail: "No execution receipt was returned.",
      },
      anchors: {
        truthRefs: [],
      },
      operatorMessages: [],
    });

    expect(phase).toEqual({
      plane: "cognition",
      label: "Cognition Completed",
      detail: "The inert cognition run completed and remained non-effecting.",
    });

    expect(
      collectiveLiveStageStates({
        dataMode: "LIVE",
        retrievalMode: "session-cache",
        hostSource: "http://localhost:5122",
        run: {
          intentId: "intent:1",
          selectedBranchId: "branch:1",
          correlationId: "corr:1",
          status: "completed",
          statusLabel: "Completed",
          summary: "summary",
          submittedAtUtc: "2026-04-02T12:00:00Z",
          completedAtUtc: "2026-04-02T12:05:00Z",
        },
        submission: {
          objective: "objective",
          tenantId: "tenant",
          actorId: "actor",
          actorType: "human-operator",
          correlationId: "corr:1",
        },
        cognition: {
          runtimeTrace: [],
          materializedBranches: [],
          evaluatedBranches: [],
          losingBranches: [],
        },
        governance: {
          status: "unavailable",
          label: "Governed Authorization Unavailable",
          detail: "No governed receipt was returned.",
        },
        execution: {
          status: "unavailable",
          label: "Reality Execution Unavailable",
          detail: "No execution receipt was returned.",
        },
        anchors: {
          truthRefs: [],
        },
        operatorMessages: [],
      }),
    ).toEqual([
      expect.objectContaining({ label: "Cognition", status: "Complete" }),
      expect.objectContaining({ label: "Governance", status: "Not Invoked" }),
      expect.objectContaining({ label: "Execution", status: "Not Attempted" }),
    ]);
  });

  it("persists and reads a durable local run index", () => {
    localStorage.clear();

    const run: CollectiveLiveRun = {
      dataMode: "LIVE",
      retrievalMode: "session-cache",
      hostSource: "http://localhost:5122",
      run: {
        intentId: "intent:tenant-keon:corr:123",
        selectedBranchId: "branch:selected",
        correlationId: "corr:123",
        status: "completed",
        statusLabel: "Completed",
        summary: "summary",
        submittedAtUtc: "2026-04-02T12:00:00Z",
        completedAtUtc: "2026-04-02T12:05:00Z",
      },
      submission: {
        objective: "Create a plan to colonize Mars",
        tenantId: "tenant-keon",
        actorId: "operator:control",
        actorType: "human-operator",
        correlationId: "corr:123",
      },
      cognition: {
        runtimeTrace: [],
        materializedBranches: [],
        evaluatedBranches: [],
        losingBranches: [],
      },
      governance: {
        status: "unavailable",
        label: "Governed Authorization Unavailable",
        detail: "No governed receipt was returned.",
      },
      execution: {
        status: "unavailable",
        label: "Reality Execution Unavailable",
        detail: "No execution receipt was returned.",
      },
      anchors: {
        truthRefs: [],
      },
      operatorMessages: [],
    };

    persistCollectiveLiveRun(run);

    expect(readCollectiveLiveRun("intent:tenant-keon:corr:123")?.run.intentId).toBe(
      "intent:tenant-keon:corr:123",
    );
    expect(readCollectiveLiveRunIndex()).toEqual([
      expect.objectContaining({
        intentId: "intent:tenant-keon:corr:123",
        correlationId: "corr:123",
        objective: "Create a plan to colonize Mars",
      }),
    ]);
  });
});
