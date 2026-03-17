import { NextResponse } from "next/server";
import { getGovernanceCollection, GovernanceUnavailableError } from "@/lib/server/governance-api";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await getGovernanceCollection("incidents");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const incident = result.data?.find((i: any) => i.id === id);
    if (!incident) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ...result, data: incident });
  } catch (error) {
    const message =
      error instanceof GovernanceUnavailableError
        ? error.message
        : "Governance service unavailable";
    return NextResponse.json({ status: "GOVERNANCE UNAVAILABLE", message }, { status: 503 });
  }
}
