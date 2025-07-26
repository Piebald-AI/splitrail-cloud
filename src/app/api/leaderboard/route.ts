import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { StatKeys, type ApplicationType, type PeriodType } from "@/types";
import { unsupportedMethod } from "@/lib/routeUtils";

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);

    const apps: ApplicationType[] = ["claude_code", "gemini_cli", "codex_cli"];
    const period = (searchParams.get("period") || "all-time") as PeriodType;
    const applicationsParam = searchParams.get("applications");
    const applications = applicationsParam
      ? (applicationsParam
          .split(",")
          .filter((app) =>
            apps.includes(app as ApplicationType)
          ) as ApplicationType[])
      : apps;

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(
      parseInt(searchParams.get("pageSize") || "100"),
      500
    ); // Max 500

    const validPeriods = [
      "hourly",
      "daily",
      "weekly",
      "monthly",
      "yearly",
      "all-time",
    ];

    // Validate parameters
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        {
          error:
            "Invalid period parameter. Must be one of: " +
            validPeriods.join(", "),
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

    // Get leaderboard data based on period
    const skip = (page - 1) * pageSize;

    // Get users with their period stats and preferences
    const usersWithStats = await db.user.findMany({
      include: {
        userStats: {
          where: {
            AND: [
              { OR: [{ period }, { period: "all-time" }] },
              { application: { in: applications } },
            ],
          },
        },
        preferences: true,
      },
      where: {
        OR: [
          { preferences: { optOutPublic: false } },
          { preferences: null },
          { preferences: { optOutPublic: { not: true } } },
        ],
      },
    });

    // Filter users who have stats for the selected period and prepare data
    const costs: number[] = [];
    const userCosts: Record<string, number> = {};
    const usersWithMetrics = usersWithStats
      .filter((user) => {
        return user.userStats.length > 0;
      })
      .map((user) => {
        // Aggregate stats across selected applications for each period
        const currentPeriodStats = user.userStats.filter(
          (stat) => stat.period === period
        );
        const allTimeStats = user.userStats.filter(
          (stat) => stat.period === "all-time"
        );

        // Sum up stats across applications for the current period
        const aggregateStats = (stats: typeof user.userStats) => {
          const result = { ...stats[0] }; // Start with first stat as template
          StatKeys.forEach((field) => {
            result[field] = stats.reduce(
              (sum, stat) => sum + (stat[field] || 0),
              0
            );
          });

          return result;
        };

        const aggregatedCurrentPeriod =
          currentPeriodStats.length > 0
            ? aggregateStats(currentPeriodStats)
            : null;
        const aggregatedAllTime =
          allTimeStats.length > 0 ? aggregateStats(allTimeStats) : null;

        // Use current period stats if available, otherwise all-time
        const statsToShow =
          period === "all-time"
            ? aggregatedAllTime
            : aggregatedCurrentPeriod || aggregatedAllTime;

        if (!statsToShow) return null;

        // Cost for ranking (use all-time if current period not available)
        const costForRanking = aggregatedAllTime?.cost || 0;
        costs.push(costForRanking);
        userCosts[user.id] = costForRanking;

        return {
          rank: 0,
          ...statsToShow,
          ...user,
        };
      })
      .filter(Boolean); // Remove null entries

    // Add ranks to user, based on cost.  So the user with the maximum cost value is gold, then
    // silver, then bronze, then just numbers.
    costs.sort((a, b) => b - a);
    usersWithMetrics.forEach((user) => {
      if (!user) return;
      const costIndex = costs.indexOf(userCosts[user.id]);
      user.rank = costIndex + 1;
    });

    const leaderboardData = {
      users: usersWithMetrics.slice(skip, skip + pageSize),
      total: usersWithMetrics.length,
      currentPage: page,
      pageSize,
      period,
      applications,
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
