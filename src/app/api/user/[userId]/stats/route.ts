import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { n } from "@/lib/utils";
import {
  calculateAffectedPeriods,
  deleteAffectedUserStats,
  recalculateUserStats,
} from "@/lib/stats-recalculation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get("timezone") || "UTC";
    const periodParam = searchParams.get("period");
    const period =
      periodParam === "weekly" || periodParam === "monthly"
        ? periodParam
        : "daily";

    // Users can only access their own stats data (for now)
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dailyRows = await db.$queryRaw<
      Array<{
        day: Date;
        application: string;
        total_cost: number;
        cached_tokens: bigint;
        input_tokens: bigint;
        output_tokens: bigint;
        reasoning_tokens: bigint;
        cache_creation_tokens: bigint;
        cache_read_tokens: bigint;
        tool_calls: bigint;
        terminal_commands: bigint;
        file_searches: bigint;
        file_content_searches: bigint;
        files_read: bigint;
        files_added: bigint;
        files_edited: bigint;
        files_deleted: bigint;
        lines_read: bigint;
        lines_edited: bigint;
        lines_added: bigint;
        conversations: bigint;
        models: string[] | null;
      }>
    >`
      SELECT
        ("periodStart" AT TIME ZONE 'UTC' AT TIME ZONE ${timezone})::date AS day,
        application,
        cost AS total_cost,
        "cachedTokens" AS cached_tokens,
        "inputTokens" AS input_tokens,
        "outputTokens" AS output_tokens,
        "reasoningTokens" AS reasoning_tokens,
        "cacheCreationTokens" AS cache_creation_tokens,
        "cacheReadTokens" AS cache_read_tokens,
        "toolCalls" AS tool_calls,
        "terminalCommands" AS terminal_commands,
        "fileSearches" AS file_searches,
        "fileContentSearches" AS file_content_searches,
        "filesRead" AS files_read,
        "filesAdded" AS files_added,
        "filesEdited" AS files_edited,
        "filesDeleted" AS files_deleted,
        "linesRead" AS lines_read,
        "linesEdited" AS lines_edited,
        "linesAdded" AS lines_added,
        conversations,
        models
      FROM user_stats
      WHERE "userId" = ${userId}
        AND period = ${period}
      ORDER BY application, day
    `;

    if (dailyRows.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          stats: null,
        },
      });
    }

    type StatsRecord = {
      [key: string]: Record<string, unknown>;
    } & {
      totals?: Record<string, unknown>;
      grandTotal?: {
        daysTracked: number;
        numApps: number;
        applications: string[];
        cost: number;
        inputTokens: number;
        outputTokens: number;
        cachedTokens: number;
        cacheCreationTokens: number;
        cacheReadTokens: number;
        reasoningTokens: number;
        tokens?: number;
        conversations: number;
        toolCalls: number;
        terminalCommands: number;
        fileSearches: number;
        fileContentSearches: number;
        filesRead: number;
        filesAdded: number;
        filesEdited: number;
        filesDeleted: number;
        linesRead: number;
        linesAdded: number;
        linesEdited: number;
        firstDate: Date;
        lastDate: Date;
      };
    };

    type TotalsAccumulator = {
      cost: number;
      inputTokens: number;
      outputTokens: number;
      cachedTokens: number;
      reasoningTokens: number;
      cacheCreationTokens: number;
      cacheReadTokens: number;
      conversations: number;
      toolCalls: number;
      terminalCommands: number;
      fileSearches: number;
      fileContentSearches: number;
      filesRead: number;
      filesAdded: number;
      filesEdited: number;
      filesDeleted: number;
      linesRead: number;
      linesAdded: number;
      linesEdited: number;
    };

    const stats: StatsRecord = {};
    const totalsByApp: Record<string, TotalsAccumulator> = {};
    const modelSetsByApp = new Map<string, Set<string>>();
    const dayKeys = new Set<string>();
    let firstDate: Date | null = null;
    let lastDate: Date | null = null;

    for (const row of dailyRows) {
      const dayIso = row.day.toISOString().split("T")[0];
      const dayKey = `${dayIso}T00:00:00.000Z`;
      const app = row.application;

      if (!stats[dayKey]) {
        stats[dayKey] = {};
      }
      stats[dayKey][app] = {
        cost: row.total_cost ?? 0,
        inputTokens: n(row.input_tokens),
        outputTokens: n(row.output_tokens),
        cachedTokens: n(row.cached_tokens),
        reasoningTokens: n(row.reasoning_tokens),
        cacheCreationTokens: n(row.cache_creation_tokens),
        cacheReadTokens: n(row.cache_read_tokens),
        conversations: n(row.conversations),
        toolCalls: n(row.tool_calls),
        terminalCommands: n(row.terminal_commands),
        fileSearches: n(row.file_searches),
        fileContentSearches: n(row.file_content_searches),
        filesRead: n(row.files_read),
        filesAdded: n(row.files_added),
        filesEdited: n(row.files_edited),
        filesDeleted: n(row.files_deleted),
        linesRead: n(row.lines_read),
        linesAdded: n(row.lines_added),
        linesEdited: n(row.lines_edited),
        models: row.models ?? [],
      };

      dayKeys.add(dayKey);
      if (!firstDate || row.day < firstDate) firstDate = row.day;
      if (!lastDate || row.day > lastDate) lastDate = row.day;

      if (!totalsByApp[app]) {
        totalsByApp[app] = {
          cost: 0,
          inputTokens: 0,
          outputTokens: 0,
          cachedTokens: 0,
          reasoningTokens: 0,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          conversations: 0,
          toolCalls: 0,
          terminalCommands: 0,
          fileSearches: 0,
          fileContentSearches: 0,
          filesRead: 0,
          filesAdded: 0,
          filesEdited: 0,
          filesDeleted: 0,
          linesRead: 0,
          linesAdded: 0,
          linesEdited: 0,
        };
        modelSetsByApp.set(app, new Set<string>());
      }

      const appTotals = totalsByApp[app];
      appTotals.cost += row.total_cost ?? 0;
      appTotals.inputTokens += n(row.input_tokens);
      appTotals.outputTokens += n(row.output_tokens);
      appTotals.cachedTokens += n(row.cached_tokens);
      appTotals.reasoningTokens += n(row.reasoning_tokens);
      appTotals.cacheCreationTokens += n(row.cache_creation_tokens);
      appTotals.cacheReadTokens += n(row.cache_read_tokens);
      appTotals.conversations += n(row.conversations);
      appTotals.toolCalls += n(row.tool_calls);
      appTotals.terminalCommands += n(row.terminal_commands);
      appTotals.fileSearches += n(row.file_searches);
      appTotals.fileContentSearches += n(row.file_content_searches);
      appTotals.filesRead += n(row.files_read);
      appTotals.filesAdded += n(row.files_added);
      appTotals.filesEdited += n(row.files_edited);
      appTotals.filesDeleted += n(row.files_deleted);
      appTotals.linesRead += n(row.lines_read);
      appTotals.linesAdded += n(row.lines_added);
      appTotals.linesEdited += n(row.lines_edited);

      const modelSet = modelSetsByApp.get(app)!;
      for (const model of row.models ?? []) {
        modelSet.add(model);
      }
    }

    stats.totals = {};
    const applications = Object.keys(totalsByApp);
    for (const app of applications) {
      const appTotals = totalsByApp[app];
      stats.totals[app] = {
        ...appTotals,
        models: Array.from(modelSetsByApp.get(app) ?? []).sort(),
      };
    }

    const grandConversations = applications.reduce(
      (sum, app) => sum + totalsByApp[app].conversations,
      0
    );
    const grandTotals = applications.reduce(
      (acc, app) => {
        const appTotals = totalsByApp[app];
        acc.cost += appTotals.cost;
        acc.inputTokens += appTotals.inputTokens;
        acc.outputTokens += appTotals.outputTokens;
        acc.cachedTokens += appTotals.cachedTokens;
        acc.reasoningTokens += appTotals.reasoningTokens;
        acc.cacheCreationTokens += appTotals.cacheCreationTokens;
        acc.cacheReadTokens += appTotals.cacheReadTokens;
        acc.toolCalls += appTotals.toolCalls;
        acc.terminalCommands += appTotals.terminalCommands;
        acc.fileSearches += appTotals.fileSearches;
        acc.fileContentSearches += appTotals.fileContentSearches;
        acc.filesRead += appTotals.filesRead;
        acc.filesAdded += appTotals.filesAdded;
        acc.filesEdited += appTotals.filesEdited;
        acc.filesDeleted += appTotals.filesDeleted;
        acc.linesRead += appTotals.linesRead;
        acc.linesAdded += appTotals.linesAdded;
        acc.linesEdited += appTotals.linesEdited;
        return acc;
      },
      {
        cost: 0,
        inputTokens: 0,
        outputTokens: 0,
        cachedTokens: 0,
        reasoningTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        toolCalls: 0,
        terminalCommands: 0,
        fileSearches: 0,
        fileContentSearches: 0,
        filesRead: 0,
        filesAdded: 0,
        filesEdited: 0,
        filesDeleted: 0,
        linesRead: 0,
        linesAdded: 0,
        linesEdited: 0,
      }
    );

    const firstTrackedDate = firstDate ?? new Date();
    const lastTrackedDate = lastDate ?? new Date();

    stats.grandTotal = {
      daysTracked: dayKeys.size,
      numApps: applications.length,
      applications,
      cost: grandTotals.cost,
      inputTokens: grandTotals.inputTokens,
      outputTokens: grandTotals.outputTokens,
      cachedTokens: grandTotals.cachedTokens,
      reasoningTokens: grandTotals.reasoningTokens,
      cacheCreationTokens: grandTotals.cacheCreationTokens,
      cacheReadTokens: grandTotals.cacheReadTokens,
      tokens:
        grandTotals.inputTokens +
        grandTotals.outputTokens +
        grandTotals.cachedTokens +
        grandTotals.reasoningTokens,
      conversations: grandConversations,
      toolCalls: grandTotals.toolCalls,
      terminalCommands: grandTotals.terminalCommands,
      fileSearches: grandTotals.fileSearches,
      fileContentSearches: grandTotals.fileContentSearches,
      filesRead: grandTotals.filesRead,
      filesAdded: grandTotals.filesAdded,
      filesEdited: grandTotals.filesEdited,
      filesDeleted: grandTotals.filesDeleted,
      linesRead: grandTotals.linesRead,
      linesAdded: grandTotals.linesAdded,
      linesEdited: grandTotals.linesEdited,
      firstDate: firstTrackedDate,
      lastDate: lastTrackedDate,
    };

    return NextResponse.json({
      success: true,
      data: {
        stats,
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const { userId } = await params;
    const { searchParams } = new URL(request.url);

    // Authorization
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse parameters
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate") || startDate;
    const applicationsParam = searchParams.get("applications");

    if (!startDate || !applicationsParam) {
      return NextResponse.json(
        { error: "Missing required parameters: startDate, applications" },
        { status: 400 }
      );
    }

    const applications = applicationsParam.split(",");

    // Parse dates
    const startDateTime = new Date(`${startDate}T00:00:00.000Z`);
    const endDateTime = new Date(`${endDate}T23:59:59.999Z`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    if (endDateTime < startDateTime) {
      return NextResponse.json(
        { error: "End date must be >= start date" },
        { status: 400 }
      );
    }

    // Calculate affected periods before the transaction (pure function, no DB access needed)
    const affectedPeriods = calculateAffectedPeriods(
      startDateTime,
      endDateTime
    );

    // Delete messages and aggregated stats in a transaction for atomicity
    const result = await db.$transaction(async (tx) => {
      // Delete MessageStats
      const deleteResult = await tx.messageStats.deleteMany({
        where: {
          userId,
          application: { in: applications },
          date: {
            gte: startDateTime,
            lte: endDateTime,
          },
        },
      });

      // Delete affected UserStats (within transaction for atomicity)
      await deleteAffectedUserStats(userId, applications, affectedPeriods, tx);

      return {
        deletedMessages: deleteResult.count,
        affectedDays:
          Math.ceil(
            (endDateTime.getTime() - startDateTime.getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1,
        dateRange: {
          start: startDate,
          end: endDate,
        },
        applications,
      };
    });

    // Recalculate UserStats outside transaction to avoid timeout issues
    await recalculateUserStats(userId, applications, affectedPeriods);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Delete stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
