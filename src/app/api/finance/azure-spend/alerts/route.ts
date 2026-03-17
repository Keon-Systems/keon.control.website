import { NextResponse } from "next/server";
import { getGovernanceCollection, GovernanceUnavailableError } from "@/lib/server/governance-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await getGovernanceCollection("finance-azure-spend-alerts");
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof GovernanceUnavailableError ? error.message : "Governance service unavailable";
    return NextResponse.json({ status: "GOVERNANCE UNAVAILABLE", message }, { status: 503 });
  }
}
