import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { type SortColumn, type SortOrder } from "@/types";

type PeriodType = "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "all-time";

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);

    const sortBy = (searchParams.get("sortBy") || "totalCost") as SortColumn;
    const sortOrder = (searchParams.get("sortOrder") || "desc") as SortOrder;
    const period = (searchParams.get("period") || "all-time") as PeriodType;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(
      parseInt(searchParams.get("pageSize") || "100"),
      500
    ); // Max 500

    // Validate period parameter
    const validPeriods: PeriodType[] = [
      "hourly",
      "daily", 
      "weekly",
      "monthly",
      "yearly",
      "all-time"
    ];

    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: "Invalid period parameter. Must be one of: hourly, daily, weekly, monthly, yearly, all-time" },
        { status: 400 }
      );
    }

    // Validate sort parameters
    const validSortColumns: SortColumn[] = [
      "totalCost",
      "totalInputTokens",
      "totalOutputTokens",
      "totalMessagesSent",
      "totalToolsCalled",
      "totalFilesRead",
      "totalFilesEdited",
      "totalFilesWritten",
      "totalLinesRead",
      "totalLinesEdited",
      "totalLinesWritten",
      "totalBytesRead",
      "totalBytesEdited",
      "totalBytesWritten",
      "totalTerminalCommands",
      "totalGlobSearches",
      "totalGrepSearches",
      "totalTodosCreated",
      "totalTodosCompleted",
      "totalTodosInProgress",
      "totalTodoWrites",
      "totalTodoReads",
    ];

    if (!validSortColumns.includes(sortBy)) {
      return NextResponse.json(
        { error: "Invalid sortBy parameter" },
        { status: 400 }
      );
    }

    if (!["asc", "desc"].includes(sortOrder)) {
      return NextResponse.json(
        { error: "Invalid sortOrder parameter" },
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
    
    // Determine which stats table to query
    let statsInclude;
    switch (period) {
      case "hourly":
        statsInclude = { hourlyStats: true };
        break;
      case "daily":
        statsInclude = { dailyStats: true };
        break;
      case "weekly":
        statsInclude = { weeklyStats: true };
        break;
      case "monthly":
        statsInclude = { monthlyStats: true };
        break;
      case "yearly":
        statsInclude = { yearlyStats: true };
        break;
      case "all-time":
        statsInclude = { allTimeStats: true };
        break;
      default:
        statsInclude = { allTimeStats: true };
    }

    // Get users with their period stats and preferences
    const usersWithStats = await db.user.findMany({
      include: {
        ...statsInclude,
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
    const usersWithMetrics = usersWithStats
      .filter((user) => {
        switch (period) {
          case "hourly":
            return user.hourlyStats !== null;
          case "daily":
            return user.dailyStats !== null;
          case "weekly":
            return user.weeklyStats !== null;
          case "monthly":
            return user.monthlyStats !== null;
          case "yearly":
            return user.yearlyStats !== null;
          case "all-time":
            return user.allTimeStats !== null;
          default:
            return user.allTimeStats !== null;
        }
      })
      .map((user) => {
        let stats;
        switch (period) {
          case "hourly":
            stats = user.hourlyStats;
            break;
          case "daily":
            stats = user.dailyStats;
            break;
          case "weekly":
            stats = user.weeklyStats;
            break;
          case "monthly":
            stats = user.monthlyStats;
            break;
          case "yearly":
            stats = user.yearlyStats;
            break;
          case "all-time":
            stats = user.allTimeStats;
            break;
          default:
            stats = user.allTimeStats;
        }

        return {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          createdAt: user.createdAt,
          totalCost: stats?.totalCost || 0,
          totalInputTokens: Number(stats?.totalInputTokens || 0),
          totalOutputTokens: Number(stats?.totalOutputTokens || 0),
          totalCacheCreationTokens: Number(stats?.totalCacheCreationTokens || 0),
          totalCacheReadTokens: Number(stats?.totalCacheReadTokens || 0),
          totalMessagesSent: stats?.totalMessagesSent || 0,
          totalToolsCalled: stats?.totalToolsCalled || 0,
          totalFilesRead: stats?.totalFilesRead || 0,
          totalFilesEdited: stats?.totalFilesEdited || 0,
          totalFilesWritten: stats?.totalFilesWritten || 0,
          totalLinesRead: Number(stats?.totalLinesRead || 0),
          totalLinesEdited: Number(stats?.totalLinesEdited || 0),
          totalLinesWritten: Number(stats?.totalLinesWritten || 0),
          totalBytesRead: Number(stats?.totalBytesRead || 0),
          totalBytesEdited: Number(stats?.totalBytesEdited || 0),
          totalBytesWritten: Number(stats?.totalBytesWritten || 0),
          totalTerminalCommands: stats?.totalTerminalCommands || 0,
          totalGlobSearches: stats?.totalGlobSearches || 0,
          totalGrepSearches: stats?.totalGrepSearches || 0,
          totalTodosCreated: stats?.totalTodosCreated || 0,
          totalTodosCompleted: stats?.totalTodosCompleted || 0,
          totalTodosInProgress: stats?.totalTodosInProgress || 0,
          totalTodoWrites: stats?.totalTodoWrites || 0,
          totalTodoReads: stats?.totalTodoReads || 0,
          rank: 0,
          badge: undefined as "gold" | "silver" | "bronze" | undefined,
          periodStart: stats?.periodStart,
          periodEnd: stats?.periodEnd,
        };
      });

    // Sort users based on the specified metric
    const sortedUsers = usersWithMetrics.sort((a, b) => {
      const valueA = a[sortBy as keyof typeof a] as number;
      const valueB = b[sortBy as keyof typeof b] as number;
      
      return sortOrder === "desc" ? valueB - valueA : valueA - valueB;
    });

    // Assign ranks and badges
    sortedUsers.forEach((user, index) => {
      user.rank = index + 1;
      if (index === 0) user.badge = "gold";
      else if (index === 1) user.badge = "silver";
      else if (index === 2) user.badge = "bronze";
    });

    // Apply pagination
    const paginatedUsers = sortedUsers.slice(skip, skip + pageSize);

    const leaderboardData = {
      users: paginatedUsers,
      total: sortedUsers.length,
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
