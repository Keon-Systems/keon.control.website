import { NextResponse } from "next/server";
import { mockSupportTickets } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    mode: "mock",
    generatedAt: new Date().toISOString(),
    data: mockSupportTickets,
  });
}
