import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  StatKeys,
  type ConversationMessage,
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
    const body: ConversationMessage[] = await request.json();

    // Before asynchronously processing the data, validate the request.
    if (!body || !Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    } else if (
      !body.every(
        (message) =>
          message && typeof message === "object" && "stats" in message
      )
    ) {
      return NextResponse.json(
        { error: "Invalid message format" },
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
    //  * For each message, process the consolidated stats.
    //  * Loop through periods and update or insert as needed.
    //  * Add the message to the messages array for bulk upsertion later.
    for (const message of body) {
      const { stats, ...rest } = message;
      const isAssistantMessage = rest.role === "assistant";

      // Loop through periods.
      for (const period of Periods) {
        // Attempt to find a row that has this period and application.
        let stat = allStats.find(
          (stat) =>
            stat.period === period && stat.application === message.application
        );
        // If we've found it, then we're going to add the new stats to the old ones.
        if (stat) {
          // StatKeys is a list of all numeric statistic keys that should be added up.
          for (const key of StatKeys) {
            // assistantMessages and userMessages DO NOT come from the CLI.  They're populated right
            // here in the route.
            if (
              key !== "assistantMessages" &&
              key !== "userMessages" &&
              stat[key] &&
              stats[key]
            ) {
              stat[key] += stats[key];
            }
          }
          // If it's an assistant message, increment assistantMessages.
          if (isAssistantMessage && stat.assistantMessages) {
            stat.assistantMessages += 1;
          } else if (!isAssistantMessage && stat.userMessages) {
            stat.userMessages += 1;
          }
          stat.updatedAt = new Date();
        }
        // Otherwise, if we haven't found it, then we're going to create a new row.
        else {
          allStats.push({
            ...stats,
            ...rest,
            userId: user.id,
            period,
            periodStart: periodStarts[period],
            periodEnd: periodEnds[period],
            assistantMessages: isAssistantMessage ? 1 : 0,
            userMessages: isAssistantMessage ? 0 : 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      // Add the message to the messages array for bulk insertion (duplicates skipped) later.
      messages.push({
        ...stats,
        ...rest,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await db.$transaction(
      allStats.map((stat) =>
        db.userStats.upsert({
          where: {
            userId_period_application: {
              userId: stat.userId,
              period: stat.period,
              application: stat.application,
            },
          },
          update: stat,
          create: stat,
        })
      )
    );

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
