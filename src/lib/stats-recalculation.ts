import { Prisma } from "@prisma/client";

interface AffectedPeriods {
  hourly: Date[];
  daily: Date[];
  weekly: Date[];
  monthly: Date[];
  yearly: Date[];
}

export function calculateAffectedPeriods(
  startDate: Date,
  endDate: Date
): AffectedPeriods {
  const hourly: Date[] = [];
  const daily: Date[] = [];
  const weekly: Date[] = [];
  const monthly: Date[] = [];
  const yearly: Date[] = [];

  const current = new Date(startDate);
  current.setUTCHours(0, 0, 0, 0);

  while (current <= endDate) {
    // Hourly (for each hour of the day)
    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(current);
      hourStart.setUTCHours(hour, 0, 0, 0);
      if (hourStart <= endDate && hourStart >= startDate) {
        hourly.push(hourStart);
      }
    }

    // Daily
    daily.push(new Date(current));

    // Weekly (start of ISO week)
    const weekStart = new Date(current);
    const day = weekStart.getUTCDay();
    const diff = weekStart.getUTCDate() - day + (day === 0 ? -6 : 1);
    weekStart.setUTCDate(diff);
    weekStart.setUTCHours(0, 0, 0, 0);
    if (!weekly.some((d) => d.getTime() === weekStart.getTime())) {
      weekly.push(weekStart);
    }

    // Monthly
    const monthStart = new Date(
      Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 1)
    );
    if (!monthly.some((d) => d.getTime() === monthStart.getTime())) {
      monthly.push(monthStart);
    }

    // Yearly
    const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
    if (!yearly.some((d) => d.getTime() === yearStart.getTime())) {
      yearly.push(yearStart);
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return { hourly, daily, weekly, monthly, yearly };
}

export async function deleteAffectedUserStats(
  userId: string,
  applications: string[],
  affectedPeriods: AffectedPeriods,
  tx: Prisma.TransactionClient
) {
  // Delete stale aggregations within transaction for atomicity
  const deleteConditions: Prisma.UserStatsWhereInput[] = [];

  if (affectedPeriods.hourly.length > 0) {
    deleteConditions.push({
      period: "hourly",
      periodStart: { in: affectedPeriods.hourly },
    });
  }
  if (affectedPeriods.daily.length > 0) {
    deleteConditions.push({
      period: "daily",
      periodStart: { in: affectedPeriods.daily },
    });
  }
  if (affectedPeriods.weekly.length > 0) {
    deleteConditions.push({
      period: "weekly",
      periodStart: { in: affectedPeriods.weekly },
    });
  }
  if (affectedPeriods.monthly.length > 0) {
    deleteConditions.push({
      period: "monthly",
      periodStart: { in: affectedPeriods.monthly },
    });
  }
  if (affectedPeriods.yearly.length > 0) {
    deleteConditions.push({
      period: "yearly",
      periodStart: { in: affectedPeriods.yearly },
    });
  }

  await tx.userStats.deleteMany({
    where: {
      userId,
      application: { in: applications },
      OR: deleteConditions,
    },
  });
}

// Result type for the aggregation query
interface AggregatedPeriodStats {
  period_start: Date;
  period_end: Date;
  application: string;
  tool_calls: bigint;
  assistant_messages: bigint;
  user_messages: bigint;
  input_tokens: bigint;
  output_tokens: bigint;
  cache_creation_tokens: bigint;
  cache_read_tokens: bigint;
  cached_tokens: bigint;
  reasoning_tokens: bigint;
  cost: number;
  files_read: bigint;
  files_added: bigint;
  files_edited: bigint;
  files_deleted: bigint;
  lines_read: bigint;
  lines_added: bigint;
  lines_edited: bigint;
  lines_deleted: bigint;
  bytes_read: bigint;
  bytes_added: bigint;
  bytes_edited: bigint;
  bytes_deleted: bigint;
  code_lines: bigint;
  docs_lines: bigint;
  data_lines: bigint;
  media_lines: bigint;
  config_lines: bigint;
  other_lines: bigint;
  terminal_commands: bigint;
  file_searches: bigint;
  file_content_searches: bigint;
  todos_created: bigint;
  todos_completed: bigint;
  todos_in_progress: bigint;
  todo_writes: bigint;
  todo_reads: bigint;
}

export async function recalculateUserStats(
  userId: string,
  applications: string[],
  affectedPeriods: AffectedPeriods
) {
  const { db } = await import("@/lib/db");

  // Process each period type with a single aggregation query
  const periodConfigs: Array<{
    period: string;
    truncUnit: string;
    periodStarts: Date[];
    getPeriodEnd: (start: Date) => Date;
  }> = [
    {
      period: "hourly",
      truncUnit: "hour",
      periodStarts: affectedPeriods.hourly,
      getPeriodEnd: (start) => {
        const end = new Date(start);
        end.setUTCMinutes(59, 59, 999);
        return end;
      },
    },
    {
      period: "daily",
      truncUnit: "day",
      periodStarts: affectedPeriods.daily,
      getPeriodEnd: (start) => {
        const end = new Date(start);
        end.setUTCHours(23, 59, 59, 999);
        return end;
      },
    },
    {
      period: "weekly",
      truncUnit: "week",
      periodStarts: affectedPeriods.weekly,
      getPeriodEnd: (start) => {
        const end = new Date(start);
        end.setUTCDate(end.getUTCDate() + 6);
        end.setUTCHours(23, 59, 59, 999);
        return end;
      },
    },
    {
      period: "monthly",
      truncUnit: "month",
      periodStarts: affectedPeriods.monthly,
      getPeriodEnd: (start) => {
        return new Date(
          Date.UTC(
            start.getUTCFullYear(),
            start.getUTCMonth() + 1,
            0,
            23,
            59,
            59,
            999
          )
        );
      },
    },
    {
      period: "yearly",
      truncUnit: "year",
      periodStarts: affectedPeriods.yearly,
      getPeriodEnd: (start) => {
        return new Date(
          Date.UTC(start.getUTCFullYear(), 11, 31, 23, 59, 59, 999)
        );
      },
    },
  ];

  for (const config of periodConfigs) {
    if (config.periodStarts.length === 0) continue;

    // Single query aggregates all stats for this period type, grouped by period_start and application
    // This replaces hundreds of individual queries with one efficient GROUP BY query
    const aggregatedStats = await db.$queryRaw<AggregatedPeriodStats[]>`
      SELECT
        date_trunc(${config.truncUnit}, date) AS period_start,
        application,
        COALESCE(SUM("toolCalls"), 0)::bigint AS tool_calls,
        COALESCE(SUM(CASE WHEN role = 'assistant' THEN 1 ELSE 0 END), 0)::bigint AS assistant_messages,
        COALESCE(SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END), 0)::bigint AS user_messages,
        COALESCE(SUM("inputTokens"), 0)::bigint AS input_tokens,
        COALESCE(SUM("outputTokens"), 0)::bigint AS output_tokens,
        COALESCE(SUM("cacheCreationTokens"), 0)::bigint AS cache_creation_tokens,
        COALESCE(SUM("cacheReadTokens"), 0)::bigint AS cache_read_tokens,
        COALESCE(SUM("cachedTokens"), 0)::bigint AS cached_tokens,
        COALESCE(SUM("reasoningTokens"), 0)::bigint AS reasoning_tokens,
        COALESCE(SUM(cost), 0)::float AS cost,
        COALESCE(SUM("filesRead"), 0)::bigint AS files_read,
        COALESCE(SUM("filesAdded"), 0)::bigint AS files_added,
        COALESCE(SUM("filesEdited"), 0)::bigint AS files_edited,
        COALESCE(SUM("filesDeleted"), 0)::bigint AS files_deleted,
        COALESCE(SUM("linesRead"), 0)::bigint AS lines_read,
        COALESCE(SUM("linesAdded"), 0)::bigint AS lines_added,
        COALESCE(SUM("linesEdited"), 0)::bigint AS lines_edited,
        COALESCE(SUM("linesDeleted"), 0)::bigint AS lines_deleted,
        COALESCE(SUM("bytesRead"), 0)::bigint AS bytes_read,
        COALESCE(SUM("bytesAdded"), 0)::bigint AS bytes_added,
        COALESCE(SUM("bytesEdited"), 0)::bigint AS bytes_edited,
        COALESCE(SUM("bytesDeleted"), 0)::bigint AS bytes_deleted,
        COALESCE(SUM("codeLines"), 0)::bigint AS code_lines,
        COALESCE(SUM("docsLines"), 0)::bigint AS docs_lines,
        COALESCE(SUM("dataLines"), 0)::bigint AS data_lines,
        COALESCE(SUM("mediaLines"), 0)::bigint AS media_lines,
        COALESCE(SUM("configLines"), 0)::bigint AS config_lines,
        COALESCE(SUM("otherLines"), 0)::bigint AS other_lines,
        COALESCE(SUM("terminalCommands"), 0)::bigint AS terminal_commands,
        COALESCE(SUM("fileSearches"), 0)::bigint AS file_searches,
        COALESCE(SUM("fileContentSearches"), 0)::bigint AS file_content_searches,
        COALESCE(SUM("todosCreated"), 0)::bigint AS todos_created,
        COALESCE(SUM("todosCompleted"), 0)::bigint AS todos_completed,
        COALESCE(SUM("todosInProgress"), 0)::bigint AS todos_in_progress,
        COALESCE(SUM("todoWrites"), 0)::bigint AS todo_writes,
        COALESCE(SUM("todoReads"), 0)::bigint AS todo_reads
      FROM message_stats
      WHERE "userId" = ${userId}
        AND application = ANY(${applications})
        AND date_trunc(${config.truncUnit}, date) = ANY(${config.periodStarts})
      GROUP BY period_start, application
      HAVING COUNT(*) > 0
    `;

    if (aggregatedStats.length === 0) continue;

    // Batch upsert all results for this period type using a non-interactive transaction
    const upsertOperations = aggregatedStats.map((row) => {
      const periodEnd = config.getPeriodEnd(row.period_start);

      return db.userStats.upsert({
        where: {
          userId_period_application: {
            userId,
            period: config.period,
            application: row.application,
          },
        },
        update: {
          periodStart: row.period_start,
          periodEnd,
          toolCalls: row.tool_calls,
          assistantMessages: row.assistant_messages,
          userMessages: row.user_messages,
          inputTokens: row.input_tokens,
          outputTokens: row.output_tokens,
          cacheCreationTokens: row.cache_creation_tokens,
          cacheReadTokens: row.cache_read_tokens,
          cachedTokens: row.cached_tokens,
          reasoningTokens: row.reasoning_tokens,
          cost: row.cost,
          filesRead: row.files_read,
          filesAdded: row.files_added,
          filesEdited: row.files_edited,
          filesDeleted: row.files_deleted,
          linesRead: row.lines_read,
          linesAdded: row.lines_added,
          linesEdited: row.lines_edited,
          linesDeleted: row.lines_deleted,
          bytesRead: row.bytes_read,
          bytesAdded: row.bytes_added,
          bytesEdited: row.bytes_edited,
          bytesDeleted: row.bytes_deleted,
          codeLines: row.code_lines,
          docsLines: row.docs_lines,
          dataLines: row.data_lines,
          mediaLines: row.media_lines,
          configLines: row.config_lines,
          otherLines: row.other_lines,
          terminalCommands: row.terminal_commands,
          fileSearches: row.file_searches,
          fileContentSearches: row.file_content_searches,
          todosCreated: row.todos_created,
          todosCompleted: row.todos_completed,
          todosInProgress: row.todos_in_progress,
          todoWrites: row.todo_writes,
          todoReads: row.todo_reads,
        },
        create: {
          userId,
          application: row.application,
          period: config.period,
          periodStart: row.period_start,
          periodEnd,
          toolCalls: row.tool_calls,
          assistantMessages: row.assistant_messages,
          userMessages: row.user_messages,
          inputTokens: row.input_tokens,
          outputTokens: row.output_tokens,
          cacheCreationTokens: row.cache_creation_tokens,
          cacheReadTokens: row.cache_read_tokens,
          cachedTokens: row.cached_tokens,
          reasoningTokens: row.reasoning_tokens,
          cost: row.cost,
          filesRead: row.files_read,
          filesAdded: row.files_added,
          filesEdited: row.files_edited,
          filesDeleted: row.files_deleted,
          linesRead: row.lines_read,
          linesAdded: row.lines_added,
          linesEdited: row.lines_edited,
          linesDeleted: row.lines_deleted,
          bytesRead: row.bytes_read,
          bytesAdded: row.bytes_added,
          bytesEdited: row.bytes_edited,
          bytesDeleted: row.bytes_deleted,
          codeLines: row.code_lines,
          docsLines: row.docs_lines,
          dataLines: row.data_lines,
          mediaLines: row.media_lines,
          configLines: row.config_lines,
          otherLines: row.other_lines,
          terminalCommands: row.terminal_commands,
          fileSearches: row.file_searches,
          fileContentSearches: row.file_content_searches,
          todosCreated: row.todos_created,
          todosCompleted: row.todos_completed,
          todosInProgress: row.todos_in_progress,
          todoWrites: row.todo_writes,
          todoReads: row.todo_reads,
        },
      });
    });

    // Use batch transaction (not interactive) - more efficient and no timeout issues
    await db.$transaction(upsertOperations);
  }
}
