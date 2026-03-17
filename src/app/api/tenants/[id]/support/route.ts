import { NextResponse } from "next/server";
import { mockSupportTickets } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tickets = mockSupportTickets.filter((t) => t.tenantId === id);

  return NextResponse.json({
    mode: "mock",
    generatedAt: new Date().toISOString(),
    data: tickets,
  });
}
