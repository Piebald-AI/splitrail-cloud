import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  calculateAffectedPeriods,
  calculateAffectedPeriodsForDates,
  deleteAffectedUserStats,
  getConversationStartDatesForKeys,
  getImpactedConversationKeys,
  mergeAffectedPeriods,
  recalculateUserStats,
} from "@/lib/stats-recalculation";
import {
  createEmptyTotalsAccumulator,
  type DailyStatsRow,
  mergeTotals,
  serializeDailyStatsRow,
  serializeStatsCounters,
  type StatsRecord,
  type TotalsAccumulator,
} from "@/app/api/user/[userId]/stats/types";

function parseDailyStatsDay(day: DailyStatsRow["day"]): Date {
  return day instanceof Date ? day : new Date(day);
}

function getDaysInUtcMonth(date: Date): number {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
  ).getUTCDate();
}

// When the period is weekly or monthly, we can't know exactly which days had
// activity — only the aggregated period buckets exist. So daysTracked is an
// estimate: 7 days per tracked week, or the actual calendar length per tracked month.
function countTrackedDays(
  period: "daily" | "weekly" | "monthly",
  periodsCount: number,
  trackedPeriods: Iterable<Date>
): number {
  if (period === "daily") {
    return periodsCount;
  }

  if (period === "weekly") {
    return periodsCount * 7;
  }

  let totalDays = 0;
  for (const trackedPeriod of trackedPeriods) {
    totalDays += getDaysInUtcMonth(trackedPeriod);
  }

  return totalDays;
}

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
    const validPeriods = ["daily", "weekly", "monthly"] as const;
    if (periodParam && !validPeriods.includes(periodParam as (typeof validPeriods)[number])) {
      return NextResponse.json(
        { error: `Invalid period parameter: "${periodParam}". Must be one of: ${validPeriods.join(", ")}` },
        { status: 400 }
      );
    }
    const period: (typeof validPeriods)[number] =
      periodParam === "weekly" || periodParam === "monthly"
        ? periodParam
        : "daily";

    // Validate timezone parameter
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
    } catch {
      return NextResponse.json(
        { error: "Invalid timezone parameter" },
        { status: 400 }
      );
    }

    // Users can only access their own stats data (for now)
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For daily period, convert periodStart to the user's local timezone so
    // that days align with the user's wall clock. For weekly/monthly the
    // periodStart values are computed using UTC boundaries during aggregation,
    // so applying AT TIME ZONE would shift the bucket key by a day for
    // negative/positive UTC offsets.
    const dailyRows =
      period === "daily"
        ? await db.$queryRaw<DailyStatsRow[]>`
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
              "linesDeleted" AS lines_deleted,
              "bytesRead" AS bytes_read,
              "bytesAdded" AS bytes_added,
              "bytesEdited" AS bytes_edited,
              "bytesDeleted" AS bytes_deleted,
              "codeLines" AS code_lines,
              "docsLines" AS docs_lines,
              "dataLines" AS data_lines,
              "mediaLines" AS media_lines,
              "configLines" AS config_lines,
              "otherLines" AS other_lines,
              "todosCreated" AS todos_created,
              "todosCompleted" AS todos_completed,
              "todosInProgress" AS todos_in_progress,
              "todoReads" AS todo_reads,
              "todoWrites" AS todo_writes,
              conversations,
              models
            FROM user_stats
            WHERE "userId" = ${userId}
              AND period = ${period}
            ORDER BY application, day
          `
        : await db.$queryRaw<DailyStatsRow[]>`
            SELECT
              "periodStart"::date AS day,
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
              "linesDeleted" AS lines_deleted,
              "bytesRead" AS bytes_read,
              "bytesAdded" AS bytes_added,
              "bytesEdited" AS bytes_edited,
              "bytesDeleted" AS bytes_deleted,
              "codeLines" AS code_lines,
              "docsLines" AS docs_lines,
              "dataLines" AS data_lines,
              "mediaLines" AS media_lines,
              "configLines" AS config_lines,
              "otherLines" AS other_lines,
              "todosCreated" AS todos_created,
              "todosCompleted" AS todos_completed,
              "todosInProgress" AS todos_in_progress,
              "todoReads" AS todo_reads,
              "todoWrites" AS todo_writes,
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

    const stats: StatsRecord = { dateStats: {} };
    const totalsByApp: Record<string, TotalsAccumulator> = {};
    const modelSetsByApp = new Map<string, Set<string>>();
    const trackedPeriods = new Map<string, Date>();
    let firstDate: Date | null = null;
    let lastDate: Date | null = null;

    for (const row of dailyRows) {
      const day = parseDailyStatsDay(row.day);
      const dayIso = day.toISOString().split("T")[0];
      const dayKey = `${dayIso}T00:00:00.000Z`;
      const app = row.application;

      if (!stats.dateStats[dayKey]) {
        stats.dateStats[dayKey] = {};
      }
      stats.dateStats[dayKey][app] = {
        ...serializeDailyStatsRow(row),
      };

      if (!trackedPeriods.has(dayKey)) {
        trackedPeriods.set(dayKey, day);
      }
      if (!firstDate || day < firstDate) firstDate = day;
      if (!lastDate || day > lastDate) lastDate = day;

      if (!totalsByApp[app]) {
        totalsByApp[app] = createEmptyTotalsAccumulator();
        modelSetsByApp.set(app, new Set<string>());
      }

      const appTotals = totalsByApp[app];
      appTotals.cost += row.total_cost ?? 0;
      appTotals.inputTokens += row.input_tokens;
      appTotals.outputTokens += row.output_tokens;
      appTotals.cachedTokens += row.cached_tokens;
      appTotals.reasoningTokens += row.reasoning_tokens;
      appTotals.cacheCreationTokens += row.cache_creation_tokens;
      appTotals.cacheReadTokens += row.cache_read_tokens;
      appTotals.conversations += row.conversations;
      appTotals.toolCalls += row.tool_calls;
      appTotals.terminalCommands += row.terminal_commands;
      appTotals.fileSearches += row.file_searches;
      appTotals.fileContentSearches += row.file_content_searches;
      appTotals.filesRead += row.files_read;
      appTotals.filesAdded += row.files_added;
      appTotals.filesEdited += row.files_edited;
      appTotals.filesDeleted += row.files_deleted;
      appTotals.linesRead += row.lines_read;
      appTotals.linesAdded += row.lines_added;
      appTotals.linesEdited += row.lines_edited;
      appTotals.linesDeleted += row.lines_deleted;
      appTotals.bytesRead += row.bytes_read;
      appTotals.bytesAdded += row.bytes_added;
      appTotals.bytesEdited += row.bytes_edited;
      appTotals.bytesDeleted += row.bytes_deleted;
      appTotals.codeLines += row.code_lines;
      appTotals.docsLines += row.docs_lines;
      appTotals.dataLines += row.data_lines;
      appTotals.mediaLines += row.media_lines;
      appTotals.configLines += row.config_lines;
      appTotals.otherLines += row.other_lines;
      appTotals.todosCreated += row.todos_created;
      appTotals.todosCompleted += row.todos_completed;
      appTotals.todosInProgress += row.todos_in_progress;
      appTotals.todoReads += row.todo_reads;
      appTotals.todoWrites += row.todo_writes;

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
        ...serializeStatsCounters(appTotals),
        models: Array.from(modelSetsByApp.get(app) ?? []).sort(),
      };
    }

    const grandTotals = mergeTotals(totalsByApp);
    const totalTokens =
      grandTotals.inputTokens +
      grandTotals.outputTokens +
      grandTotals.cachedTokens +
      grandTotals.reasoningTokens;

    const firstTrackedDate = firstDate ?? new Date();
    const lastTrackedDate = lastDate ?? new Date();
    const periodsTracked = trackedPeriods.size;
    const daysTracked = countTrackedDays(period, periodsTracked, trackedPeriods.values());

    stats.grandTotal = {
      daysTracked,
      periodsTracked,
      numApps: applications.length,
      applications,
      ...serializeStatsCounters(grandTotals),
      tokens: totalTokens.toString(),
      firstDate: firstTrackedDate.toISOString(),
      lastDate: lastTrackedDate.toISOString(),
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

    // Delete messages and rebuild affected aggregates in one transaction so
    // clients never observe a partially-updated stats state.
    const result = await db.$transaction(async (tx) => {
      const impactedConversationKeys = await getImpactedConversationKeys(
        userId,
        applications,
        startDateTime,
        endDateTime,
        tx
      );

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

      // If a deleted message was the first one in a conversation, the
      // conversation count can move into a later period bucket.
      const shiftedConversationStarts = await getConversationStartDatesForKeys(
        userId,
        impactedConversationKeys,
        tx
      );
      const expandedAffectedPeriods = mergeAffectedPeriods(
        affectedPeriods,
        calculateAffectedPeriodsForDates(shiftedConversationStarts)
      );

      // Delete affected UserStats (within transaction for atomicity)
      await deleteAffectedUserStats(
        userId,
        applications,
        expandedAffectedPeriods,
        tx
      );

      await recalculateUserStats(
        userId,
        applications,
        expandedAffectedPeriods,
        tx
      );

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
    }, { timeout: 30000 });

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
