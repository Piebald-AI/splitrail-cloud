import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UserStats } from "@/types";

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
          error: "Invalid period parameter. Must be one of: " + validPeriods.join(", "),
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
            period,
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
    console.log("usersWithStats", usersWithStats);

    // Filter users who have stats for the selected period and prepare data
    const usersWithMetrics = usersWithStats
      .filter((user) => {
        return user.userStats.length > 0;
      })
      .map((user) => {
        const stats = user.userStats[0] as unknown as UserStats;
        return {
          rank: 0,
          badge: undefined as "gold" | "silver" | "bronze" | undefined,
          ...user,
          ...stats,
        };
      });
    console.log("usersWithMetrics", usersWithMetrics);

    // Apply pagination
    const paginatedUsers = usersWithMetrics.slice(skip, skip + pageSize);
    console.log("paginatedUsers", paginatedUsers);

    const leaderboardData = {
      users: paginatedUsers,
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
