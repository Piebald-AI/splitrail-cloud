import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { type ConversationMessage } from "@/types";
import { unsupportedMethod } from "@/lib/routeUtils";
import { Prisma } from "@prisma/client";
import { nowMs, timingEnabled } from "@/lib/timing";
import {
  bulkUpsertMessageStatsSql,
  type MessageStatsUpsertRow,
} from "@/lib/message-stats-bulk-upsert";

// Allow up to 5 minutes for large source-message uploads.
export const maxDuration = 300;

/**
 * Saves source message statistics. PostgreSQL refreshes derived summaries separately.
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
    if (headerTimezone) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: headerTimezone });
      } catch {
        return NextResponse.json(
          { error: "Invalid timezone" },
          { status: 400 }
        );
      }
    }

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

    // Duplicate-only uploads do not change source data or require a refresh.
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

    // Save source messages atomically. Database triggers mark summaries dirty.
    // Chunking avoids oversized SQL without aggregating historical messages.
    await db.$transaction(
      async (tx) => {
        const BULK_UPSERT_BATCH_SIZE = 500;
        for (
          let i = 0;
          i < newMessagesForDb.length;
          i += BULK_UPSERT_BATCH_SIZE
        ) {
          const batch = newMessagesForDb.slice(i, i + BULK_UPSERT_BATCH_SIZE);
          await tx.$executeRaw(bulkUpsertMessageStatsSql(batch));
        }

        mark("upserted");

        // A database trigger marks summaries dirty. The scheduled refresh
        // derives them from committed source data, outside this upload.
      },
      {
        // Allow up to 2 minutes for a large source-message batch.
        timeout: 120_000,
      }
    );

    // Emit timing breakdown once per request.

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
        ? Math.round(
            marks.upserted - (marks.duplicateCheck ?? marks.prepared ?? startMs)
          )
        : null;

      console.info("upload-stats timings", {
        messages: dedupedBody.length,
        duplicates: duplicateCount,
        preparedMs,
        duplicateCheckMs,
        upsertedMs,
        totalMs,
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "Upload saved. Your stats will appear after the next refresh, usually within 15 minutes.",
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
