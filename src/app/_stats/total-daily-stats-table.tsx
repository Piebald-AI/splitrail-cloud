"use client";

import * as React from "react";
import { cn, formatLargeNumber } from "@/lib/utils";
import { APPLICATION_LABELS } from "@/lib/application-config";
import { type ApplicationType } from "@/types";
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
  type AnalyticsPeriod,
  type CounterInput,
  type StatsData,
} from "@/app/_stats/types";
import {
  addPeriod,
  formatDateForDisplay,
  getDateHoverText,
  getPeriodCountLabel,
  getPeriodLabel,
} from "@/app/_stats/date-helpers";
import { getPeriodStartForDate } from "@/lib/dateUtils";

type DayTotal = {
  date: string;
  cost: number;
  cachedTokens: bigint;
  inputTokens: bigint;
  outputTokens: bigint;
  reasoningTokens: bigint;
  conversations: bigint;
  toolCalls: bigint;
  terminalCommands: bigint;
  searches: bigint;
  filesRead: bigint;
  filesAdded: bigint;
  filesEdited: bigint;
  filesDeleted: bigint;
  linesRead: bigint;
  linesAdded: bigint;
  linesEdited: bigint;
  apps: string[];
  isEmpty: boolean;
};

function getAllDailyTotals(
  statsData: StatsData,
  includeEmptyDays: boolean,
  period: AnalyticsPeriod
): DayTotal[] {
  if (!statsData?.stats) return [];

  const dateStats = statsData.stats.dateStats;
  const datKeys = Object.keys(dateStats);

  if (datKeys.length === 0) return [];

  const startDate = getPeriodStartForDate(period, new Date(datKeys.sort()[0]));
  const today = getPeriodStartForDate(period, new Date());

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
      const dayData = dateStats[date];
      if (!dayData) {
        return {
          date,
          cost: 0,
          cachedTokens: 0n,
          inputTokens: 0n,
          outputTokens: 0n,
          reasoningTokens: 0n,
          conversations: 0n,
          toolCalls: 0n,
          terminalCommands: 0n,
          searches: 0n,
          filesRead: 0n,
          filesAdded: 0n,
          filesEdited: 0n,
          filesDeleted: 0n,
          linesRead: 0n,
          linesAdded: 0n,
          linesEdited: 0n,
          apps: [],
          isEmpty: true,
        };
      }

      const apps: string[] = [];
      let cost = 0,
        cachedTokens = 0n,
        inputTokens = 0n,
        outputTokens = 0n,
        reasoningTokens = 0n,
        conversations = 0n,
        toolCalls = 0n,
        terminalCommands = 0n,
        searches = 0n,
        filesRead = 0n,
        filesAdded = 0n,
        filesEdited = 0n,
        filesDeleted = 0n,
        linesRead = 0n,
        linesAdded = 0n,
        linesEdited = 0n;

      (Object.keys(dayData) as ApplicationType[]).forEach((app) => {
        const s = dayData[app];
        if (!s || typeof s !== "object" || !("cost" in s)) return;
        const hasActivity =
          isPositiveCounter(s.conversations) ||
          (s.cost ?? 0) > 0 ||
          isPositiveCounter(s.toolCalls) ||
          isPositiveCounter(s.terminalCommands) ||
          isPositiveCounter(addCounterValues(s.fileSearches, s.fileContentSearches)) ||
          isPositiveCounter(
            addCounterValues(
              s.filesRead,
              s.filesAdded,
              s.filesEdited,
              s.filesDeleted
            )
          ) ||
          isPositiveCounter(
            addCounterValues(s.linesRead, s.linesAdded, s.linesEdited)
          ) ||
          isPositiveCounter(addCounterValues(s.inputTokens, s.outputTokens)) ||
          isPositiveCounter(s.cachedTokens) ||
          isPositiveCounter(s.reasoningTokens);
        if (hasActivity) apps.push(app);
        cost += s.cost ?? 0;
        cachedTokens += counterToBigInt(s.cachedTokens);
        inputTokens += counterToBigInt(s.inputTokens);
        outputTokens += counterToBigInt(s.outputTokens);
        reasoningTokens += counterToBigInt(s.reasoningTokens);
        conversations += counterToBigInt(s.conversations);
        toolCalls += counterToBigInt(s.toolCalls);
        terminalCommands += counterToBigInt(s.terminalCommands);
        searches += addCounterValues(s.fileSearches, s.fileContentSearches);
        filesRead += counterToBigInt(s.filesRead);
        filesAdded += counterToBigInt(s.filesAdded);
        filesEdited += counterToBigInt(s.filesEdited);
        filesDeleted += counterToBigInt(s.filesDeleted);
        linesRead += counterToBigInt(s.linesRead);
        linesAdded += counterToBigInt(s.linesAdded);
        linesEdited += counterToBigInt(s.linesEdited);
      });

      return {
        date,
        cost,
        cachedTokens,
        inputTokens,
        outputTokens,
        reasoningTokens,
        conversations,
        toolCalls,
        terminalCommands,
        searches,
        filesRead,
        filesAdded,
        filesEdited,
        filesDeleted,
        linesRead,
        linesAdded,
        linesEdited,
        apps,
        isEmpty: apps.length === 0,
      };
    })
    .filter((d) => includeEmptyDays || !d.isEmpty);
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
  },
  formatConvertedCurrency: (amount: number) => string,
  period: AnalyticsPeriod
): ColumnDef<DayTotal>[] {
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
          </div>
        );
      },
    },
    {
      accessorKey: "cachedTokens",
      header: "Cached Tokens",
      sortingFn: counterSortingFn<DayTotal>((row) => row.cachedTokens),
      cell: ({ row }) => {
        const value = row.original.cachedTokens;
        return (
          <div
            className={isMaxCounter(value, maxStats.cachedTokens) ? "text-red-600" : ""}
          >
            {formatLargeNumber(value)}
          </div>
        );
      },
    },
    {
      accessorKey: "inputTokens",
      header: "Input Tokens",
      sortingFn: counterSortingFn<DayTotal>((row) => row.inputTokens),
      cell: ({ row }) => {
        const value = row.original.inputTokens;
        return (
          <div
            className={isMaxCounter(value, maxStats.inputTokens) ? "text-red-600" : ""}
          >
            {formatLargeNumber(value)}
          </div>
        );
      },
    },
    {
      accessorKey: "outputTokens",
      header: "Output Tokens",
      sortingFn: counterSortingFn<DayTotal>((row) => row.outputTokens),
      cell: ({ row }) => {
        const value = row.original.outputTokens;
        return (
          <div
            className={isMaxCounter(value, maxStats.outputTokens) ? "text-red-600" : ""}
          >
            {formatLargeNumber(value)}
          </div>
        );
      },
    },
    {
      accessorKey: "reasoningTokens",
      header: "Reasoning",
      sortingFn: counterSortingFn<DayTotal>((row) => row.reasoningTokens),
      cell: ({ row }) => {
        const value = row.original.reasoningTokens;
        return (
          <div
            className={isMaxCounter(value, maxStats.reasoningTokens) ? "text-red-600" : ""}
          >
            {formatLargeNumber(value)}
          </div>
        );
      },
    },
    {
      accessorKey: "conversations",
      header: "Conversations",
      sortingFn: counterSortingFn<DayTotal>((row) => row.conversations),
      cell: ({ row }) => {
        const value = row.original.conversations;
        return (
          <div
            className={isMaxCounter(value, maxStats.conversations) ? "text-red-600" : ""}
          >
            {formatLargeNumber(value)}
          </div>
        );
      },
    },
    {
      accessorKey: "toolCalls",
      header: "Tool Calls",
      sortingFn: counterSortingFn<DayTotal>((row) => row.toolCalls),
      cell: ({ row }) => {
        const value = row.original.toolCalls;
        const isEmpty = row.original.isEmpty;
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
          </div>
        );
      },
    },
    {
      accessorKey: "terminalCommands",
      header: "Terminal",
      sortingFn: counterSortingFn<DayTotal>((row) => row.terminalCommands),
      cell: ({ row }) => formatLargeNumber(row.original.terminalCommands),
    },
    {
      accessorKey: "searches",
      header: "Searches",
      sortingFn: counterSortingFn<DayTotal>((row) => row.searches),
      cell: ({ row }) => formatLargeNumber(row.original.searches),
    },
    {
      id: "files",
      header: "Files R/A/E/D",
      sortingFn: counterSortingFn<DayTotal>((row) =>
        addCounterValues(
          row.filesRead,
          row.filesAdded,
          row.filesEdited,
          row.filesDeleted
        )
      ),
      cell: ({ row }) => (
        <span>
          {formatLargeNumber(row.original.filesRead)}/
          {formatLargeNumber(row.original.filesAdded)}/
          {formatLargeNumber(row.original.filesEdited)}/
          {formatLargeNumber(row.original.filesDeleted)}
        </span>
      ),
    },
    {
      id: "lines",
      header: "Lines R/+/~",
      sortingFn: counterSortingFn<DayTotal>((row) =>
        addCounterValues(row.linesRead, row.linesAdded, row.linesEdited)
      ),
      cell: ({ row }) => (
        <span className={row.original.isEmpty ? "" : "text-blue-500"}>
          {formatLargeNumber(row.original.linesRead)}/
          {formatLargeNumber(row.original.linesAdded)}/
          {formatLargeNumber(row.original.linesEdited)}
        </span>
      ),
    },
    {
      id: "sources",
      header: "Sources",
      cell: ({ row }) =>
        row.original.apps
          .map((a) => APPLICATION_LABELS[a as ApplicationType] ?? a)
          .join(", "),
    },
  ];
}

export function TotalDailyStatsTable({
  statsData,
  formatConvertedCurrency,
  period = "daily",
}: {
  statsData: StatsData;
  formatConvertedCurrency: (amount: number) => string;
  period?: AnalyticsPeriod;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [showEmptyDays, setShowEmptyDays] = React.useState(false);

  const rows = React.useMemo(
    () => getAllDailyTotals(statsData, showEmptyDays, period),
    [statsData, showEmptyDays, period]
  );

  const grandTotal = statsData.stats?.grandTotal;

  const maxStats = React.useMemo(
    () =>
      rows.reduce(
        (acc, s) => ({
          cost: Math.max(acc.cost, s.cost),
          cachedTokens: s.cachedTokens > acc.cachedTokens ? s.cachedTokens : acc.cachedTokens,
          inputTokens: s.inputTokens > acc.inputTokens ? s.inputTokens : acc.inputTokens,
          outputTokens: s.outputTokens > acc.outputTokens ? s.outputTokens : acc.outputTokens,
          reasoningTokens:
            s.reasoningTokens > acc.reasoningTokens
              ? s.reasoningTokens
              : acc.reasoningTokens,
          conversations:
            s.conversations > acc.conversations
              ? s.conversations
              : acc.conversations,
          toolCalls: s.toolCalls > acc.toolCalls ? s.toolCalls : acc.toolCalls,
        }),
        {
          cost: 0,
          cachedTokens: 0n,
          inputTokens: 0n,
          outputTokens: 0n,
          reasoningTokens: 0n,
          conversations: 0n,
          toolCalls: 0n,
        }
      ),
    [rows]
  );

  const columns = React.useMemo(
    () => createColumns(maxStats, formatConvertedCurrency, period),
    [maxStats, formatConvertedCurrency, period]
  );

  if (rows.length === 0 && !showEmptyDays) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          {getPeriodLabel(period)} breakdown — all sources
        </span>
        <Button
          size="sm"
          variant={showEmptyDays ? "default" : "outline"}
          onClick={() => setShowEmptyDays((prev) => !prev)}
        >
          {showEmptyDays ? "Hide empty days" : "Show empty days"}
        </Button>
      </div>
      <StatsTableShell
        data={rows}
        columns={columns}
        sorting={sorting}
        onSortingChange={setSorting}
        getRowClassName={(row) => (row.isEmpty ? "opacity-50" : "")}
        footer={
          grandTotal ? (
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium">
                  Total ({getPeriodCountLabel(rows.length, period)})
                </TableCell>
                <TableCell className="font-mono text-amber-600 dark:text-amber-400">
                  {formatConvertedCurrency(grandTotal.cost ?? 0)}
                </TableCell>
                <StatsFooterMetricCells
                  totals={grandTotal}
                  lastCell={grandTotal.applications
                    ?.map((a) => APPLICATION_LABELS[a as ApplicationType] ?? a)
                    .join(", ")}
                />
              </TableRow>
            </TableFooter>
          ) : null
        }
      />
    </div>
  );
}
