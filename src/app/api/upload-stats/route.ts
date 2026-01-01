import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { type ConversationMessage, Periods } from "@/types";
import {
  getPeriodEndForDate,
  getPeriodStartForDateInTimezone,
} from "@/lib/dateUtils";
import { unsupportedMethod } from "@/lib/routeUtils";
import { Prisma } from "@prisma/client";
import { nowMs, timingEnabled } from "@/lib/timing";

// BigInt fields that need conversion when storing messages.
// Note: This list must stay in sync with the _sum fields in the aggregation query below.
const BIG_INT_STAT_FIELDS = [
  "toolCalls",
  "inputTokens",
  "outputTokens",
  "cacheCreationTokens",
  "cacheReadTokens",
  "cachedTokens",
  "reasoningTokens",
  "filesRead",
  "filesAdded",
  "filesEdited",
  "filesDeleted",
  "linesRead",
  "linesAdded",
  "linesEdited",
  "linesDeleted",
  "bytesRead",
  "bytesAdded",
  "bytesEdited",
  "bytesDeleted",
  "codeLines",
  "docsLines",
  "dataLines",
  "mediaLines",
  "configLines",
  "otherLines",
  "terminalCommands",
  "fileSearches",
  "fileContentSearches",
  "todosCreated",
  "todosCompleted",
  "todosInProgress",
  "todoWrites",
  "todoReads",
] as const;

/**
 * Handles uploading conversation messages, upserting per-message stats, and recalculating per-period user aggregates.
 *
 * @param request - Incoming HTTP request. Must include an `Authorization: Bearer <token>` header; may include `x-timezone` to override stored user timezone; body must be a JSON array of `ConversationMessage` objects each containing a `stats` property.
 * @returns An object with `success: true` on successful processing, or an object with an `error` message when the request is invalid or processing fails.
 */
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

    // Get user's timezone (from header or stored preference)
    const headerTimezone = request.headers.get("x-timezone");
    const userPrefs = await db.userPreferences.findUnique({
      where: { userId: user.id },
    });
    const timezone = headerTimezone || userPrefs?.timezone || null;

    // Update stored timezone if header provided
    if (headerTimezone && headerTimezone !== userPrefs?.timezone) {
      await db.userPreferences.upsert({
        where: { userId: user.id },
        update: { timezone: headerTimezone },
        create: { userId: user.id, timezone: headerTimezone },
      });
    }

    const body: ConversationMessage[] = await request.json();

    const t0 = timingEnabled() ? nowMs() : 0;
    const marks: Record<string, number> = {};
    const mark = (name: string) => {
      if (!timingEnabled()) return;
      marks[name] = nowMs();
    };

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

    // Track affected period buckets for recalculation
    // Key format: ${period}|${application}|${periodStart.toISOString()}
    const affectedBuckets = new Set<string>();

    // Build all upsert inputs synchronously (no DB I/O yet)
    const messagesForDb: Prisma.MessageStatsUncheckedCreateInput[] = body.map(
      (message) => {
        const { stats, date, ...rest } = message;
        const messageDate = new Date(date);

        const dbMessage: Record<string, unknown> = {
          ...rest,
          date: messageDate,
          userId: user.id,
        };

        if (stats.cost !== undefined && stats.cost !== null) {
          dbMessage.cost = stats.cost;
        }

        for (const field of BIG_INT_STAT_FIELDS) {
          const value = stats[field as keyof typeof stats];
          if (value !== undefined && value !== null) {
            dbMessage[field] = BigInt(Math.round(Number(value)));
          }
        }

        for (const period of Periods) {
          const periodStart = getPeriodStartForDateInTimezone(
            period,
            messageDate,
            timezone
          );
          const key = `${period}|${message.application}|${periodStart.toISOString()}`;
          affectedBuckets.add(key);
        }

        return dbMessage as Prisma.MessageStatsUncheckedCreateInput;
      }
    );

    mark("prepared");

    // Upsert all messages in a single transaction to reduce per-message overhead.
    // This is still one statement per message, but it avoids thousands of separate
    // transactions/connection round trips.
    await db.$transaction(
      messagesForDb.map((data) =>
        db.messageStats.upsert({
          where: { globalHash: data.globalHash },
          create: data,
          update: data,
        })
      )
    );

    mark("upserted");

    // Recalculate stats for each affected bucket by summing all messages
    const now = new Date();
    
    for (const bucketKey of affectedBuckets) {
      // Parse bucket key safely - application name could theoretically contain "|"
      // Key format: ${period}|${application}|${periodStart.toISOString()}
      // Period is always first, ISO date is always last, application is in between
      const firstPipe = bucketKey.indexOf("|");
      const lastPipe = bucketKey.lastIndexOf("|");
      const period = bucketKey.slice(0, firstPipe);
      const application = bucketKey.slice(firstPipe + 1, lastPipe);
      const periodStart = new Date(bucketKey.slice(lastPipe + 1));
      const periodEnd = getPeriodEndForDate(period as typeof Periods[number], periodStart);

      // Aggregate all messages in this bucket
      const aggregation = await db.messageStats.aggregate({
        where: {
          userId: user.id,
          application,
          date: {
            gte: periodStart,
            lt: periodEnd,
          },
        },
        _sum: {
          inputTokens: true,
          outputTokens: true,
          cacheCreationTokens: true,
          cacheReadTokens: true,
          cachedTokens: true,
          reasoningTokens: true,
          cost: true,
          toolCalls: true,
          filesRead: true,
          filesAdded: true,
          filesEdited: true,
          filesDeleted: true,
          linesRead: true,
          linesAdded: true,
          linesEdited: true,
          linesDeleted: true,
          bytesRead: true,
          bytesAdded: true,
          bytesEdited: true,
          bytesDeleted: true,
          codeLines: true,
          docsLines: true,
          dataLines: true,
          mediaLines: true,
          configLines: true,
          otherLines: true,
          terminalCommands: true,
          fileSearches: true,
          fileContentSearches: true,
          todosCreated: true,
          todosCompleted: true,
          todosInProgress: true,
          todoWrites: true,
          todoReads: true,
        },
      });

      // Count messages by role
      const messageCounts = await db.messageStats.groupBy({
        by: ["role"],
        where: {
          userId: user.id,
          application,
          date: {
            gte: periodStart,
            lt: periodEnd,
          },
        },
        _count: true,
      });

      const assistantCount = messageCounts.find(m => m.role === "assistant")?._count ?? 0;
      const userCount = messageCounts.find(m => m.role === "user")?._count ?? 0;

      // Build the stats record from aggregation
      const statsData: Prisma.UserStatsUncheckedCreateInput = {
        userId: user.id,
        application,
        period,
        periodStart,
        periodEnd,
        assistantMessages: BigInt(assistantCount),
        userMessages: BigInt(userCount),
        inputTokens: aggregation._sum.inputTokens ?? BigInt(0),
        outputTokens: aggregation._sum.outputTokens ?? BigInt(0),
        cacheCreationTokens: aggregation._sum.cacheCreationTokens ?? BigInt(0),
        cacheReadTokens: aggregation._sum.cacheReadTokens ?? BigInt(0),
        cachedTokens: aggregation._sum.cachedTokens ?? BigInt(0),
        reasoningTokens: aggregation._sum.reasoningTokens ?? BigInt(0),
        cost: aggregation._sum.cost ?? 0,
        toolCalls: aggregation._sum.toolCalls ?? BigInt(0),
        filesRead: aggregation._sum.filesRead ?? BigInt(0),
        filesAdded: aggregation._sum.filesAdded ?? BigInt(0),
        filesEdited: aggregation._sum.filesEdited ?? BigInt(0),
        filesDeleted: aggregation._sum.filesDeleted ?? BigInt(0),
        linesRead: aggregation._sum.linesRead ?? BigInt(0),
        linesAdded: aggregation._sum.linesAdded ?? BigInt(0),
        linesEdited: aggregation._sum.linesEdited ?? BigInt(0),
        linesDeleted: aggregation._sum.linesDeleted ?? BigInt(0),
        bytesRead: aggregation._sum.bytesRead ?? BigInt(0),
        bytesAdded: aggregation._sum.bytesAdded ?? BigInt(0),
        bytesEdited: aggregation._sum.bytesEdited ?? BigInt(0),
        bytesDeleted: aggregation._sum.bytesDeleted ?? BigInt(0),
        codeLines: aggregation._sum.codeLines ?? BigInt(0),
        docsLines: aggregation._sum.docsLines ?? BigInt(0),
        dataLines: aggregation._sum.dataLines ?? BigInt(0),
        mediaLines: aggregation._sum.mediaLines ?? BigInt(0),
        configLines: aggregation._sum.configLines ?? BigInt(0),
        otherLines: aggregation._sum.otherLines ?? BigInt(0),
        terminalCommands: aggregation._sum.terminalCommands ?? BigInt(0),
        fileSearches: aggregation._sum.fileSearches ?? BigInt(0),
        fileContentSearches: aggregation._sum.fileContentSearches ?? BigInt(0),
        todosCreated: aggregation._sum.todosCreated ?? BigInt(0),
        todosCompleted: aggregation._sum.todosCompleted ?? BigInt(0),
        todosInProgress: aggregation._sum.todosInProgress ?? BigInt(0),
        todoWrites: aggregation._sum.todoWrites ?? BigInt(0),
        todoReads: aggregation._sum.todoReads ?? BigInt(0),
        createdAt: now,
        updatedAt: now,
      };

      // Upsert the stats record (replace with recalculated values)
      await db.userStats.upsert({
        where: {
          userId_period_application_periodStart: {
            userId: user.id,
            period,
            application,
            periodStart,
          },
        },
        create: statsData,
        update: {
          ...statsData,
          // Preserve original createdAt on update (undefined is omitted by Prisma 5.x)
          // Note: Upgrade to Prisma.skip when migrating to Prisma 6+
          createdAt: undefined,
        },
      });
    }

    mark("recalculated");

    if (timingEnabled()) {
      const t1 = nowMs();
      const totalMs = Math.round(t1 - t0);
      const preparedMs = marks.prepared ? Math.round(marks.prepared - t0) : null;
      const upsertedMs = marks.upserted
        ? Math.round(marks.upserted - (marks.prepared ?? t0))
        : null;
      const recalculatedMs = marks.recalculated
        ? Math.round(t1 - (marks.upserted ?? t0))
        : null;

      console.info("upload-stats timings", {
        messages: body.length,
        affectedBuckets: affectedBuckets.size,
        preparedMs,
        upsertedMs,
        recalculatedMs,
        totalMs,
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

export const GET = unsupportedMethod;
export const PUT = unsupportedMethod;
export const DELETE = unsupportedMethod;
