import { NextRequest, NextResponse } from "next/server";
import { DatabaseService, db } from "@/lib/db";
import { AIMessage, UserMessage, type UploadStatsRequest } from "@/types";

interface MessageStats {
  toolsUsed: number;
  messagesCount: number;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  cost: number;
  filesRead: number;
  filesEdited: number;
  filesWritten: number;
  linesRead: number;
  linesEdited: number;
  linesWritten: number;
  linesAdded: number;
  linesDeleted: number;
  linesModified: number;
  bytesRead: number;
  bytesEdited: number;
  bytesWritten: number;
  terminalCommands: number;
  globSearches: number;
  grepSearches: number;
  todosCreated: number;
  todosCompleted: number;
  todosInProgress: number;
  todoWrites: number;
  todoReads: number;
}

function getHourStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0, 0, 0);
}

function getDayStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
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
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 59, 59, 999);
}

function getDayEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000 + 999);
}

function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function getYearEnd(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

async function updateCurrentPeriodStats(userId: string, eventDate: Date, messageType: string, stats: MessageStats) {
  const hourStart = getHourStart(eventDate);
  const dayStart = getDayStart(eventDate);
  const weekStart = getWeekStart(eventDate);
  const monthStart = getMonthStart(eventDate);
  const yearStart = getYearStart(eventDate);

  // Update all period stats in parallel
  await Promise.all([
    updatePeriodStats(userId, "hourly", hourStart, getHourEnd(eventDate), messageType, stats),
    updatePeriodStats(userId, "daily", dayStart, getDayEnd(eventDate), messageType, stats),
    updatePeriodStats(userId, "weekly", weekStart, getWeekEnd(eventDate), messageType, stats),
    updatePeriodStats(userId, "monthly", monthStart, getMonthEnd(eventDate), messageType, stats),
    updatePeriodStats(userId, "yearly", yearStart, getYearEnd(eventDate), messageType, stats),
    updatePeriodStats(userId, "all-time", null, null, messageType, stats)
  ]);
}

async function updatePeriodStats(userId: string, period: string, periodStart: Date | null, periodEnd: Date | null, messageType: string, stats: MessageStats) {
  const existingStats = await db.userStats.findUnique({
    where: { 
      userId_period: {
        userId,
        period
      }
    }
  });

  const statsData = {
    period,
    periodStart,
    periodEnd,
    toolsCalled: stats.toolsUsed,
    messagesSent: stats.messagesCount,
    inputTokens: stats.inputTokens,
    outputTokens: stats.outputTokens,
    cacheCreationTokens: stats.cacheCreationTokens,
    cacheReadTokens: stats.cacheReadTokens,
    cost: stats.cost,
    filesRead: stats.filesRead,
    filesEdited: stats.filesEdited,
    filesWritten: stats.filesWritten,
    linesRead: stats.linesRead,
    linesEdited: stats.linesEdited,
    linesWritten: stats.linesWritten,
    linesAdded: stats.linesAdded,
    linesDeleted: stats.linesDeleted,
    linesModified: stats.linesModified,
    bytesRead: stats.bytesRead,
    bytesEdited: stats.bytesEdited,
    bytesWritten: stats.bytesWritten,
    terminalCommands: stats.terminalCommands,
    globSearches: stats.globSearches,
    grepSearches: stats.grepSearches,
    todosCreated: stats.todosCreated,
    todosCompleted: stats.todosCompleted,
    todosInProgress: stats.todosInProgress,
    todoWrites: stats.todoWrites,
    todoReads: stats.todoReads,
  };

  if (!existingStats || (periodStart && existingStats.periodStart && existingStats.periodStart.getTime() !== periodStart.getTime())) {
    // New period - replace existing stats
    await db.userStats.upsert({
      where: { 
        userId_period: {
          userId,
          period
        }
      },
      create: { userId, ...statsData },
      update: statsData
    });
  } else {
    // Same period - add to existing stats
    await db.userStats.update({
      where: { 
        userId_period: {
          userId,
          period
        }
      },
      data: {
        toolsCalled: existingStats.toolsCalled + stats.toolsUsed,
        messagesSent: existingStats.messagesSent + stats.messagesCount,
        inputTokens: existingStats.inputTokens + stats.inputTokens,
        outputTokens: existingStats.outputTokens + stats.outputTokens,
        cacheCreationTokens: existingStats.cacheCreationTokens + stats.cacheCreationTokens,
        cacheReadTokens: existingStats.cacheReadTokens + stats.cacheReadTokens,
        cost: existingStats.cost + stats.cost,
        filesRead: existingStats.filesRead + stats.filesRead,
        filesEdited: existingStats.filesEdited + stats.filesEdited,
        filesWritten: existingStats.filesWritten + stats.filesWritten,
        linesRead: existingStats.linesRead + stats.linesRead,
        linesEdited: existingStats.linesEdited + stats.linesEdited,
        linesWritten: existingStats.linesWritten + stats.linesWritten,
        linesAdded: existingStats.linesAdded + stats.linesAdded,
        linesDeleted: existingStats.linesDeleted + stats.linesDeleted,
        linesModified: existingStats.linesModified + stats.linesModified,
        bytesRead: existingStats.bytesRead + stats.bytesRead,
        bytesEdited: existingStats.bytesEdited + stats.bytesEdited,
        bytesWritten: existingStats.bytesWritten + stats.bytesWritten,
        terminalCommands: existingStats.terminalCommands + stats.terminalCommands,
        globSearches: existingStats.globSearches + stats.globSearches,
        grepSearches: existingStats.grepSearches + stats.grepSearches,
        todosCreated: existingStats.todosCreated + stats.todosCreated,
        todosCompleted: existingStats.todosCompleted + stats.todosCompleted,
        todosInProgress: existingStats.todosInProgress + stats.todosInProgress,
        todoWrites: existingStats.todoWrites + stats.todoWrites,
        todoReads: existingStats.todoReads + stats.todoReads,
      }
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
      const dateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      
      if ("AI" in message && message.AI) {
        const { fileOperations, todoStats, ...aiMessage } = message.AI as AIMessage;
        

        // Update current period stats
        await updateCurrentPeriodStats(user.id, eventDate, "AI", {
          toolsUsed: aiMessage.toolCalls || 0,
          messagesCount: 1,
          inputTokens: aiMessage.inputTokens || 0,
          outputTokens: aiMessage.outputTokens || 0,
          cacheCreationTokens: aiMessage.cacheCreationTokens || 0,
          cacheReadTokens: aiMessage.cacheReadTokens || 0,
          cost: aiMessage.cost || 0,
          filesRead: fileOperations?.filesRead || 0,
          filesEdited: fileOperations?.filesEdited || 0,
          filesWritten: fileOperations?.filesWritten || 0,
          linesRead: fileOperations?.linesRead || 0,
          linesEdited: fileOperations?.linesEdited || 0,
          linesWritten: fileOperations?.linesWritten || 0,
          linesAdded: fileOperations?.linesAdded || 0,
          linesDeleted: fileOperations?.linesDeleted || 0,
          linesModified: fileOperations?.linesModified || 0,
          bytesRead: fileOperations?.bytesRead || 0,
          bytesEdited: fileOperations?.bytesEdited || 0,
          bytesWritten: fileOperations?.bytesWritten || 0,
          terminalCommands: fileOperations?.terminalCommands || 0,
          globSearches: fileOperations?.globSearches || 0,
          grepSearches: fileOperations?.grepSearches || 0,
          todosCreated: todoStats?.todosCreated || 0,
          todosCompleted: todoStats?.todosCompleted || 0,
          todosInProgress: todoStats?.todosInProgress || 0,
          todoWrites: todoStats?.todoWrites || 0,
          todoReads: todoStats?.todoReads || 0,
        });
        
      } else if ("User" in message && message.User) {
        const { todoStats, ...userMessage } = message.User as UserMessage;
        

        // Update current period stats
        await updateCurrentPeriodStats(user.id, eventDate, "User", {
          toolsUsed: 0,
          messagesCount: 1,
          inputTokens: 0,
          outputTokens: 0,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          cost: 0,
          filesRead: 0,
          filesEdited: 0,
          filesWritten: 0,
          linesRead: 0,
          linesEdited: 0,
          linesWritten: 0,
          linesAdded: 0,
          linesDeleted: 0,
          linesModified: 0,
          bytesRead: 0,
          bytesEdited: 0,
          bytesWritten: 0,
          terminalCommands: 0,
          globSearches: 0,
          grepSearches: 0,
          todosCreated: todoStats?.todosCreated || 0,
          todosCompleted: todoStats?.todosCompleted || 0,
          todosInProgress: todoStats?.todosInProgress || 0,
          todoWrites: todoStats?.todoWrites || 0,
          todoReads: todoStats?.todoReads || 0,
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