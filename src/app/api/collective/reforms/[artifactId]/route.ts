import { NextResponse } from "next/server";
import {
  mockReformArtifacts,
  type GovernanceEnvelope,
} from "@/lib/server/governance-api";
import type {
  GetReformDetailResponse,
  ReformArtifactLineage,
} from "@/lib/contracts/collective";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ artifactId: string }> },
) {
  try {
    const { artifactId } = await params;
    const artifacts = mockReformArtifacts();
    const artifact = artifacts.find((a) => a.id === artifactId);

    if (!artifact) {
      return NextResponse.json(
        {
          status: "NOT_FOUND",
          endpoint: `/api/collective/reforms/${artifactId}`,
          error: `Reform artifact '${artifactId}' not found`,
        },
        { status: 404 },
      );
    }

    const lineage: ReformArtifactLineage = {
      artifactId: artifact.id,
      predecessors:
        artifact.status === "superseded"
          ? []
          : artifacts
              .filter(
                (a) =>
                  a.status === "superseded" &&
                  a.epochRef === artifact.epochRef &&
                  a.authorId === artifact.authorId,
              )
              .map((a) => a.id),
      deliberationRef: artifact.lineageAnchors.find((ref) =>
        ref.includes(":deliberation:"),
      ),
      evidenceRefs: artifact.lineageAnchors,
    };

    const detail: GetReformDetailResponse = { artifact, lineage };

    const envelope: GovernanceEnvelope<GetReformDetailResponse> = {
      mode: "MOCK",
      generatedAt: new Date().toISOString(),
      governance: {
        determinismStatus: "SEALED",
        sealValidationResult: "VALID",
        incidentFlag: false,
      },
      data: [detail],
      source: "local-mock-provider",
      mockLabel: "MOCK",
    };

    return NextResponse.json(envelope, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        status: "GOVERNANCE UNAVAILABLE",
        mode: "LIVE",
        endpoint: "/api/collective/reforms/[artifactId]",
        error: "Collective reform detail unavailable",
      },
      { status: 503 },
    );
  }
}
