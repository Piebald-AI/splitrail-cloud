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

    // Users can only access their own stats data (for now)
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db.$queryRaw<
      Array<{
        day: Date | null;
        application: string | null;
        total_cost: number;
        cached_tokens: Prisma.Decimal;
        input_tokens: Prisma.Decimal;
        output_tokens: Prisma.Decimal;
        reasoning_tokens: Prisma.Decimal;
        conversations: bigint;
        tool_calls: Prisma.Decimal;
        lines_read: Prisma.Decimal;
        lines_edited: Prisma.Decimal;
        lines_added: Prisma.Decimal;
        models: string[];
        days_tracked: bigint;
        num_apps: bigint;
        applications: string[];
        first_date: Date;
        last_date: Date;
      }>
    >`
        WITH base AS (
          SELECT *,
            ("date" AT TIME ZONE 'UTC' AT TIME ZONE ${timezone})::date AS local_day
          FROM message_stats
          WHERE "userId" = ${userId}
        ),
        conversation_starts AS (
          SELECT
            "conversationHash",
            application,
            MIN(local_day) AS start_day
          FROM base
          GROUP BY "conversationHash", application
        ),
        conversations_per_day_app AS (
          SELECT
            start_day AS day,
            application,
            COUNT(*) AS conversations
          FROM conversation_starts
          GROUP BY start_day, application
        ),
        counts AS (
          SELECT 
            COUNT(DISTINCT local_day) AS days_tracked,
            COUNT(DISTINCT application) AS num_apps,
            ARRAY_AGG(DISTINCT application) FILTER (WHERE application IS NOT NULL) AS applications,
            MIN(local_day) AS first_date,
            MAX(local_day) AS last_date
          FROM base
        ),
        grouped_stats AS (
          SELECT
            local_day AS day,
            application,
            SUM(cost) AS total_cost,
            SUM("cachedTokens") AS cached_tokens,
            SUM("inputTokens") AS input_tokens,
            SUM("outputTokens") AS output_tokens,
            SUM("reasoningTokens") AS reasoning_tokens,
            SUM("toolCalls") AS tool_calls,
            SUM("linesRead") AS lines_read,
            SUM("linesEdited") AS lines_edited,
            SUM("linesAdded") AS lines_added,
            ARRAY_AGG(DISTINCT model) FILTER (WHERE model IS NOT NULL) AS models,
            COUNT(DISTINCT "conversationHash") AS conversations_set
          FROM base
          GROUP BY GROUPING SETS (
            (local_day, application),
            (application),
            ()
          )
        )
        SELECT
          s.day,
          s.application,
          s.total_cost,
          s.cached_tokens,
          s.input_tokens,
          s.output_tokens,
          s.reasoning_tokens,
          COALESCE(c.conversations, s.conversations_set, 0) AS conversations,
          s.tool_calls,
          s.lines_read,
          s.lines_edited,
          s.lines_added,
          s.models,
          CASE WHEN s.day IS NULL AND s.application IS NULL THEN counts.days_tracked ELSE NULL END AS days_tracked,
          CASE WHEN s.day IS NULL AND s.application IS NULL THEN counts.num_apps ELSE NULL END AS num_apps,
          CASE WHEN s.day IS NULL AND s.application IS NULL THEN counts.applications ELSE NULL END AS applications,
          CASE WHEN s.day IS NULL AND s.application IS NULL THEN counts.first_date ELSE NULL END AS first_date,
          CASE WHEN s.day IS NULL AND s.application IS NULL THEN counts.last_date ELSE NULL END AS last_date
        FROM grouped_stats s
        LEFT JOIN conversations_per_day_app c
          ON s.day = c.day AND s.application = c.application
        LEFT JOIN counts
          ON s.day IS NULL AND s.application IS NULL
        ORDER BY s.application, s.day NULLS LAST
      `;

    type StatsRecord = {
      [key: string]: Record<string, unknown>;
    } & {
      totals?: Record<string, unknown>;
      grandTotal?: {
        daysTracked: number;
        numApps: number;
        applications: string[];
        cost: number;
        inputTokens: number;
        outputTokens: number;
        cachedTokens: number;
        tokens?: number;
        conversations: number;
        toolCalls: number;
        linesRead: number;
        linesAdded: number;
        linesEdited: number;
        firstDate: Date;
        lastDate: Date;
      };
    };
    const stats: StatsRecord = {};

    if (rows.length > 1) {
      rows.forEach((r) => {
        // Handle grand total row (both day and application are null)
        if (r.day === null && r.application === null) {
          stats.grandTotal = {
            daysTracked: Number(r.days_tracked),
            numApps: Number(r.num_apps),
            applications: r.applications,
            cost: r.total_cost,
            inputTokens: n(r.input_tokens),
            outputTokens: n(r.output_tokens),
            cachedTokens: n(r.cached_tokens),
            tokens: n(
              Prisma.Decimal.sum(
                r.input_tokens,
                r.output_tokens,
                r.cached_tokens,
                r.reasoning_tokens
              )
            ),
            conversations: Number(r.conversations),
            toolCalls: n(r.tool_calls),
            linesRead: n(r.lines_read),
            linesAdded: n(r.lines_added),
            linesEdited: n(r.lines_edited),
            firstDate: r.first_date,
            lastDate: r.last_date,
          };
          return;
        }

        // Skip rows where application is null but day is not (partial rollup totals we don't need)
        if (!r.application) return;

        const app = r.application as string;
        // Fix: Ensure date keys are always midnight UTC, avoiding timezone shifts
        const dayKey = r.day
          ? `${r.day.toISOString().split("T")[0]}T00:00:00.000Z`
          : null;

        if (dayKey === null) {
          // Application totals
          if (!stats.totals) stats.totals = {};
          stats.totals[app] = {
            cost: r.total_cost,
            inputTokens: n(r.input_tokens),
            outputTokens: n(r.output_tokens),
            cachedTokens: n(r.cached_tokens),
            conversations: n(r.conversations),
            toolCalls: n(r.tool_calls),
            linesRead: n(r.lines_read),
            linesAdded: n(r.lines_added),
            linesEdited: n(r.lines_edited),
            models: r.models || [],
          };
        } else {
          // Daily stats per application
          if (!stats[dayKey]) stats[dayKey] = {};
          stats[dayKey][app] = {
            cost: r.total_cost,
            inputTokens: n(r.input_tokens),
            outputTokens: n(r.output_tokens),
            cachedTokens: n(r.cached_tokens),
            conversations: n(r.conversations),
            toolCalls: n(r.tool_calls),
            linesRead: n(r.lines_read),
            linesAdded: n(r.lines_added),
            linesEdited: n(r.lines_edited),
            models: r.models || [],
          };
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: rows.length > 1 ? stats : null,
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
