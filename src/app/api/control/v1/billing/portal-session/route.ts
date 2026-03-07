import { NextRequest, NextResponse } from "next/server";
import { createPortalSession } from "@/lib/server/control-plane";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const tenantId = body?.tenant_id as string | undefined;
  const returnUrl = body?.return_url as string | undefined;

  if (!tenantId || !returnUrl) {
    return NextResponse.json({ error: "tenant_id and return_url are required" }, { status: 400 });
  }

  try {
    return NextResponse.json(await createPortalSession({ tenantId, returnUrl }), { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Portal session failed" }, { status: 403 });
  }
}
