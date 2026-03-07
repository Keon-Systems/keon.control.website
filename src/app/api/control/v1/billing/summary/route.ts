import { NextRequest, NextResponse } from "next/server";
import { getBillingSummary } from "@/lib/server/control-plane";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get("tenantId");
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  }

  try {
    return NextResponse.json(await getBillingSummary(tenantId), { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown tenant" }, { status: 404 });
  }
}
