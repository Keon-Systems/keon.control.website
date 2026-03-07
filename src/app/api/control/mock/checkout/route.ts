import { NextRequest, NextResponse } from "next/server";
import { completeCheckoutSession } from "@/lib/server/control-plane";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const action = request.nextUrl.searchParams.get("action") === "cancel" ? "cancel" : "success";

  if (!sessionId) {
    return NextResponse.redirect(new URL("/billing/cancel?error=missing-session", request.url));
  }

  try {
    const session = await completeCheckoutSession(sessionId, action);
    const redirectPath =
      action === "success"
        ? `/billing/success?session_id=${session.id}&tenant_id=${session.tenantId}`
        : `/billing/cancel?session_id=${session.id}&tenant_id=${session.tenantId}`;
    return NextResponse.redirect(new URL(redirectPath, request.url));
  } catch {
    return NextResponse.redirect(new URL("/billing/cancel?error=invalid-session", request.url));
  }
}
