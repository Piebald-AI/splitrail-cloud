import { Prisma } from "@prisma/client";

interface AffectedPeriods {
  daily: Date[];
  weekly: Date[];
  monthly: Date[];
  yearly: Date[];
}

export function calculateAffectedPeriods(
  startDate: Date,
  endDate: Date
): AffectedPeriods {
  const daily: Date[] = [];
  const weekly: Date[] = [];
  const monthly: Date[] = [];
  const yearly: Date[] = [];

  const current = new Date(startDate);
  current.setUTCHours(0, 0, 0, 0);

  while (current <= endDate) {
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

  return { daily, weekly, monthly, yearly };
}

export async function recalculateUserStats(
  userId: string,
  applications: string[],
  affectedPeriods: AffectedPeriods,
  tx: Prisma.TransactionClient
) {
  // Delete stale aggregations
  const deleteConditions: Prisma.UserStatsWhereInput[] = [];

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

  // Recalculate each period type
  const periodConfigs: Array<{
    period: string;
    dates: Date[];
    getRange: (date: Date) => { start: Date; end: Date };
  }> = [
    {
      period: "daily",
      dates: affectedPeriods.daily,
      getRange: (date) => {
        const start = new Date(date);
        const end = new Date(date);
        end.setUTCHours(23, 59, 59, 999);
        return { start, end };
      },
    },
    {
      period: "weekly",
      dates: affectedPeriods.weekly,
      getRange: (date) => {
        const start = new Date(date);
        const end = new Date(date);
        end.setUTCDate(end.getUTCDate() + 6);
        end.setUTCHours(23, 59, 59, 999);
        return { start, end };
      },
    },
    {
      period: "monthly",
      dates: affectedPeriods.monthly,
      getRange: (date) => {
        const start = new Date(date);
        const end = new Date(
          Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999)
        );
        return { start, end };
      },
    },
    {
      period: "yearly",
      dates: affectedPeriods.yearly,
      getRange: (date) => {
        const start = new Date(date);
        const end = new Date(
          Date.UTC(date.getUTCFullYear(), 11, 31, 23, 59, 59, 999)
        );
        return { start, end };
      },
    },
  ];

  for (const config of periodConfigs) {
    for (const periodStart of config.dates) {
      for (const application of applications) {
        const { start, end } = config.getRange(periodStart);

        const aggregation = await tx.messageStats.aggregate({
          where: {
            userId,
            application,
            date: { gte: start, lte: end },
          },
          _sum: {
            toolCalls: true,
            inputTokens: true,
            outputTokens: true,
            cacheCreationTokens: true,
            cacheReadTokens: true,
            cachedTokens: true,
            reasoningTokens: true,
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
          _count: {
            _all: true,
          },
        });

        const assistantCount = await tx.messageStats.count({
          where: {
            userId,
            application,
            date: { gte: start, lte: end },
            role: "assistant",
          },
        });

        const userCount = await tx.messageStats.count({
          where: {
            userId,
            application,
            date: { gte: start, lte: end },
            role: "user",
          },
        });

        const costSum = await tx.messageStats.aggregate({
          where: {
            userId,
            application,
            date: { gte: start, lte: end },
          },
          _sum: {
            cost: true,
          },
        });

        // Only create if there's data
        if (aggregation._count._all > 0) {
          await tx.userStats.create({
            data: {
              userId,
              application,
              period: config.period,
              periodStart: start,
              periodEnd: end,
              toolCalls: aggregation._sum.toolCalls || BigInt(0),
              assistantMessages: BigInt(assistantCount),
              userMessages: BigInt(userCount),
              inputTokens: aggregation._sum.inputTokens || BigInt(0),
              outputTokens: aggregation._sum.outputTokens || BigInt(0),
              cacheCreationTokens: aggregation._sum.cacheCreationTokens || BigInt(0),
              cacheReadTokens: aggregation._sum.cacheReadTokens || BigInt(0),
              cachedTokens: aggregation._sum.cachedTokens || BigInt(0),
              reasoningTokens: aggregation._sum.reasoningTokens || BigInt(0),
              cost: costSum._sum.cost || 0,
              filesRead: aggregation._sum.filesRead || BigInt(0),
              filesAdded: aggregation._sum.filesAdded || BigInt(0),
              filesEdited: aggregation._sum.filesEdited || BigInt(0),
              filesDeleted: aggregation._sum.filesDeleted || BigInt(0),
              linesRead: aggregation._sum.linesRead || BigInt(0),
              linesAdded: aggregation._sum.linesAdded || BigInt(0),
              linesEdited: aggregation._sum.linesEdited || BigInt(0),
              linesDeleted: aggregation._sum.linesDeleted || BigInt(0),
              bytesRead: aggregation._sum.bytesRead || BigInt(0),
              bytesAdded: aggregation._sum.bytesAdded || BigInt(0),
              bytesEdited: aggregation._sum.bytesEdited || BigInt(0),
              bytesDeleted: aggregation._sum.bytesDeleted || BigInt(0),
              codeLines: aggregation._sum.codeLines || BigInt(0),
              docsLines: aggregation._sum.docsLines || BigInt(0),
              dataLines: aggregation._sum.dataLines || BigInt(0),
              mediaLines: aggregation._sum.mediaLines || BigInt(0),
              configLines: aggregation._sum.configLines || BigInt(0),
              otherLines: aggregation._sum.otherLines || BigInt(0),
              terminalCommands: aggregation._sum.terminalCommands || BigInt(0),
              fileSearches: aggregation._sum.fileSearches || BigInt(0),
              fileContentSearches: aggregation._sum.fileContentSearches || BigInt(0),
              todosCreated: aggregation._sum.todosCreated || BigInt(0),
              todosCompleted: aggregation._sum.todosCompleted || BigInt(0),
              todosInProgress: aggregation._sum.todosInProgress || BigInt(0),
              todoWrites: aggregation._sum.todoWrites || BigInt(0),
              todoReads: aggregation._sum.todoReads || BigInt(0),
            },
          });
        }
      }
    }
  }
}
