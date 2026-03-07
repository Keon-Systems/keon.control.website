import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/server/control-plane";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const tenantId = body?.tenant_id as string | undefined;
  const planCode = body?.plan_code as "builder" | "startup" | "growth" | "enterprise" | undefined;
  const successUrl = body?.success_url as string | undefined;
  const cancelUrl = body?.cancel_url as string | undefined;

  if (!tenantId || !planCode || !successUrl || !cancelUrl) {
    return NextResponse.json({ error: "tenant_id, plan_code, success_url, and cancel_url are required" }, { status: 400 });
  }

  try {
    return NextResponse.json(await createCheckoutSession({ tenantId, planCode, successUrl, cancelUrl }), { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout session failed" }, { status: 403 });
  }
}
