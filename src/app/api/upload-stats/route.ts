import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { type ConversationMessage, Periods } from "@/types";
import { getPeriodStartForDateInTimezone } from "@/lib/dateUtils";
import { unsupportedMethod } from "@/lib/routeUtils";
import { Prisma } from "@prisma/client";
import { nowMs, timingEnabled } from "@/lib/timing";
import {
  bulkUpsertMessageStatsSql,
  type MessageStatsUpsertRow,
} from "@/lib/message-stats-bulk-upsert";
import {
  type AffectedPeriods,
  addUniqueDate,
  recalculateUserStats,
} from "@/lib/stats-recalculation";

// Allow up to 5 minutes for large uploads with many affected period buckets.
export const maxDuration = 300;

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

    const startMs = timingEnabled() ? nowMs() : 0;
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
          message &&
          typeof message === "object" &&
          "stats" in message &&
          typeof (message as ConversationMessage).globalHash === "string" &&
          (message as ConversationMessage).globalHash.trim().length > 0
      )
    ) {
      return NextResponse.json(
        { error: "Invalid message format" },
        { status: 400 }
      );
    }

    // Deduplicate messages by globalHash within a single request.
    // Bulk upsert uses `ON CONFLICT DO UPDATE`, which errors if the same key appears
    // more than once in one INSERT statement.
    const dedupedBody: ConversationMessage[] = (() => {
      const byHash = new Map<string, ConversationMessage>();
      for (const message of body) {
        byHash.set(message.globalHash, message);
      }
      return Array.from(byHash.values());
    })();

    if (dedupedBody.length !== body.length) {
      console.warn("upload-stats: deduplicated messages", {
        received: body.length,
        uniqueGlobalHash: dedupedBody.length,
        duplicatesDropped: body.length - dedupedBody.length,
      });
    }

    // Build all upsert inputs synchronously (no DB I/O yet)
    const messagesForDb: MessageStatsUpsertRow[] = dedupedBody.map(
      (message) => {
        const { stats, date, ...rest } = message;
        const messageDate = new Date(date);

        return {
          globalHash: message.globalHash,
          userId: user.id,
          application: message.application,
          role: message.role,
          date: messageDate,
          projectHash: message.projectHash,
          conversationHash: message.conversationHash,
          localHash: message.localHash ?? null,
          uuid: message.uuid ?? null,
          sessionName: message.sessionName ?? null,

          inputTokens: BigInt(Math.round(Number(stats.inputTokens ?? 0))),
          outputTokens: BigInt(Math.round(Number(stats.outputTokens ?? 0))),
          cacheCreationTokens: BigInt(
            Math.round(Number(stats.cacheCreationTokens ?? 0))
          ),
          cacheReadTokens: BigInt(
            Math.round(Number(stats.cacheReadTokens ?? 0))
          ),
          cachedTokens: BigInt(Math.round(Number(stats.cachedTokens ?? 0))),
          reasoningTokens: BigInt(
            Math.round(Number(stats.reasoningTokens ?? 0))
          ),
          toolCalls: BigInt(Math.round(Number(stats.toolCalls ?? 0))),

          terminalCommands: BigInt(
            Math.round(Number(stats.terminalCommands ?? 0))
          ),
          fileSearches: BigInt(Math.round(Number(stats.fileSearches ?? 0))),
          fileContentSearches: BigInt(
            Math.round(Number(stats.fileContentSearches ?? 0))
          ),

          filesRead: BigInt(Math.round(Number(stats.filesRead ?? 0))),
          filesAdded: BigInt(Math.round(Number(stats.filesAdded ?? 0))),
          filesEdited: BigInt(Math.round(Number(stats.filesEdited ?? 0))),
          filesDeleted: BigInt(Math.round(Number(stats.filesDeleted ?? 0))),

          linesRead: BigInt(Math.round(Number(stats.linesRead ?? 0))),
          linesAdded: BigInt(Math.round(Number(stats.linesAdded ?? 0))),
          linesEdited: BigInt(Math.round(Number(stats.linesEdited ?? 0))),
          linesDeleted: BigInt(Math.round(Number(stats.linesDeleted ?? 0))),

          bytesRead: BigInt(Math.round(Number(stats.bytesRead ?? 0))),
          bytesAdded: BigInt(Math.round(Number(stats.bytesAdded ?? 0))),
          bytesEdited: BigInt(Math.round(Number(stats.bytesEdited ?? 0))),
          bytesDeleted: BigInt(Math.round(Number(stats.bytesDeleted ?? 0))),

          codeLines: BigInt(Math.round(Number(stats.codeLines ?? 0))),
          docsLines: BigInt(Math.round(Number(stats.docsLines ?? 0))),
          dataLines: BigInt(Math.round(Number(stats.dataLines ?? 0))),
          mediaLines: BigInt(Math.round(Number(stats.mediaLines ?? 0))),
          configLines: BigInt(Math.round(Number(stats.configLines ?? 0))),
          otherLines: BigInt(Math.round(Number(stats.otherLines ?? 0))),

          todosCreated: BigInt(Math.round(Number(stats.todosCreated ?? 0))),
          todosCompleted: BigInt(Math.round(Number(stats.todosCompleted ?? 0))),
          todosInProgress: BigInt(
            Math.round(Number(stats.todosInProgress ?? 0))
          ),
          todoWrites: BigInt(Math.round(Number(stats.todoWrites ?? 0))),
          todoReads: BigInt(Math.round(Number(stats.todoReads ?? 0))),

          cost: stats.cost ?? null,
          model: message.model ?? null,
          fileTypes:
            ("fileTypes" in rest
              ? (rest.fileTypes as Prisma.InputJsonValue)
              : null) ?? null,
        };
      }
    );

    mark("prepared");

    // Check how many of these messages already exist in the database.
    // This lets us detect users repeatedly uploading the same data.
    const incomingHashes = messagesForDb.map((m) => m.globalHash as string);
    const existingMessages = await db.messageStats.findMany({
      where: { globalHash: { in: incomingHashes } },
      select: { globalHash: true },
    });
    const duplicateCount = existingMessages.length;
    const existingHashSet = new Set(
      existingMessages.map((message) => message.globalHash)
    );
    const newMessagesForDb = messagesForDb.filter(
      (message) => !existingHashSet.has(message.globalHash as string)
    );

    // Compute affected period buckets for recalculation based only on genuinely
    // new messages.  We build an AffectedPeriods structure (unique periodStart
    // dates per period type) plus a set of affected applications so that the
    // efficient single-SQL-per-period recalculation function can be used.
    const affectedPeriods: AffectedPeriods = {
      hourly: [],
      daily: [],
      weekly: [],
      monthly: [],
      yearly: [],
    };
    const affectedApplications = new Set<string>();
    for (const message of newMessagesForDb) {
      affectedApplications.add(message.application as string);
      for (const period of Periods) {
        const periodStart = getPeriodStartForDateInTimezone(
          period,
          message.date as Date,
          timezone
        );
        addUniqueDate(affectedPeriods[period], periodStart);
      }
    }
    const affectedBucketCount =
      affectedPeriods.hourly.length +
      affectedPeriods.daily.length +
      affectedPeriods.weekly.length +
      affectedPeriods.monthly.length +
      affectedPeriods.yearly.length;

    if (duplicateCount > 0) {
      console.warn("upload-stats: duplicate messages detected", {
        userId: user.id,
        userName: user.displayName ?? user.username ?? user.email ?? "unknown",
        totalInRequest: messagesForDb.length,
        duplicates: duplicateCount,
        newMessages: messagesForDb.length - duplicateCount,
        duplicatePercent: Math.round(
          (duplicateCount / messagesForDb.length) * 100
        ),
      });
    }

    mark("duplicateCheck");

    const newMessageCount = newMessagesForDb.length;

    // If this upload is entirely duplicates, there is nothing to upsert or recalculate.
    // Returning early avoids re-running expensive bucket aggregations for no-op uploads.
    if (newMessageCount === 0) {
      if (timingEnabled()) {
        const endMs = nowMs();
        const totalMs = Math.round(endMs - startMs);
        const preparedMs = marks.prepared
          ? Math.round(marks.prepared - startMs)
          : null;
        const duplicateCheckMs = marks.duplicateCheck
          ? Math.round(marks.duplicateCheck - (marks.prepared ?? startMs))
          : null;

        console.info("upload-stats timings", {
          messages: dedupedBody.length,
          duplicates: duplicateCount,
          affectedBuckets: 0,
          preparedMs,
          duplicateCheckMs,
          upsertedMs: 0,
          recalculatedMs: 0,
          totalMs,
          skippedReason: "all-duplicates",
        });
      }

      return NextResponse.json({
        success: true,
      });
    }

    // Perform bulk upsert and recalculation in a single atomic transaction to ensure
    // that affectedPeriods matches the exact rows being committed.
    // We chunk the upsert to avoid oversized SQL while keeping everything in one transaction.
    await db.$transaction(async (tx) => {
      const BULK_UPSERT_BATCH_SIZE = 500;
      for (let i = 0; i < newMessagesForDb.length; i += BULK_UPSERT_BATCH_SIZE) {
        const batch = newMessagesForDb.slice(i, i + BULK_UPSERT_BATCH_SIZE);
        await tx.$executeRaw(bulkUpsertMessageStatsSql(batch));
      }

      mark("upserted");

      // Recalculate aggregate stats for every affected period bucket using a
      // single efficient SQL statement per period type (5 total) instead of the
      // old approach of 4 separate queries × N buckets.  This reduces thousands
      // of sequential DB round-trips to at most 5, eliminating the timeout.
      await recalculateUserStats(
        user.id,
        Array.from(affectedApplications),
        affectedPeriods,
        tx, // use transaction client
        timezone
      );
    });

    // Emit timing breakdown once per request
    mark("recalculated");

    if (timingEnabled()) {
      const endMs = nowMs();
      const totalMs = Math.round(endMs - startMs);
      const preparedMs = marks.prepared
        ? Math.round(marks.prepared - startMs)
        : null;
      const duplicateCheckMs = marks.duplicateCheck
        ? Math.round(marks.duplicateCheck - (marks.prepared ?? startMs))
        : null;
      const upsertedMs = marks.upserted
        ? Math.round(marks.upserted - (marks.duplicateCheck ?? marks.prepared ?? startMs))
        : null;
      const recalculatedMs = marks.recalculated
        ? Math.round(endMs - (marks.upserted ?? startMs))
        : null;

      console.info("upload-stats timings", {
        messages: dedupedBody.length,
        duplicates: duplicateCount,
        affectedBuckets: affectedBucketCount,
        preparedMs,
        duplicateCheckMs,
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