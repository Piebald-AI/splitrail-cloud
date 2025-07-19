import { NextRequest, NextResponse } from "next/server";
import { DatabaseService, db } from "@/lib/db";
import {
  AIMessage,
  UserMessage,
  UserStats,
  type UploadStatsRequest,
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
  eventDate: Date,
  stats: UserStats
) {
  // Update all period stats in parallel
  await Promise.all([
    updatePeriodStats(
      userId,
      "hourly",
      getHourStart(eventDate),
      getHourEnd(eventDate),
      stats
    ),
    updatePeriodStats(
      userId,
      "daily",
      getDayStart(eventDate),
      getDayEnd(eventDate),
      stats
    ),
    updatePeriodStats(
      userId,
      "weekly",
      getWeekStart(eventDate),
      getWeekEnd(eventDate),
      stats
    ),
    updatePeriodStats(
      userId,
      "monthly",
      getMonthStart(eventDate),
      getMonthEnd(eventDate),
      stats
    ),
    updatePeriodStats(
      userId,
      "yearly",
      getYearStart(eventDate),
      getYearEnd(eventDate),
      stats
    ),
    updatePeriodStats(userId, "all-time", null, null, stats),
  ]);
}

async function updatePeriodStats(
  userId: string,
  period: string,
  periodStart: Date | null,
  periodEnd: Date | null,
  stats: UserStats
) {
  const existingStats = await db.userStats.findUnique({
    where: {
      userId_period: {
        userId,
        period,
      },
    },
  });

  const statsData = {
    period,
    periodStart,
    periodEnd,
    toolsCalled: stats.toolsCalled,
    messagesSent: stats.messagesSent,
    inputTokens: stats.inputTokens,
    outputTokens: stats.outputTokens,
    cacheCreationTokens: stats.cacheCreationTokens,
    cacheReadTokens: stats.cacheReadTokens,
    cost: stats.cost,
    filesRead: stats.filesRead,
    filesAdded: stats.filesAdded,
    filesEdited: stats.filesEdited,
    filesDeleted: stats.filesDeleted,
    linesRead: stats.linesRead,
    linesAdded: stats.linesAdded,
    linesEdited: stats.linesEdited,
    linesDeleted: stats.linesDeleted,
    bytesRead: stats.bytesRead,
    bytesAdded: stats.bytesAdded,
    bytesEdited: stats.bytesEdited,
    bytesDeleted: stats.bytesDeleted,
    terminalCommands: stats.terminalCommands,
    globSearches: stats.globSearches,
    grepSearches: stats.grepSearches,
    todosCreated: stats.todosCreated,
    todosCompleted: stats.todosCompleted,
    todosInProgress: stats.todosInProgress,
    todoWrites: stats.todoWrites,
    todoReads: stats.todoReads,
    codeLines: stats.codeLines,
    docsLines: stats.docsLines,
    dataLines: stats.dataLines,
  };

  // If there are existing stats, and the existing period start is not equal to the new period
  // start (i.e. a new period has begun).
  if (
    !existingStats ||
    (periodStart &&
      existingStats.periodStart &&
      existingStats.periodStart.getTime() !== periodStart.getTime())
  ) {
    console.log(
      `New period (${period}) - replacing existing stats with $${stats.cost}`
    );
    // New period - replace existing stats
    await db.userStats.upsert({
      where: {
        userId_period: {
          userId,
          period,
        },
      },
      create: { userId, ...statsData },
      update: statsData,
    });
  } else {
    console.log(
      `Same period (${period}) - adding to existing stats $${existingStats.cost} with $${stats.cost} (${existingStats.cost + stats.cost})`
    );
    // Same period - add to existing stats
    await db.userStats.update({
      where: {
        userId_period: {
          userId,
          period,
        },
      },
      data: {
        toolsCalled: existingStats.toolsCalled + stats.toolsCalled,
        messagesSent: existingStats.messagesSent + stats.messagesSent,
        inputTokens: existingStats.inputTokens + stats.inputTokens,
        outputTokens: existingStats.outputTokens + stats.outputTokens,
        cacheCreationTokens:
          existingStats.cacheCreationTokens + stats.cacheCreationTokens,
        cacheReadTokens: existingStats.cacheReadTokens + stats.cacheReadTokens,
        cost: existingStats.cost + stats.cost,
        filesRead: existingStats.filesRead + stats.filesRead,
        filesAdded: existingStats.filesAdded + stats.filesAdded,
        filesEdited: existingStats.filesEdited + stats.filesEdited,
        filesDeleted: existingStats.filesDeleted + stats.filesDeleted,
        linesRead: existingStats.linesRead + stats.linesRead,
        linesAdded: existingStats.linesAdded + stats.linesAdded,
        linesEdited: existingStats.linesEdited + stats.linesEdited,
        linesDeleted: existingStats.linesDeleted + stats.linesDeleted,
        codeLines: existingStats.codeLines + stats.codeLines,
        docsLines: existingStats.docsLines + stats.docsLines,
        dataLines: existingStats.dataLines + stats.dataLines,
        mediaLines: existingStats.mediaLines + stats.mediaLines,
        configLines: existingStats.configLines + stats.configLines,
        otherLines: existingStats.otherLines + stats.otherLines,
        bytesRead: existingStats.bytesRead + stats.bytesRead,
        bytesAdded: existingStats.bytesAdded + stats.bytesAdded,
        bytesEdited: existingStats.bytesEdited + stats.bytesEdited,
        bytesDeleted: existingStats.bytesDeleted + stats.bytesDeleted,
        terminalCommands:
          existingStats.terminalCommands + stats.terminalCommands,
        fileSearches: existingStats.fileSearches + stats.fileSearches,
        fileContentSearches: existingStats.fileContentSearches + stats.fileContentSearches,
        todosCreated: existingStats.todosCreated + stats.todosCreated,
        todosCompleted: existingStats.todosCompleted + stats.todosCompleted,
        todosInProgress: existingStats.todosInProgress + stats.todosInProgress,
        todoWrites: existingStats.todoWrites + stats.todoWrites,
        todoReads: existingStats.todoReads + stats.todoReads,
      },
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
      const eventDate = new Date(chunk.message.timestamp || Date.now());
      const dateOnly = new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate()
      );

      if ("AI" in message && message.AI) {
        const { fileOperations, todoStats, ...aiMessage } =
          message.AI as AIMessage;

        // Update current period stats
        await updateCurrentPeriodStats(user.id, eventDate, {
          toolsCalled: aiMessage.toolCalls || 0,
          messagesSent: 1,
          inputTokens: aiMessage.inputTokens || 0,
          outputTokens: aiMessage.outputTokens || 0,
          cacheCreationTokens: aiMessage.cacheCreationTokens || 0,
          cacheReadTokens: aiMessage.cacheReadTokens || 0,
          cost: aiMessage.cost || 0,
          filesRead: fileOperations?.filesRead || 0,
          filesAdded: fileOperations?.filesAdded || 0,
          filesEdited: fileOperations?.filesEdited || 0,
          filesDeleted: fileOperations?.filesDeleted || 0,
          linesRead: fileOperations?.linesRead || 0,
          linesAdded: fileOperations?.linesAdded || 0,
          linesEdited: fileOperations?.linesEdited || 0,
          linesDeleted: fileOperations?.linesDeleted || 0,
          bytesRead: fileOperations?.bytesRead || 0,
          bytesAdded: fileOperations?.bytesAdded || 0,
          bytesEdited: fileOperations?.bytesEdited || 0,
          bytesDeleted: fileOperations?.bytesDeleted || 0,
          terminalCommands: fileOperations?.terminalCommands || 0,
          fileSearches: fileOperations?.fileSearches || 0,
          fileContentSearches: fileOperations?.fileContentSearches || 0,
          todosCreated: todoStats?.todosCreated || 0,
          todosCompleted: todoStats?.todosCompleted || 0,
          todosInProgress: todoStats?.todosInProgress || 0,
          todoWrites: todoStats?.todoWrites || 0,
          todoReads: todoStats?.todoReads || 0,
          codeLines: fileOperations?.codeLines || 0,
          docsLines: fileOperations?.docsLines || 0,
          dataLines: fileOperations?.dataLines || 0,
          mediaLines: fileOperations?.mediaLines || 0,
          configLines: fileOperations?.configLines || 0,
          otherLines: fileOperations?.otherLines || 0,
        });
      } else if ("User" in message && message.User) {
        const { todoStats, ...userMessage } = message.User as UserMessage;

        // Update current period stats
        await updateCurrentPeriodStats(user.id, eventDate, {
          toolsCalled: 0,
          messagesSent: 1,
          inputTokens: 0,
          outputTokens: 0,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          cost: 0,
          filesRead: 0,
          filesAdded: 0,
          filesEdited: 0,
          filesDeleted: 0,
          linesRead: 0,
          linesAdded: 0,
          linesEdited: 0,
          linesDeleted: 0,
          bytesRead: 0,
          bytesAdded: 0,
          bytesEdited: 0,
          bytesDeleted: 0,
          terminalCommands: 0,
          fileSearches: 0,
          fileContentSearches: 0,
          todosCreated: todoStats?.todosCreated || 0,
          todosCompleted: todoStats?.todosCompleted || 0,
          todosInProgress: todoStats?.todosInProgress || 0,
          todoWrites: todoStats?.todoWrites || 0,
          todoReads: todoStats?.todoReads || 0,
          codeLines: 0,
          docsLines: 0,
          dataLines: 0,
          mediaLines: 0,
          configLines: 0,
          otherLines: 0,
        });
      } else {
        return NextResponse.json(
          {
            error: "Invalid message format (expected 'AI' or 'User' root key)",
          },
          { status: 400 }
        );
      }
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
