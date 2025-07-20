import { NextRequest, NextResponse } from "next/server";
import { DatabaseService, db } from "@/lib/db";
import {
  StatKeys,
  UserStats,
  type UploadStatsRequest,
  type ApplicationType,
} from "@/types";

function getHourStart(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    0,
    0,
    0
  );
}

function getDayStart(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0
  );
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff, 0, 0, 0, 0);
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function getYearStart(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

function getHourEnd(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    59,
    59,
    999
  );
}

function getDayEnd(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
  );
}

function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  return new Date(
    weekStart.getTime() +
      6 * 24 * 60 * 60 * 1000 +
      23 * 60 * 60 * 1000 +
      59 * 60 * 1000 +
      59 * 1000 +
      999
  );
}

function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function getYearEnd(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

async function updateCurrentPeriodStats(
  userId: string,
  application: ApplicationType,
  eventDate: Date,
  stats: Partial<UserStats>
) {
  // Update all period stats in parallel
  await Promise.all([
    updatePeriodStats(
      userId,
      application,
      "hourly",
      getHourStart(eventDate),
      getHourEnd(eventDate),
      stats
    ),
    updatePeriodStats(
      userId,
      application,
      "daily",
      getDayStart(eventDate),
      getDayEnd(eventDate),
      stats
    ),
    updatePeriodStats(
      userId,
      application,
      "weekly",
      getWeekStart(eventDate),
      getWeekEnd(eventDate),
      stats
    ),
    updatePeriodStats(
      userId,
      application,
      "monthly",
      getMonthStart(eventDate),
      getMonthEnd(eventDate),
      stats
    ),
    updatePeriodStats(
      userId,
      application,
      "yearly",
      getYearStart(eventDate),
      getYearEnd(eventDate),
      stats
    ),
    updatePeriodStats(userId, application, "all-time", null, null, stats),
  ]);
}

async function updatePeriodStats(
  userId: string,
  application: ApplicationType,
  period: string,
  periodStart: Date | null,
  periodEnd: Date | null,
  stats: Partial<UserStats>
) {
  const existingStats = await db.userStats.findUnique({
    where: {
      userId_period_application: {
        userId,
        period,
        application,
      },
    },
  });

  // If there are existing stats, and the existing period start is not equal to the new period
  // start (i.e. a new period has begun).
  if (
    !existingStats ||
    (periodStart &&
      existingStats.periodStart &&
      existingStats.periodStart.getTime() !== periodStart.getTime())
  ) {
    const statsData = {
      application,
      period,
      periodStart,
      periodEnd,
      // Get all the stats whose keys are in StatKeys.
      ...Object.fromEntries(
        Object.entries(stats).filter(([key]) =>
          (StatKeys as readonly string[]).includes(key)
        )
      ),
    };

    // New period - replace existing stats
    await db.userStats.upsert({
      where: {
        userId_period_application: {
          userId,
          period,
          application,
        },
      },
      create: { userId, ...statsData },
      update: statsData,
    });
  } else {
    // Add incoming stats to existing stats.
    const newStats: Partial<UserStats> = {};
    StatKeys.forEach((key) => {
      newStats[key] = existingStats[key] + (stats[key] ?? 0);
    });

    await db.userStats.update({
      where: {
        userId_period_application: {
          userId,
          period,
          application,
        },
      },
      data: newStats,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Validate token and get user.
    const user = await DatabaseService.validateApiToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid API token" }, { status: 401 });
    }

    const body: UploadStatsRequest = await request.json();
    for (const chunk of body) {
      let message = chunk.message;
      let stats;
      let messageFragments;
      let messageCounts;
      let application: ApplicationType;

      if ("AI" in message && message.AI) {
        messageFragments = {
          userId: user.id,
          application: message.AI.application,
          type: "AI",
          timestamp: message.AI.timestamp,
          conversationFile: message.AI.conversationFile,
        };
        stats = {
          ...message.AI.generalStats,
          ...message.AI.fileOperations,
          ...message.AI.todoStats,
          ...message.AI.compositionStats,
        };
        messageCounts = {
          aiMessages: 1,
          userMessages: 0,
        };
      } else if ("User" in message && message.User) {
        messageFragments = {
          userId: user.id,
          application: message.User.application,
          type: "User",
          timestamp: message.User.timestamp,
          conversationFile: message.User.conversationFile,
        };
        stats = {
          ...message.User.todoStats,
        };
        messageCounts = {
          aiMessages: 0,
          userMessages: 1,
        };
      } else {
        return NextResponse.json(
          {
            error: "Invalid message format (expected 'AI' or 'User' root key)",
          },
          { status: 400 }
        );
      }

      // Update the user_stats table with the stats corresponding to the selected period.
      await updateCurrentPeriodStats(
        user.id,
        messageFragments.application,
        new Date(Date.now()),
        stats
      );
      // Update the message_stats with the new message, skipping it if it already exists.
      await db.messageStats.createMany({
        data: [
          {
            hash: chunk.hash,
            ...messageFragments,
            ...stats,
          },
        ],
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Upload stats error:", error);

    // Handle specific error types
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
