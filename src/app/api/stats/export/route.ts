import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Export token usage statistics in a format compatible with `splitrail stats` CLI output.
 *
 * Authentication: Bearer token in Authorization header
 *
 * Query Parameters:
 *   - month (optional): Month in YYYY-MM format (e.g., "2025-12"). If omitted, returns all data.
 *
 * Response format matches the structure expected by scripts that consume `splitrail stats`,
 * with data grouped by application (e.g., piebald, claude_code, gemini_cli):
 * {
 *   "analyzer_stats": [
 *     {
 *       "name": "piebald",
 *       "daily_stats": {
 *         "2025-12-01": {
 *           "model_stats": {
 *             "claude-sonnet-4-20250514": {
 *               "inputTokens": 123456,
 *               "cacheCreationTokens": 78901,
 *               "cacheReadTokens": 234567,
 *               "outputTokens": 45678,
 *               "cost": 12.34
 *             }
 *           }
 *         }
 *       }
 *     },
 *     {
 *       "name": "claude_code",
 *       "daily_stats": { ... }
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    // Validate token has required st_ prefix before database lookup
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token || !token.startsWith("st_")) {
      return NextResponse.json({ error: "Invalid API token" }, { status: 401 });
    }

    const apiToken = await db.apiToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!apiToken) {
      return NextResponse.json({ error: "Invalid API token" }, { status: 401 });
    }

    // Update last used timestamp
    await db.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsed: new Date() },
    });

    const user = apiToken.user;

    // Parse optional month parameter
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    // If month is provided, validate and calculate date range
    if (month) {
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(month)) {
        return NextResponse.json(
          { error: "Invalid month format. Expected: YYYY-MM (e.g., 2025-12)" },
          { status: 400 }
        );
      }

      const [year, monthNum] = month.split("-").map(Number);

      // Validate month is in valid range
      if (monthNum < 1 || monthNum > 12) {
        return NextResponse.json(
          { error: "Invalid month value. Expected: 01-12" },
          { status: 400 }
        );
      }

      startDate = new Date(Date.UTC(year, monthNum - 1, 1));
      endDate = new Date(Date.UTC(year, monthNum, 1)); // First day of next month
    }

    // Query message stats grouped by application, date, and model
    // If no month specified, return all data
    const rows = await db.$queryRaw<
      Array<{
        application: string;
        date: Date;
        model: string | null;
        inputTokens: bigint;
        cacheCreationTokens: bigint;
        cacheReadTokens: bigint;
        outputTokens: bigint;
        cost: number | null;
      }>
    >`
      SELECT
        application,
        DATE("date") as date,
        model,
        SUM("inputTokens")::bigint as "inputTokens",
        SUM("cacheCreationTokens")::bigint as "cacheCreationTokens",
        SUM("cacheReadTokens")::bigint as "cacheReadTokens",
        SUM("outputTokens")::bigint as "outputTokens",
        SUM(cost) as cost
      FROM message_stats
      WHERE "userId" = ${user.id}
        AND (${startDate}::timestamp IS NULL OR "date" >= ${startDate})
        AND (${endDate}::timestamp IS NULL OR "date" < ${endDate})
      GROUP BY application, DATE("date"), model
      ORDER BY application, DATE("date"), model
    `;

    // Build the response in splitrail stats format, grouped by application
    type ModelStats = {
      inputTokens: number;
      cacheCreationTokens: number;
      cacheReadTokens: number;
      outputTokens: number;
      cost: number;
    };

    type DayStats = {
      model_stats: Record<string, ModelStats>;
    };

    type AppStats = {
      name: string;
      daily_stats: Record<string, DayStats>;
    };

    const appStats: Record<string, AppStats> = {};

    for (const row of rows) {
      const appKey = row.application;
      const dateKey = row.date.toISOString().split("T")[0];
      const modelKey = row.model || "unknown";

      // Initialize application if not exists
      if (!appStats[appKey]) {
        appStats[appKey] = {
          name: appKey,
          daily_stats: {},
        };
      }

      // Initialize day if not exists
      if (!appStats[appKey].daily_stats[dateKey]) {
        appStats[appKey].daily_stats[dateKey] = { model_stats: {} };
      }

      appStats[appKey].daily_stats[dateKey].model_stats[modelKey] = {
        inputTokens: Number(row.inputTokens),
        cacheCreationTokens: Number(row.cacheCreationTokens),
        cacheReadTokens: Number(row.cacheReadTokens),
        outputTokens: Number(row.outputTokens),
        cost: row.cost ?? 0,
      };
    }

    return NextResponse.json({
      analyzer_stats: Object.values(appStats),
    });
  } catch (error) {
    console.error("Stats export error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
