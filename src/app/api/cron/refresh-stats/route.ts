import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET is not configured");
    return NextResponse.json(
      { error: "Refresh is not configured" },
      { status: 503 }
    );
  }
  const expected = Buffer.from(`Bearer ${secret}`);
  const supplied = Buffer.from(request.headers.get("authorization") ?? "");
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await db.$transaction(
      async (tx) => {
        // Leave time for PostgreSQL to roll back before the hosting timeout.
        await tx.$executeRawUnsafe("SET LOCAL statement_timeout = '240s'");
        const [state] = await tx.$queryRaw<{ refreshed: boolean }[]>`
        SELECT refresh_stats_summary() AS refreshed
      `;
        return state;
      },
      { timeout: 260_000 }
    );
    return NextResponse.json({ success: true, refreshed: result.refreshed });
  } catch (error) {
    console.error("Stats summary refresh failed:", error);
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
