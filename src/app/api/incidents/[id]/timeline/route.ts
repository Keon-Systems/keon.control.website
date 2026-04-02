import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json({
    data: [
      {
        eventId: "evt-001",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        actor: "system",
        type: "detection",
        description: "Alert threshold exceeded — automated detection",
      },
      {
        eventId: "evt-002",
        timestamp: new Date(Date.now() - 3300000).toISOString(),
        actor: "ops@keon.systems",
        type: "declaration",
        description: `Incident ${id} declared`,
      },
      {
        eventId: "evt-003",
        timestamp: new Date(Date.now() - 2700000).toISOString(),
        actor: "ops@keon.systems",
        type: "update",
        description:
          "Investigation underway — root cause identified as database connection pool exhaustion",
      },
    ],
  });
}
