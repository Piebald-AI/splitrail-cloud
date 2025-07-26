import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  StatKeys,
  UserStats,
  type UploadStatsRequest,
  type ApplicationType,
  PeriodType,
  DbUserStats,
  Periods,
  TodoStatKeys,
  DbMessageStats,
} from "@/types";
import {
  getHourStart,
  getHourEnd,
  getDayStart,
  getDayEnd,
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
  getYearStart,
  getYearEnd,
} from "@/lib/dateUtils";
import { MessageStats } from "@prisma/client";

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

    const apiToken = await db.apiToken.findUnique({
      where: { token: authHeader.substring(7) },
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
    const body: UploadStatsRequest = await request.json();

    // Before asynchronously processing the data, validate the request.
    if (!body || !Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    } else if (
      !body.every((chunk) => "AI" in chunk.message || "User" in chunk.message)
    ) {
      return NextResponse.json(
        { error: "Invalid message format (expected 'AI' or 'User' root key)" },
        { status: 400 }
      );
    }

    const periodStarts = {
      hourly: getHourStart(new Date()),
      daily: getDayStart(new Date()),
      weekly: getWeekStart(new Date()),
      monthly: getMonthStart(new Date()),
      yearly: getYearStart(new Date()),
      "all-time": undefined,
    };
    const periodEnds = {
      hourly: getHourEnd(new Date()),
      daily: getDayEnd(new Date()),
      weekly: getWeekEnd(new Date()),
      monthly: getMonthEnd(new Date()),
      yearly: getYearEnd(new Date()),
      "all-time": undefined,
    };

    let allStats = (await db.userStats.findMany({
      where: {
        userId: user.id,
      },
    })) as DbUserStats[];
    let messages: DbMessageStats[] = [];

    // So the process is:
    //  * Loop through the messages.  Currently, the maximum is 6,000 per request.
    //  * For each message, check if it's an AI or User message.
    //  * Loop through periods and update or insert as needed.
    //  * Add the message to the messages array for bulk upsertion later.
    for (const message of body) {
      if ("AI" in message.message && message.message.AI) {
        const {
          generalStats,
          fileOperations,
          todoStats,
          compositionStats,
          ...rest
        } = message.message.AI;
        const stats = {
          ...generalStats,
          ...fileOperations,
          ...todoStats,
          ...compositionStats,
        };
        for (const period of Periods) {
          let stat = allStats.find(
            (stat) =>
              stat.period === period && stat.application === rest.application
          );
          if (stat) {
            for (const key of StatKeys) {
              // aiMessages and userMessages DO NOT come from the CLI.  They're populated right
              // here in the route.
              if (key !== "aiMessages" && key !== "userMessages" && stat[key]) {
                stat[key] += stats[key];
              }
            }
            if (stat.aiMessages) {
              stat.aiMessages += 1;
            }
            stat.updatedAt = new Date();
          } else {
            allStats.push({
              ...stats,
              userId: user.id,
              period,
              application: rest.application,
              periodStart: periodStarts[period],
              periodEnd: periodEnds[period],
              aiMessages: 1,
              userMessages: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
          messages.push({
            ...stats,
            ...rest,
            userId: user.id,
            type: "AI",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } else if ("User" in message.message && message.message.User) {
        const { todoStats, ...rest } = message.message.User;
        const stats = {
          ...todoStats,
        };
        for (const period of Periods) {
          let stat = allStats.find(
            (stat) =>
              stat.period === period && stat.application === rest.application
          );
          if (stat) {
            for (const key of TodoStatKeys) {
              if (stat[key]) stat[key] += stats[key];
            }
            if (stat.userMessages) stat.userMessages += 1;
            stat.updatedAt = new Date();
          } else {
            allStats.push({
              ...stats,
              userId: user.id,
              period,
              application: rest.application,
              periodStart: periodStarts[period],
              periodEnd: periodEnds[period],
              aiMessages: 0,
              userMessages: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
          messages.push({
            ...stats,
            ...rest,
            userId: user.id,
            type: "User",
            model: "",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } else {
        continue;
      }
    }

    const stat = allStats[0];

    // Clean the stat object - remove NaN values and replace with appropriate defaults
    const cleanedStat = {
      ...stat,
      todosCreated: isNaN(stat.todosCreated ?? 0) ? 0 : stat.todosCreated,
      todosCompleted: isNaN(stat.todosCompleted ?? 0) ? 0 : stat.todosCompleted,
      todosInProgress: isNaN(stat.todosInProgress ?? 0) ? 0 : stat.todosInProgress,
      todoWrites: isNaN(stat.todoWrites ?? 0) ? 0 : stat.todoWrites,
      todoReads: isNaN(stat.todoReads ?? 0) ? 0 : stat.todoReads,
    };

    await db.userStats.upsert({
      where: {
        userId_period_application: {
          userId: cleanedStat.userId,
          period: cleanedStat.period,
          application: cleanedStat.application ?? "",
        },
      },
      update: cleanedStat,
      create: cleanedStat,
    });

    // Update the message_stats with the new messages, skipping it if it already exists.
    await db.messageStats.createMany({
      data: messages,
      skipDuplicates: true,
    });

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
