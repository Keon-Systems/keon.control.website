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
      storage: {
        usedGb: detail.usedStorageGb,
        quotaGb: detail.storageQuotaGb,
        percentUsed: Math.round((detail.usedStorageGb / detail.storageQuotaGb) * 100),
      },
      apiCalls: {
        used: detail.apiCallsUsed,
        quota: detail.apiCallsQuota,
        percentUsed: Math.round((detail.apiCallsUsed / detail.apiCallsQuota) * 100),
      },
      seats: {
        used: detail.usedSeats,
        total: detail.seats,
        percentUsed: Math.round((detail.usedSeats / detail.seats) * 100),
      },
    },
  });
}
