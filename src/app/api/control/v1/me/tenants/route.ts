import { NextResponse } from "next/server";
import { listTenants } from "@/lib/server/control-plane";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listTenants(), { status: 200 });
}
