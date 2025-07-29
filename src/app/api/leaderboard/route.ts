import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  Applications,
  BigIntStatKeys,
  FloatStatKeys,
  Periods,
  UserWithStats,
  type ApplicationType,
  type PeriodType,
} from "@/types";
import { unsupportedMethod } from "@/lib/routeUtils";
import { getPeriodStart } from "@/lib/dateUtils";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);

    const period = (searchParams.get("period") || "yearly") as PeriodType;
    const applicationParam = searchParams.get("application") || "all";
    const applications =
      applicationParam === "all"
        ? Applications
        : [applicationParam as ApplicationType];

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(
      parseInt(searchParams.get("pageSize") || "100"),
      500
    ); // Max 500

    // Validate parameters
    if (!Periods.includes(period)) {
      return NextResponse.json(
        {
          error:
            "Invalid period parameter. Must be one of: " + Periods.join(", "),
        },
        { status: 400 }
      );
    }

    if (applications.length === 0) {
      return NextResponse.json(
        { error: "At least one application must be selected" },
        { status: 400 }
      );
    }

    if (page < 1) {
      return NextResponse.json({ error: "Page must be >= 1" }, { status: 400 });
    }

    if (pageSize < 1 || pageSize > 500) {
      return NextResponse.json(
        { error: "Page size must be between 1 and 500" },
        { status: 400 }
      );
    }

    // Get all stats, grouped by user, for the specified period and applications.  This is to avoid
    // having to add up all stats for each user right here in the route.  We also filter for stats
    // that are newer than the current equivalent of the specified stats period (e.g. the current
    // year, month, etc.)
    const bigIntColumns = BigIntStatKeys.map(
      (k) => `SUM("${k}")::bigint as "${k}"`
    ).join(", ");
    const floatColumns = FloatStatKeys.map(
      (k) => `SUM("${k}")::float as "${k}"`
    ).join(", ");

    const usersWithMetrics = (await db.$queryRaw`
        SELECT
          "userId",
          "githubId", 
          "username",
          "displayName",
          "avatarUrl", 
          "email",
          ${Prisma.raw(bigIntColumns)},
          ${Prisma.raw(floatColumns)}
        FROM users
        JOIN user_stats ON users.id = user_stats."userId"
        WHERE "period" = ${period}
          AND "application" = ANY(${applications})
          AND "periodStart" >= ${getPeriodStart(period)}
        GROUP BY "userId", "githubId", "username", "displayName", "avatarUrl", "email"
        ORDER BY "cost" DESC
      `) as UserWithStats[];

    const leaderboardData = {
      users: usersWithMetrics,
      total: usersWithMetrics.length,
      currentPage: page,
      pageSize,
      period,
      application: applicationParam,
    };

    // @ts-expect-error Convert BigInts to strings for JSON serialization.
    BigInt.prototype.toJSON = function () {
      return { $bigint: this.toString() };
    };

    return NextResponse.json({
      success: true,
      data: leaderboardData,
    });
  } catch (error) {
    console.error("Leaderboard API error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const POST = unsupportedMethod;
export const PUT = unsupportedMethod;
export const DELETE = unsupportedMethod;
