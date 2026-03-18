import { NextResponse } from "next/server";
import type { CollectiveChainEntrypointKind } from "@/lib/collective/chain.dto";
import { createCollectiveChainRepository } from "@/lib/collective/chain.repositories";

export const dynamic = "force-dynamic";

const VALID_KINDS = new Set<string>([
  "artifact",
  "activation",
  "preparedEffect",
  "decision",
  "delegation",
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  try {
    const { kind, id } = await params;

    if (!VALID_KINDS.has(kind)) {
      return NextResponse.json(
        {
          status: "BAD_REQUEST",
          endpoint: `/api/collective/chain/${kind}/${id}`,
          error: `Unknown entrypoint kind '${kind}'.`,
        },
        { status: 400 },
      );
    }

    const repo = createCollectiveChainRepository();
    const entrypointKind = kind as CollectiveChainEntrypointKind;
    const decodedId = decodeURIComponent(id);

    let detail;
    switch (entrypointKind) {
      case "artifact":
        detail = await repo.getByArtifactId(decodedId);
        break;
      case "activation":
        detail = await repo.getByActivationId(decodedId);
        break;
      case "preparedEffect":
        detail = await repo.getByPreparedEffectId(decodedId);
        break;
      case "decision":
        if (!repo.getByDecisionId) {
          return NextResponse.json(
            { status: "NOT_IMPLEMENTED", error: "Decision-rooted chain lookup is not configured." },
            { status: 501 },
          );
        }
        detail = await repo.getByDecisionId(decodedId);
        break;
      case "delegation":
        if (!repo.getByDelegationId) {
          return NextResponse.json(
            { status: "NOT_IMPLEMENTED", error: "Delegation-rooted chain lookup is not configured." },
            { status: 501 },
          );
        }
        detail = await repo.getByDelegationId(decodedId);
        break;
      default:
        return NextResponse.json(
          { status: "BAD_REQUEST", error: `Unhandled kind '${kind}'.` },
          { status: 400 },
        );
    }

    return NextResponse.json(
      {
        mode: "MOCK",
        generatedAt: new Date().toISOString(),
        governance: {
          determinismStatus: "SEALED",
          sealValidationResult: "VALID",
          incidentFlag: false,
        },
        data: detail,
        source: "local-mock-provider",
        mockLabel: "MOCK",
      },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message.includes("Unknown collective chain")) {
      return NextResponse.json(
        {
          status: "NOT_FOUND",
          endpoint: "/api/collective/chain/[kind]/[id]",
          error: message,
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        status: "GOVERNANCE UNAVAILABLE",
        mode: "LIVE",
        endpoint: "/api/collective/chain/[kind]/[id]",
        error: "Collective chain detail unavailable",
      },
      { status: 503 },
    );
  }
}
