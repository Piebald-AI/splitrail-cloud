"use client";

import * as React from "react";
import { cn, formatLargeNumber } from "@/lib/utils";
import { ApplicationType } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { TableCell, TableFooter, TableRow } from "@/components/ui/table";
import { StatsFooterMetricCells } from "@/app/_stats/stats-footer-cells";
import { StatsTableShell } from "@/app/_stats/stats-table-shell";
import {
  addCounterValues,
  compareCounterValues,
  counterSortingFn,
  counterToBigInt,
  isPositiveCounter,
  subtractCounterValues,
  ZERO_COUNTER,
  type AnalyticsPeriod,
  type CounterInput,
  type DayStat,
  type StatsData,
  type TotalsRow,
} from "@/app/_stats/types";
import {
  addPeriod,
  formatDateForDisplay,
  getDateHoverText,
  getPeriodCountLabel,
  getPeriodStart,
} from "@/app/_stats/date-helpers";

type DayDelta = {
  cost: number;
  cachedTokens: bigint;
  inputTokens: bigint;
  outputTokens: bigint;
  reasoningTokens: bigint;
  conversations: bigint;
  toolCalls: bigint;
  terminalCommands: bigint;
  searches: bigint;
  filesTouched: bigint;
  linesRead: bigint;
  linesEdited: bigint;
  linesAdded: bigint;
};

function formatCounterDelta(value: bigint): string {
  if (value === 0n) return "0";
  return `${value > 0n ? "+" : ""}${formatLargeNumber(value)}`;
}

function getStatsForApplication(
  statsData: StatsData,
  app: ApplicationType,
  includeEmptyDays: boolean,
  period: AnalyticsPeriod
): DayStat[] {
  if (!statsData?.stats) return [];

  const appDates = Object.keys(statsData.stats)
    .filter((k) => k !== "totals" && k !== "grandTotal")
    .filter((date) => statsData.stats[date]?.[app]);

  if (appDates.length === 0) return [];

  const startDate = getPeriodStart(new Date(appDates.sort()[0]), period);

  // Fill through today so empty days are visible
  const today = getPeriodStart(new Date(), period);

  const dateRange: string[] = [];
  const cursor = new Date(startDate);
  while (cursor <= today) {
    dateRange.push(`${cursor.toISOString().split("T")[0]}T00:00:00.000Z`);
    const next = addPeriod(cursor, period);
    cursor.setTime(next.getTime());
  }

  return dateRange
    .reverse()
    .map((date) => {
      const existing = statsData.stats[date]?.[app];
      if (existing) return { ...existing, date };

      return {
        date,
        cost: 0,
        cachedTokens: ZERO_COUNTER,
        inputTokens: ZERO_COUNTER,
        outputTokens: ZERO_COUNTER,
        reasoningTokens: ZERO_COUNTER,
        cacheCreationTokens: ZERO_COUNTER,
        cacheReadTokens: ZERO_COUNTER,
        conversations: ZERO_COUNTER,
        toolCalls: ZERO_COUNTER,
        terminalCommands: ZERO_COUNTER,
        fileSearches: ZERO_COUNTER,
        fileContentSearches: ZERO_COUNTER,
        filesRead: ZERO_COUNTER,
        filesAdded: ZERO_COUNTER,
        filesEdited: ZERO_COUNTER,
        filesDeleted: ZERO_COUNTER,
        linesRead: ZERO_COUNTER,
        linesAdded: ZERO_COUNTER,
        linesEdited: ZERO_COUNTER,
        linesDeleted: ZERO_COUNTER,
        bytesRead: ZERO_COUNTER,
        bytesAdded: ZERO_COUNTER,
        bytesEdited: ZERO_COUNTER,
        bytesDeleted: ZERO_COUNTER,
        codeLines: ZERO_COUNTER,
        docsLines: ZERO_COUNTER,
        dataLines: ZERO_COUNTER,
        mediaLines: ZERO_COUNTER,
        configLines: ZERO_COUNTER,
        otherLines: ZERO_COUNTER,
        todosCreated: ZERO_COUNTER,
        todosCompleted: ZERO_COUNTER,
        todosInProgress: ZERO_COUNTER,
        todoReads: ZERO_COUNTER,
        todoWrites: ZERO_COUNTER,
        models: [],
        isEmpty: true,
      };
    })
    .filter((stat) => includeEmptyDays || !stat.isEmpty);
}

function buildDeltasWithEmptyDays(
  statsData: StatsData,
  app: ApplicationType,
  period: AnalyticsPeriod
): Record<string, DayDelta> {
  const withEmptyDays = getStatsForApplication(statsData, app, true, period);
  const deltas: Record<string, DayDelta> = {};

  withEmptyDays.forEach((current, index) => {
    const previous = withEmptyDays[index + 1];
    const currentSearches = addCounterValues(
      current.fileSearches,
      current.fileContentSearches
    );
    const previousSearches = previous
      ? addCounterValues(previous.fileSearches, previous.fileContentSearches)
      : 0n;
    const currentFilesTouched = addCounterValues(
      current.filesRead,
      current.filesAdded,
      current.filesEdited,
      current.filesDeleted
    );
    const previousFilesTouched = previous
      ? addCounterValues(
          previous.filesRead,
          previous.filesAdded,
          previous.filesEdited,
          previous.filesDeleted
        )
      : 0n;

    deltas[current.date] = {
      cost: current.cost - (previous?.cost ?? 0),
      cachedTokens: subtractCounterValues(
        current.cachedTokens,
        previous?.cachedTokens
      ),
      inputTokens: subtractCounterValues(
        current.inputTokens,
        previous?.inputTokens
      ),
      outputTokens: subtractCounterValues(
        current.outputTokens,
        previous?.outputTokens
      ),
      reasoningTokens: subtractCounterValues(
        current.reasoningTokens,
        previous?.reasoningTokens
      ),
      conversations: subtractCounterValues(
        current.conversations,
        previous?.conversations
      ),
      toolCalls: subtractCounterValues(current.toolCalls, previous?.toolCalls),
      terminalCommands: subtractCounterValues(
        current.terminalCommands,
        previous?.terminalCommands
      ),
      searches: currentSearches - previousSearches,
      filesTouched: currentFilesTouched - previousFilesTouched,
      linesRead: subtractCounterValues(current.linesRead, previous?.linesRead),
      linesEdited: subtractCounterValues(
        current.linesEdited,
        previous?.linesEdited
      ),
      linesAdded: subtractCounterValues(current.linesAdded, previous?.linesAdded),
    };
  });

  return deltas;
}

function DeltaText({
  value,
  kind = "counter",
  formatCurrency,
}: {
  value: bigint | number;
  kind?: "counter" | "currency";
  formatCurrency?: (amount: number) => string;
}) {
  if ((typeof value === "bigint" && value === 0n) || value === 0) return null;

  return (
    <div
      className={cn(
        "text-[11px]",
        value > 0
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-rose-600 dark:text-rose-400"
      )}
    >
      {kind === "currency"
        ? `${value > 0 ? "+" : ""}${
            formatCurrency
              ? formatCurrency(typeof value === "number" ? value : Number(value))
              : typeof value === "number"
                ? value.toFixed(2)
                : Number(value).toFixed(2)
          }`
        : formatCounterDelta(typeof value === "bigint" ? value : BigInt(value))}
    </div>
  );
}

function createColumns(
  maxStats: {
    cost: number;
    cachedTokens: bigint;
    inputTokens: bigint;
    outputTokens: bigint;
    reasoningTokens: bigint;
    conversations: bigint;
    toolCalls: bigint;
    terminalCommands: bigint;
    searches: bigint;
    filesTouched: bigint;
    linesAdded: bigint;
    linesEdited: bigint;
  },
  statsData: StatsData,
  app: ApplicationType,
  formatConvertedCurrency: (amount: number) => string,
  showDeltas: boolean,
  deltasByDate: Record<string, DayDelta>,
  period: AnalyticsPeriod
): ColumnDef<DayStat>[] {
  const getDelta = (row: DayStat) => deltasByDate[row.date];
  const isMaxCounter = (value: CounterInput, maxValue: bigint) =>
    compareCounterValues(value, maxValue) === 0 && isPositiveCounter(maxValue);

  return [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("date") as string;
        const hoverText = getDateHoverText(date, period);
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-default">
                {formatDateForDisplay(date, period)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6}>
              {hoverText}
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: "cost",
      header: "Cost",
      cell: ({ row }) => {
        const cost = row.getValue("cost") as number;
        const delta = getDelta(row.original);
        return (
          <div
            className={cn(
              "font-mono",
              cost > 0
                ? cost === maxStats.cost
                  ? "text-red-600 dark:text-red-500"
                  : "text-amber-600 dark:text-amber-400"
                : ""
            )}
          >
            {formatConvertedCurrency(cost)}
            {showDeltas && (
              <DeltaText
                value={delta?.cost ?? 0}
                kind="currency"
                formatCurrency={formatConvertedCurrency}
              />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "cachedTokens",
      header: "Cached Tokens",
      sortingFn: counterSortingFn<DayStat>((row) => row.cachedTokens),
      cell: ({ row }) => {
        const value = row.original.cachedTokens;
        const delta = getDelta(row.original);
        return (
          <div
            className={
              isMaxCounter(value, maxStats.cachedTokens) ? "text-red-600" : ""
            }
          >
            {formatLargeNumber(value)}
            {showDeltas && <DeltaText value={delta?.cachedTokens ?? 0n} />}
          </div>
        );
      },
    },
    {
      accessorKey: "inputTokens",
      header: "Input Tokens",
      sortingFn: counterSortingFn<DayStat>((row) => row.inputTokens),
      cell: ({ row }) => {
        const value = row.original.inputTokens;
        const delta = getDelta(row.original);
        return (
          <div
            className={
              isMaxCounter(value, maxStats.inputTokens) ? "text-red-600" : ""
            }
          >
            {formatLargeNumber(value)}
            {showDeltas && <DeltaText value={delta?.inputTokens ?? 0n} />}
          </div>
        );
      },
    },
    {
      accessorKey: "outputTokens",
      header: "Output Tokens",
      sortingFn: counterSortingFn<DayStat>((row) => row.outputTokens),
      cell: ({ row }) => {
        const value = row.original.outputTokens;
        const delta = getDelta(row.original);
        return (
          <div
            className={
              isMaxCounter(value, maxStats.outputTokens) ? "text-red-600" : ""
            }
          >
            {formatLargeNumber(value)}
            {showDeltas && <DeltaText value={delta?.outputTokens ?? 0n} />}
          </div>
        );
      },
    },
    {
      accessorKey: "reasoningTokens",
      header: "Reasoning",
      sortingFn: counterSortingFn<DayStat>((row) => row.reasoningTokens),
      cell: ({ row }) => {
        const value = row.original.reasoningTokens;
        const delta = getDelta(row.original);
        return (
          <div
            className={
              isMaxCounter(value, maxStats.reasoningTokens)
                ? "text-red-600"
                : ""
            }
          >
            {formatLargeNumber(value)}
            {showDeltas && <DeltaText value={delta?.reasoningTokens ?? 0n} />}
          </div>
        );
      },
    },
    {
      accessorKey: "conversations",
      header: "Conversations",
      sortingFn: counterSortingFn<DayStat>((row) => row.conversations),
      cell: ({ row }) => {
        const value = row.original.conversations;
        const delta = getDelta(row.original);
        return (
          <div
            className={
              isMaxCounter(value, maxStats.conversations)
                ? "text-red-600"
                : ""
            }
          >
            {formatLargeNumber(value)}
            {showDeltas && <DeltaText value={delta?.conversations ?? 0n} />}
          </div>
        );
      },
    },
    {
      accessorKey: "toolCalls",
      header: "Tool Calls",
      sortingFn: counterSortingFn<DayStat>((row) => row.toolCalls),
      cell: ({ row }) => {
        const value = row.original.toolCalls;
        const isEmpty = row.original.isEmpty;
        const delta = getDelta(row.original);
        return (
          <div
            className={
              isMaxCounter(value, maxStats.toolCalls)
                ? "text-red-600"
                : !isEmpty
                  ? "text-green-600"
                  : ""
            }
          >
            {formatLargeNumber(value)}
            {showDeltas && <DeltaText value={delta?.toolCalls ?? 0n} />}
          </div>
        );
      },
    },
    {
      accessorKey: "terminalCommands",
      header: "Terminal",
      sortingFn: counterSortingFn<DayStat>((row) => row.terminalCommands),
      cell: ({ row }) => {
        const value = row.original.terminalCommands;
        const delta = getDelta(row.original);
        return (
          <div>
            {formatLargeNumber(value)}
            {showDeltas && <DeltaText value={delta?.terminalCommands ?? 0n} />}
          </div>
        );
      },
    },
    {
      id: "searches",
      header: "Searches",
      sortingFn: counterSortingFn<DayStat>((row) =>
        addCounterValues(row.fileSearches, row.fileContentSearches)
      ),
      cell: ({ row }) => {
        const value = addCounterValues(
          row.original.fileSearches,
          row.original.fileContentSearches
        );
        const delta = getDelta(row.original);
        return (
          <div>
            {formatLargeNumber(value)}
            {showDeltas && <DeltaText value={delta?.searches ?? 0n} />}
          </div>
        );
      },
    },
    {
      id: "files",
      header: "Files R/A/E/D",
      sortingFn: counterSortingFn<DayStat>((row) =>
        addCounterValues(
          row.filesRead,
          row.filesAdded,
          row.filesEdited,
          row.filesDeleted
        )
      ),
      cell: ({ row }) => {
        const delta = getDelta(row.original);
        return (
          <div>
            <span>
              {formatLargeNumber(row.original.filesRead)}/
              {formatLargeNumber(row.original.filesAdded)}/
              {formatLargeNumber(row.original.filesEdited)}/
              {formatLargeNumber(row.original.filesDeleted)}
            </span>
            {showDeltas && <DeltaText value={delta?.filesTouched ?? 0n} />}
          </div>
        );
      },
    },
    {
      id: "lines",
      header: "Lines",
      sortingFn: counterSortingFn<DayStat>((row) =>
        addCounterValues(row.linesRead, row.linesEdited, row.linesAdded)
      ),
      cell: ({ row }) => {
        const delta = getDelta(row.original);
        return (
          <div>
            <span className={row.original.isEmpty ? "" : "text-blue-500"}>
              {formatLargeNumber(row.original.linesRead)}/
              {formatLargeNumber(row.original.linesEdited)}/
              {formatLargeNumber(row.original.linesAdded)}
            </span>
            {showDeltas && (
              <DeltaText
                value={addCounterValues(
                  delta?.linesRead,
                  delta?.linesEdited,
                  delta?.linesAdded
                )}
              />
            )}
          </div>
        );
      },
    },
    {
      id: "models",
      header: "Models",
      cell: ({ row }) => {
        const models =
          statsData?.stats?.[row.original.date]?.[app]?.models || [];
        return models.join(", ");
      },
    },
  ];
}

export function AppStatsTable({
  statsData,
  selectedApp,
  formatConvertedCurrency,
  period = "daily",
}: {
  statsData: StatsData;
  selectedApp: ApplicationType;
  formatConvertedCurrency: (amount: number) => string;
  period?: AnalyticsPeriod;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [showEmptyDays, setShowEmptyDays] = React.useState(true);
  const [showDeltas, setShowDeltas] = React.useState(false);

  const appStats = React.useMemo(
    () => getStatsForApplication(statsData, selectedApp, showEmptyDays, period),
    [statsData, selectedApp, showEmptyDays, period]
  );
  const deltasByDate = React.useMemo(
    () => buildDeltasWithEmptyDays(statsData, selectedApp, period),
    [statsData, selectedApp, period]
  );

  const totalsRow = React.useMemo<TotalsRow | undefined>(
    () => statsData.stats?.totals?.[selectedApp],
    [selectedApp, statsData]
  );

  const maxStats = React.useMemo(
    () =>
      appStats.reduce(
        (acc, s) => ({
          cost: Math.max(acc.cost, s.cost),
          cachedTokens:
            compareCounterValues(s.cachedTokens, acc.cachedTokens) > 0
              ? counterToBigInt(s.cachedTokens)
              : acc.cachedTokens,
          inputTokens:
            compareCounterValues(s.inputTokens, acc.inputTokens) > 0
              ? counterToBigInt(s.inputTokens)
              : acc.inputTokens,
          outputTokens:
            compareCounterValues(s.outputTokens, acc.outputTokens) > 0
              ? counterToBigInt(s.outputTokens)
              : acc.outputTokens,
          reasoningTokens:
            compareCounterValues(s.reasoningTokens, acc.reasoningTokens) > 0
              ? counterToBigInt(s.reasoningTokens)
              : acc.reasoningTokens,
          conversations:
            compareCounterValues(s.conversations, acc.conversations) > 0
              ? counterToBigInt(s.conversations)
              : acc.conversations,
          toolCalls:
            compareCounterValues(s.toolCalls, acc.toolCalls) > 0
              ? counterToBigInt(s.toolCalls)
              : acc.toolCalls,
          terminalCommands:
            compareCounterValues(s.terminalCommands, acc.terminalCommands) > 0
              ? counterToBigInt(s.terminalCommands)
              : acc.terminalCommands,
          searches: (() => {
            const searches = addCounterValues(
              s.fileSearches,
              s.fileContentSearches
            );
            return searches > acc.searches ? searches : acc.searches;
          })(),
          filesTouched: (() => {
            const filesTouched = addCounterValues(
              s.filesRead,
              s.filesAdded,
              s.filesEdited,
              s.filesDeleted
            );
            return filesTouched > acc.filesTouched
              ? filesTouched
              : acc.filesTouched;
          })(),
          linesAdded:
            compareCounterValues(s.linesAdded, acc.linesAdded) > 0
              ? counterToBigInt(s.linesAdded)
              : acc.linesAdded,
          linesEdited:
            compareCounterValues(s.linesEdited, acc.linesEdited) > 0
              ? counterToBigInt(s.linesEdited)
              : acc.linesEdited,
        }),
        {
          cost: 0,
          cachedTokens: 0n,
          inputTokens: 0n,
          outputTokens: 0n,
          reasoningTokens: 0n,
          conversations: 0n,
          toolCalls: 0n,
          terminalCommands: 0n,
          searches: 0n,
          filesTouched: 0n,
          linesAdded: 0n,
          linesEdited: 0n,
        }
      ),
    [appStats]
  );

  const columns = React.useMemo(
    () =>
      createColumns(
        maxStats,
        statsData,
        selectedApp,
        formatConvertedCurrency,
        showDeltas,
        deltasByDate,
        period
      ),
    [
      maxStats,
      statsData,
      selectedApp,
      formatConvertedCurrency,
      showDeltas,
      deltasByDate,
      period,
    ]
  );

  const models = totalsRow?.models || [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant={showEmptyDays ? "default" : "outline"}
          onClick={() => setShowEmptyDays((prev) => !prev)}
        >
          {showEmptyDays ? "Hide empty days" : "Show empty days"}
        </Button>
        <Button
          size="sm"
          variant={showDeltas ? "default" : "outline"}
          onClick={() => setShowDeltas((prev) => !prev)}
        >
          {showDeltas ? "Hide day-over-day deltas" : "Show day-over-day deltas"}
        </Button>
      </div>
      <StatsTableShell
        data={appStats}
        columns={columns}
        sorting={sorting}
        onSortingChange={setSorting}
        getRowClassName={(row) => (row.isEmpty ? "opacity-50" : "")}
        footer={
          totalsRow ? (
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium">
                  Total ({getPeriodCountLabel(appStats.length, period)})
                </TableCell>
                <TableCell className="font-mono text-amber-600 dark:text-amber-400">
                  {formatConvertedCurrency(totalsRow.cost || 0)}
                </TableCell>
                <StatsFooterMetricCells
                  totals={totalsRow}
                  lastCell={models.join(", ")}
                />
              </TableRow>
            </TableFooter>
          ) : null
        }
      />
    </div>
  );
}
