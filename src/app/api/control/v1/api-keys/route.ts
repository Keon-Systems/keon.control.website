import { NextRequest, NextResponse } from "next/server";
import { listApiKeys } from "@/lib/server/control-plane";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get("tenantId");
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  }

  return NextResponse.json(await listApiKeys(tenantId), { status: 200 });
}
