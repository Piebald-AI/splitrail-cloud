import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type PeriodType =
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "all-time";

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);

    const period = (searchParams.get("period") || "all-time") as PeriodType;
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

    // Validate period parameter
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
            OR: [{ period }, { period: "all-time" }],
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
        // In the query above, we fetched the stats for both this period and all time, so that we
        // can show ranks based on all time, but display stats based on the selected period.
        // Here, we'll record a list of all users' total costs and later rank the users based on
        // their total costs. If the selected period is "all-time", the query above will only
        // return one row, so we'll just use that row.
        const cost = user.userStats[period === "all-time" ? 0 : 1].cost;
        costs.push(cost);
        userCosts[user.id] = cost;
        return {
          rank: 0,
          ...user.userStats[0],
          ...user,
        };
      });

    // Add ranks to user, based on cost.  So the user with the maximum cost value is gold, then
    // silver, then bronze, then just numbers.
    costs.sort((a, b) => b - a);
    usersWithMetrics.forEach((user) => {
      const costIndex = costs.indexOf(userCosts[user.id]);
      user.rank = costIndex + 1;
    });

    const leaderboardData = {
      users: usersWithMetrics.slice(skip, skip + pageSize),
      total: usersWithMetrics.length,
      currentPage: page,
      pageSize,
      period,
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

// Handle unsupported methods
export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
