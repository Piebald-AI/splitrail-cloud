import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { n } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get("timezone") || "UTC";
    const application = searchParams.get("application") || null;

    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db.$queryRaw<
      Array<{
        day: Date;
        model: string;
        total_cost: number;
        input_tokens: Prisma.Decimal;
        output_tokens: Prisma.Decimal;
        cached_tokens: Prisma.Decimal;
        reasoning_tokens: Prisma.Decimal;
        tool_calls: Prisma.Decimal;
      }>
    >`
      SELECT
        ("date" AT TIME ZONE 'UTC' AT TIME ZONE ${timezone})::date AS day,
        model,
        SUM(cost) AS total_cost,
        SUM("inputTokens") AS input_tokens,
        SUM("outputTokens") AS output_tokens,
        SUM("cachedTokens") AS cached_tokens,
        SUM("reasoningTokens") AS reasoning_tokens,
        SUM("toolCalls") AS tool_calls
      FROM message_stats
      WHERE "userId" = ${userId}
        AND model IS NOT NULL
        ${application ? Prisma.sql`AND application = ${application}` : Prisma.sql``}
      GROUP BY day, model
      ORDER BY day, model
    `;

    // Shape: { [dateKey]: { [model]: { tokens, cost, toolCalls } } }
    const data: Record<string, Record<string, { tokens: number; cost: number; toolCalls: number }>> = {};

    for (const r of rows) {
      if (!r.day || !r.model) continue;
      const dateKey = `${r.day.toISOString().split("T")[0]}T00:00:00.000Z`;
      if (!data[dateKey]) data[dateKey] = {};
      const tokens =
        n(r.input_tokens) + n(r.output_tokens) + n(r.cached_tokens) + n(r.reasoning_tokens);
      data[dateKey][r.model] = {
        tokens,
        cost: r.total_cost,
        toolCalls: n(r.tool_calls),
      };
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Get model stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
