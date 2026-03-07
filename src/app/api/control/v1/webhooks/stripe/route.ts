import { NextRequest, NextResponse } from "next/server";
import { applyStripeWebhook, parseStripeEvent, verifyAndParseStripeWebhook } from "@/lib/server/control-plane";
import { getStripeWebhookSecret, isStripeEnabled } from "@/lib/server/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (isStripeEnabled() && getStripeWebhookSecret()) {
    try {
      const event = verifyAndParseStripeWebhook(rawBody, request.headers.get("stripe-signature"));
      const parsed = parseStripeEvent(event);
      if (!parsed?.tenantId) {
        return NextResponse.json({ error: "tenant_id metadata missing from Stripe event" }, { status: 400 });
      }

      const result = await applyStripeWebhook(parsed);
      return NextResponse.json({ accepted: true, duplicate: result.duplicate, provider: "stripe" }, { status: 202 });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Webhook failed" }, { status: 400 });
    }
  }

  try {
    const body = JSON.parse(rawBody) as {
      id?: string;
      type?: string;
      tenant_id?: string;
      plan_code?: "builder" | "startup" | "growth" | "enterprise";
    };
    if (!body.id || !body.type || !body.tenant_id) {
      return NextResponse.json({ error: "id, type, and tenant_id are required" }, { status: 400 });
    }

    const result = await applyStripeWebhook({
      id: body.id,
      type: body.type,
      tenantId: body.tenant_id,
      planCode: body.plan_code,
    });
    return NextResponse.json({ accepted: true, duplicate: result.duplicate, provider: "mock" }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Webhook failed" }, { status: 400 });
  }
}
