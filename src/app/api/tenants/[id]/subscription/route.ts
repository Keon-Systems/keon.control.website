import { NextResponse } from "next/server";
import { mockTenantDetails } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const detail = mockTenantDetails[id];

  if (!detail) {
    return NextResponse.json(
      { error: "Tenant not found", tenantId: id },
      { status: 404 },
    );
  }

  return NextResponse.json({
    mode: "mock",
    generatedAt: new Date().toISOString(),
    data: {
      tenantId: detail.tenantId,
      plan: detail.plan,
      status: detail.status,
      mrr: detail.mrr,
      seats: detail.seats,
      usedSeats: detail.usedSeats,
      billingCycleAnchor: detail.billingCycleAnchor,
      trialEndDate: detail.trialEndDate,
      createdAt: detail.createdAt,
    },
  });
}
