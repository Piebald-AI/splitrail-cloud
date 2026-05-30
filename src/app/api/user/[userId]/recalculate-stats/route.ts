import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { addUniqueDate, recalculateUserStats } from "@/lib/stats-recalculation";
import { getPeriodStartForDateInTimezone } from "@/lib/dateUtils";
import { Periods } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const { userId } = await params;

    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's timezone
    const userPrefs = await db.userPreferences.findUnique({
      where: { userId },
    });
    const timezone = userPrefs?.timezone || null;

    const messageSummary = await db.messageStats.aggregate({
      where: { userId },
      _count: { _all: true },
    });

    if (messageSummary._count._all === 0) {
      await db.userStats.deleteMany({
        where: { userId },
      });

      return NextResponse.json({
        success: true,
        message: "No messages to recalculate",
      });
    }

    const buckets = await db.messageStats.findMany({
      where: { userId },
      select: {
        application: true,
        date: true,
      },
      distinct: ["application", "date"],
    });

    const affectedPeriods = {
      hourly: [] as Date[],
      daily: [] as Date[],
      weekly: [] as Date[],
      monthly: [] as Date[],
      yearly: [] as Date[],
    };
    const applications = new Set<string>();

    for (const bucket of buckets) {
      applications.add(bucket.application);
      for (const period of Periods) {
        const periodStart = getPeriodStartForDateInTimezone(
          period,
          bucket.date,
          timezone
        );
        addUniqueDate(affectedPeriods[period], periodStart);
      }
    }

    await db.$transaction(
      async (tx) => {
        await tx.userStats.deleteMany({
          where: { userId },
        });

        await recalculateUserStats(
          userId,
          Array.from(applications),
          affectedPeriods,
          tx,
          timezone
        );
      },
      { timeout: 120_000 }
    );

    const aggregateRecordCount = Object.values(affectedPeriods).reduce(
      (sum, periodStarts) => sum + periodStarts.length * applications.size,
      0
    );

    return NextResponse.json({
      success: true,
      message: `Recalculated stats from ${messageSummary._count._all} messages across ${aggregateRecordCount} aggregate buckets`,
    });
  } catch (error) {
    console.error("Recalculate stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
