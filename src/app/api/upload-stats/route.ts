import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  StatKeys,
  type ConversationMessage,
  DbUserStats,
  Periods,
  DbMessageStats,
} from "@/types";
import { getPeriodStart, getPeriodEnd } from "@/lib/dateUtils";
import { unsupportedMethod } from "@/lib/routeUtils";

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

    const allStats = (await db.userStats.findMany({
      where: {
        userId: user.id,
      },
    })) as DbUserStats[];
    const messages: DbMessageStats[] = [];
    const messageDict: Record<string, ConversationMessage> = {};

    // Format all messages in a format that the DB will accept, and record each message in a dict
    // so that later, when we loop over insertedMessages, we can use the original message to get
    // the stats.
    for (const message of body) {
      const { stats, ...rest } = message;
      messages.push({
        ...rest,
        ...stats,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      messageDict[message.hash] = message;
    }

    // Insert the messages, skipping duplicates.
    const insertedMessages = await db.messageStats.createManyAndReturn({
      data: messages,
      skipDuplicates: true,
    });

    // Pre-aggregate the stats into rows based on combinations of user ID, application, and period.
    // The process is:
    //  * Loop through the inserted messages.  createManyAndReturn only returns the messages that
    //    were inserted, NOT the ones that were duplicate (skipped), which ensures that we're not
    //    adding stats to the pre-aggregated stats that were previously added.
    //  * Loop through periods and update or insert as needed.
    //  * Add the message to the messages array for bulk upsertion later.
    for (const message of insertedMessages) {
      const { stats, role, application } = messageDict[message.hash];
      const isAssistantMessage = role === "assistant";
      // Loop through periods.
      for (const period of Periods) {
        // Attempt to find a row with this period and application.
        const stat = allStats.find(
          (stat) => stat.period === period && stat.application === application
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
              stat[key] !== undefined &&
              stats[key] !== undefined
            ) {
              if (
                typeof stat[key] == "bigint" &&
                typeof stats[key] == "bigint"
              ) {
                (stat[key] as bigint) += stats[key];
              } else if (
                typeof stat[key] == "number" &&
                typeof stats[key] == "number"
              ) {
                (stat[key] as number) += stats[key];
              }
            }
          }
          // If it's an assistant message, increment assistantMessages.
          if (isAssistantMessage && stat.assistantMessages) {
            stat.assistantMessages += BigInt(1);
          } else if (!isAssistantMessage && stat.userMessages) {
            stat.userMessages += BigInt(1);
          }
          stat.updatedAt = new Date();
        }
        // Otherwise, if we haven't found it, then we're going to create a new row.
        else {
          allStats.push({
            ...stats,
            userId: user.id,
            application,
            period,
            periodStart: getPeriodStart(period),
            periodEnd: getPeriodEnd(period),
            assistantMessages: isAssistantMessage ? BigInt(1) : BigInt(0),
            userMessages: isAssistantMessage ? BigInt(0) : BigInt(1),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }

    // Now upsert the pre-aggregated stats.
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

export const GET = unsupportedMethod;
export const PUT = unsupportedMethod;
export const DELETE = unsupportedMethod;
