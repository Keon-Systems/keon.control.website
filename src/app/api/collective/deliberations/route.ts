import { NextResponse } from "next/server";
import {
  mockDeliberationSessions,
  type GovernanceEnvelope,
} from "@/lib/server/governance-api";
import type { DeliberationSession } from "@/lib/contracts/collective";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = mockDeliberationSessions();
    const envelope: GovernanceEnvelope<{ items: DeliberationSession[] }> = {
      mode: "MOCK",
      generatedAt: new Date().toISOString(),
      governance: {
        determinismStatus: "SEALED",
        sealValidationResult: "VALID",
        incidentFlag: false,
      },
      data: [{ items }],
      source: "local-mock-provider",
      mockLabel: "MOCK",
    };
    return NextResponse.json(envelope, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        status: "GOVERNANCE UNAVAILABLE",
        mode: "LIVE",
        endpoint: "/api/collective/deliberations",
        error: "Collective deliberation data unavailable",
      },
      { status: 503 },
    );
  }
}
