import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      status: "ACCEPTED",
      messageId: `msg-${Date.now()}`,
      enqueuedAt: new Date().toISOString(),
      message: "Message accepted for delivery",
    },
    { status: 202 }
  );
}
