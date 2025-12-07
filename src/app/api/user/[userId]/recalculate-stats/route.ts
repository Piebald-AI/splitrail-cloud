import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DbStatKeys, Periods } from "@/types";
import {
  getPeriodStartForDateInTimezone,
  getPeriodEndForDate,
} from "@/lib/dateUtils";
import { Prisma } from "@prisma/client";

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

    // Delete all existing UserStats for this user
    await db.userStats.deleteMany({
      where: { userId },
    });

    // Re-fetch all messages
    const messages = await db.messageStats.findMany({
      where: { userId },
    });

    if (messages.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No messages to recalculate",
      });
    }

    // Aggregate logic similar to upload-stats/route.ts
    const statAccumulators = new Map<string, Record<string, number>>();
    const messageCounters = new Map<
      string,
      { assistant: number; user: number }
    >();
    const periodBoundaries = new Map<
      string,
      { periodStart: Date; periodEnd: Date }
    >();

    // Process all messages to accumulate stats
    for (const message of messages) {
      const isAssistantMessage = message.role === "assistant";
      const messageDate = new Date(message.date);
      const application = message.application;

      // Process each period
      for (const period of Periods) {
        const periodStart = getPeriodStartForDateInTimezone(
          period,
          messageDate,
          timezone
        );
        const periodEnd = getPeriodEndForDate(period, messageDate);
        const key = `${period}|${application}|${periodStart.toISOString()}`;

        // Initialize accumulator if needed
        if (!statAccumulators.has(key)) {
          statAccumulators.set(key, {});
          messageCounters.set(key, { assistant: 0, user: 0 });
          periodBoundaries.set(key, { periodStart, periodEnd });
        }

        const accumulator = statAccumulators.get(key)!;
        const counter = messageCounters.get(key)!;

        // Accumulate stats from the message
        for (const statKey of DbStatKeys) {
          if (statKey === "assistantMessages" || statKey === "userMessages") {
            continue;
          }

          const value = message[statKey as keyof typeof message];
          if (value !== undefined && value !== null) {
            accumulator[statKey] = (accumulator[statKey] || 0) + Number(value);
          }
        }

        // Count messages
        if (isAssistantMessage) {
          counter.assistant++;
        } else {
          counter.user++;
        }
      }
    }

    // Build and insert UserStats records
    const statsToCreate: Prisma.UserStatsUncheckedCreateInput[] = [];
    const now = new Date();

    for (const [key, accumulator] of statAccumulators) {
      const parts = key.split("|");
      const period = parts[0];
      const application = parts[1];
      const boundaries = periodBoundaries.get(key)!;
      const { periodStart, periodEnd } = boundaries;
      const counter = messageCounters.get(key)!;

      const newStat: Prisma.UserStatsUncheckedCreateInput = {
        userId,
        application,
        period,
        periodStart,
        periodEnd,
        assistantMessages: BigInt(counter.assistant),
        userMessages: BigInt(counter.user),
        createdAt: now,
        updatedAt: now,
      };

      // Add accumulated stats with proper types
      for (const statKey of DbStatKeys) {
        if (statKey === "assistantMessages" || statKey === "userMessages") {
          continue;
        }
        if (accumulator[statKey] !== undefined) {
          const value = accumulator[statKey];
          if (statKey === "cost") {
            newStat.cost = Number(value);
          } else {
            const bigIntKey = statKey as Exclude<
              typeof statKey,
              "cost" | "assistantMessages" | "userMessages"
            >;
            newStat[bigIntKey] = BigInt(value);
          }
        }
      }

      statsToCreate.push(newStat);
    }

    // Insert all stats in batches
    const BATCH_SIZE = 100;
    for (let i = 0; i < statsToCreate.length; i += BATCH_SIZE) {
      const batch = statsToCreate.slice(i, i + BATCH_SIZE);
      await db.userStats.createMany({
        data: batch,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Recalculated stats from ${messages.length} messages into ${statsToCreate.length} aggregated records`,
    });
  } catch (error) {
    console.error("Recalculate stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
