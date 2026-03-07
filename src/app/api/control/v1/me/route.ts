import { NextResponse } from "next/server";
import { getMe } from "@/lib/server/control-plane";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getMe(), { status: 200 });
}
