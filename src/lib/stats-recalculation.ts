import { Prisma } from "@prisma/client";
import { getPeriodStartForDate } from "@/lib/dateUtils";

export interface AffectedPeriods {
  hourly: Date[];
  daily: Date[];
  weekly: Date[];
  monthly: Date[];
  yearly: Date[];
}

interface ConversationKey {
  application: string;
  conversationHash: string;
}

type StatsRecalculationClient = Pick<
  Prisma.TransactionClient,
  "$executeRaw"
>;

function createEmptyAffectedPeriods(): AffectedPeriods {
  return {
    hourly: [],
    daily: [],
    weekly: [],
    monthly: [],
    yearly: [],
  };
}

function getWeekStart(date: Date): Date {
  return getPeriodStartForDate("weekly", date);
}

export function addUniqueDate(target: Date[], value: Date) {
  if (!target.some((date) => date.getTime() === value.getTime())) {
    target.push(value);
  }
}

export function calculateAffectedPeriods(
  startDate: Date,
  endDate: Date
): AffectedPeriods {
  const affectedPeriods = createEmptyAffectedPeriods();

  const current = new Date(startDate);
  current.setUTCHours(0, 0, 0, 0);

  while (current <= endDate) {
    // Hourly (for each hour of the day)
    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(current);
      hourStart.setUTCHours(hour, 0, 0, 0);
      if (hourStart <= endDate && hourStart >= startDate) {
        affectedPeriods.hourly.push(hourStart);
      }
    }

    // Daily
    affectedPeriods.daily.push(new Date(current));

    // Weekly (start of ISO week)
    addUniqueDate(affectedPeriods.weekly, getWeekStart(current));

    // Monthly
    const monthStart = new Date(
      Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 1)
    );
    addUniqueDate(affectedPeriods.monthly, monthStart);

    // Yearly
    const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
    addUniqueDate(affectedPeriods.yearly, yearStart);

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return affectedPeriods;
}

export function calculateAffectedPeriodsForDates(
  dates: Date[]
): AffectedPeriods {
  const affectedPeriods = createEmptyAffectedPeriods();

  for (const date of dates) {
    const hourStart = new Date(date);
    hourStart.setUTCMinutes(0, 0, 0);
    addUniqueDate(affectedPeriods.hourly, hourStart);

    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    addUniqueDate(affectedPeriods.daily, dayStart);
    addUniqueDate(affectedPeriods.weekly, getWeekStart(dayStart));
    addUniqueDate(
      affectedPeriods.monthly,
      new Date(Date.UTC(dayStart.getUTCFullYear(), dayStart.getUTCMonth(), 1))
    );
    addUniqueDate(
      affectedPeriods.yearly,
      new Date(Date.UTC(dayStart.getUTCFullYear(), 0, 1))
    );
  }

  return affectedPeriods;
}

export function mergeAffectedPeriods(
  ...periodSets: AffectedPeriods[]
): AffectedPeriods {
  const merged = createEmptyAffectedPeriods();

  for (const periodSet of periodSets) {
    for (const hourly of periodSet.hourly) {
      addUniqueDate(merged.hourly, hourly);
    }
    for (const daily of periodSet.daily) {
      addUniqueDate(merged.daily, daily);
    }
    for (const weekly of periodSet.weekly) {
      addUniqueDate(merged.weekly, weekly);
    }
    for (const monthly of periodSet.monthly) {
      addUniqueDate(merged.monthly, monthly);
    }
    for (const yearly of periodSet.yearly) {
      addUniqueDate(merged.yearly, yearly);
    }
  }

  return merged;
}

export async function getImpactedConversationKeys(
  userId: string,
  applications: string[],
  startDate: Date,
  endDate: Date,
  tx: Prisma.TransactionClient
): Promise<ConversationKey[]> {
  return tx.messageStats.findMany({
    select: {
      application: true,
      conversationHash: true,
    },
    distinct: ["application", "conversationHash"],
    where: {
      userId,
      application: { in: applications },
      conversationHash: { not: "" },
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
}

export async function getConversationStartDatesForKeys(
  userId: string,
  conversationKeys: ConversationKey[],
  tx: Prisma.TransactionClient
): Promise<Date[]> {
  if (conversationKeys.length === 0) {
    return [];
  }

  const conversationHashesByApplication = new Map<string, string[]>();
  for (const { application, conversationHash } of conversationKeys) {
    const hashes = conversationHashesByApplication.get(application) ?? [];
    if (!hashes.includes(conversationHash)) {
      hashes.push(conversationHash);
      conversationHashesByApplication.set(application, hashes);
    }
  }

  const startDates: Date[] = [];

  for (const [application, conversationHashes] of conversationHashesByApplication) {
    const conversationStarts = await tx.messageStats.groupBy({
      by: ["conversationHash"],
      where: {
        userId,
        application,
        conversationHash: { in: conversationHashes },
      },
      _min: {
        date: true,
      },
    });

    for (const conversationStart of conversationStarts) {
      if (conversationStart._min.date) {
        startDates.push(conversationStart._min.date);
      }
    }
  }

  return startDates;
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

function getPeriodEndExpression(
  period: keyof AffectedPeriods,
  timezone: string | null
): Prisma.Sql {
  switch (period) {
    case "hourly":
      return Prisma.sql`a.period_start + INTERVAL '59 minutes 59.999 seconds'`;
    case "daily":
      if (timezone) {
        // Timezone-aware daily period end: truncate period_start to day in timezone,
        // add one day minus one millisecond, then convert back to timezone
        return Prisma.sql`((date_trunc('day', a.period_start AT TIME ZONE ${timezone}) + INTERVAL '1 day' - INTERVAL '1 millisecond') AT TIME ZONE ${timezone})`;
      }
      return Prisma.sql`a.period_start + INTERVAL '23 hours 59 minutes 59.999 seconds'`;
    case "weekly":
      return Prisma.sql`a.period_start + INTERVAL '6 days 23 hours 59 minutes 59.999 seconds'`;
    case "monthly":
      return Prisma.sql`(a.period_start + INTERVAL '1 month') - INTERVAL '1 millisecond'`;
    case "yearly":
      return Prisma.sql`(a.period_start + INTERVAL '1 year') - INTERVAL '1 millisecond'`;
  }
}

/**
 * Build the SQL expression for truncating a timestamp column to a period boundary.
 *
 * For daily periods when a timezone is provided, uses Postgres timezone-aware
 * truncation so that day boundaries align with the user's local midnight rather
 * than UTC midnight.  All other period types use UTC date_trunc pinned to UTC
 * to ensure deterministic truncation regardless of session timezone.
 */
function periodTruncSql(
  column: Prisma.Sql,
  truncUnit: string,
  period: string,
  timezone: string | null
): Prisma.Sql {
  if (period === "daily" && timezone) {
    // The column is `timestamp without time zone` storing UTC values.  The first
    // `AT TIME ZONE 'UTC'` interprets the bare timestamp as UTC (producing
    // timestamptz).  The second `AT TIME ZONE tz` converts to local time
    // (producing timestamp).  After truncating to day we reverse the conversion
    // back to timestamptz so the result is comparable with the JS-computed
    // period-start Date values.
    return Prisma.sql`(date_trunc('day', ${column} AT TIME ZONE 'UTC' AT TIME ZONE ${timezone})) AT TIME ZONE ${timezone}`;
  }
  // Pin non-daily truncation to UTC by applying the same AT TIME ZONE round-trip
  return Prisma.sql`(date_trunc(${truncUnit}, ${column} AT TIME ZONE 'UTC')) AT TIME ZONE 'UTC'`;
}

export async function recalculateUserStats(
  userId: string,
  applications: string[],
  affectedPeriods: AffectedPeriods,
  client?: StatsRecalculationClient,
  timezone?: string | null
) {
  const prisma: StatsRecalculationClient =
    client ?? (await import("@/lib/db")).db;

  // Process each period type with a single aggregation query
  const periodConfigs: Array<{
    period: keyof AffectedPeriods;
    truncUnit: "hour" | "day" | "week" | "month" | "year";
    periodStarts: Date[];
  }> = [
    {
      period: "hourly",
      truncUnit: "hour",
      periodStarts: affectedPeriods.hourly,
    },
    {
      period: "daily",
      truncUnit: "day",
      periodStarts: affectedPeriods.daily,
    },
    {
      period: "weekly",
      truncUnit: "week",
      periodStarts: affectedPeriods.weekly,
    },
    {
      period: "monthly",
      truncUnit: "month",
      periodStarts: affectedPeriods.monthly,
    },
    {
      period: "yearly",
      truncUnit: "year",
      periodStarts: affectedPeriods.yearly,
    },
  ];

  const tz = timezone ?? null;

  for (const config of periodConfigs) {
    if (config.periodStarts.length === 0) continue;

    // Build timezone-aware date truncation expressions for this period type.
    // For daily periods with a timezone, day boundaries align with the user's
    // local midnight instead of UTC midnight.
    const truncDate = periodTruncSql(
      Prisma.raw("date"),
      config.truncUnit,
      config.period,
      tz
    );
    const truncFirstMsg = periodTruncSql(
      Prisma.raw("first_message_at"),
      config.truncUnit,
      config.period,
      tz
    );

    // Aggregate and upsert in a single statement so the caller's transaction
    // stays atomic without paying one round-trip per period/application row.
    await prisma.$executeRaw`
      WITH base AS (
        SELECT
          date,
          application,
          role,
          "inputTokens",
          "outputTokens",
          "cacheCreationTokens",
          "cacheReadTokens",
          "cachedTokens",
          "reasoningTokens",
          cost,
          "toolCalls",
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
          "conversationHash",
          model
        FROM message_stats
        WHERE "userId" = ${userId}
          AND application = ANY(${applications})
      ),
      aggregated_stats AS (
        SELECT
          ${truncDate} AS period_start,
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
          COALESCE(SUM("todoReads"), 0)::bigint AS todo_reads,
          ARRAY_AGG(DISTINCT model) FILTER (WHERE model IS NOT NULL) AS models
        FROM base
        WHERE ${truncDate} = ANY(${config.periodStarts})
        GROUP BY period_start, application
        HAVING COUNT(*) > 0
      ),
      conversation_starts AS (
        SELECT
          application,
          "conversationHash",
          MIN(date) AS first_message_at
        FROM base
        WHERE "conversationHash" IS NOT NULL
        GROUP BY application, "conversationHash"
      ),
      conversation_counts AS (
        SELECT
          ${truncFirstMsg} AS period_start,
          application,
          COUNT(*)::bigint AS conversations
        FROM conversation_starts
        WHERE ${truncFirstMsg} = ANY(${config.periodStarts})
        GROUP BY period_start, application
      )
      INSERT INTO user_stats (
        "id",
        "userId",
        "application",
        "period",
        "periodStart",
        "periodEnd",
        "toolCalls",
        "assistantMessages",
        "userMessages",
        "inputTokens",
        "outputTokens",
        "cacheCreationTokens",
        "cacheReadTokens",
        "cachedTokens",
        "reasoningTokens",
        "cost",
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
        "conversations",
        "models",
        "updatedAt"
      )
      SELECT
        gen_random_uuid()::text,
        ${userId},
        a.application,
        ${config.period},
        a.period_start,
        ${getPeriodEndExpression(config.period, tz)},
        a.tool_calls,
        a.assistant_messages,
        a.user_messages,
        a.input_tokens,
        a.output_tokens,
        a.cache_creation_tokens,
        a.cache_read_tokens,
        a.cached_tokens,
        a.reasoning_tokens,
        a.cost,
        a.files_read,
        a.files_added,
        a.files_edited,
        a.files_deleted,
        a.lines_read,
        a.lines_added,
        a.lines_edited,
        a.lines_deleted,
        a.bytes_read,
        a.bytes_added,
        a.bytes_edited,
        a.bytes_deleted,
        a.code_lines,
        a.docs_lines,
        a.data_lines,
        a.media_lines,
        a.config_lines,
        a.other_lines,
        a.terminal_commands,
        a.file_searches,
        a.file_content_searches,
        a.todos_created,
        a.todos_completed,
        a.todos_in_progress,
        a.todo_writes,
        a.todo_reads,
        COALESCE(c.conversations, 0)::bigint,
        COALESCE(a.models, ARRAY[]::text[]),
        NOW()
      FROM aggregated_stats a
      LEFT JOIN conversation_counts c
        ON a.period_start = c.period_start
       AND a.application = c.application
      ON CONFLICT ("userId", "period", "application", "periodStart")
      DO UPDATE SET
        "periodEnd" = EXCLUDED."periodEnd",
        "toolCalls" = EXCLUDED."toolCalls",
        "assistantMessages" = EXCLUDED."assistantMessages",
        "userMessages" = EXCLUDED."userMessages",
        "inputTokens" = EXCLUDED."inputTokens",
        "outputTokens" = EXCLUDED."outputTokens",
        "cacheCreationTokens" = EXCLUDED."cacheCreationTokens",
        "cacheReadTokens" = EXCLUDED."cacheReadTokens",
        "cachedTokens" = EXCLUDED."cachedTokens",
        "reasoningTokens" = EXCLUDED."reasoningTokens",
        "cost" = EXCLUDED."cost",
        "filesRead" = EXCLUDED."filesRead",
        "filesAdded" = EXCLUDED."filesAdded",
        "filesEdited" = EXCLUDED."filesEdited",
        "filesDeleted" = EXCLUDED."filesDeleted",
        "linesRead" = EXCLUDED."linesRead",
        "linesAdded" = EXCLUDED."linesAdded",
        "linesEdited" = EXCLUDED."linesEdited",
        "linesDeleted" = EXCLUDED."linesDeleted",
        "bytesRead" = EXCLUDED."bytesRead",
        "bytesAdded" = EXCLUDED."bytesAdded",
        "bytesEdited" = EXCLUDED."bytesEdited",
        "bytesDeleted" = EXCLUDED."bytesDeleted",
        "codeLines" = EXCLUDED."codeLines",
        "docsLines" = EXCLUDED."docsLines",
        "dataLines" = EXCLUDED."dataLines",
        "mediaLines" = EXCLUDED."mediaLines",
        "configLines" = EXCLUDED."configLines",
        "otherLines" = EXCLUDED."otherLines",
        "terminalCommands" = EXCLUDED."terminalCommands",
        "fileSearches" = EXCLUDED."fileSearches",
        "fileContentSearches" = EXCLUDED."fileContentSearches",
        "todosCreated" = EXCLUDED."todosCreated",
        "todosCompleted" = EXCLUDED."todosCompleted",
        "todosInProgress" = EXCLUDED."todosInProgress",
        "todoWrites" = EXCLUDED."todoWrites",
        "todoReads" = EXCLUDED."todoReads",
        "conversations" = EXCLUDED."conversations",
        "models" = EXCLUDED."models",
        "updatedAt" = NOW()
    `;
  }
}