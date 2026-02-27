"use client";

import * as React from "react";
import { format } from "date-fns";
import { TZDateMini } from "@date-fns/tz";
import { cn, formatLargeNumber } from "@/lib/utils";
import { APPLICATION_LABELS } from "@/lib/application-config";
import { type ApplicationType } from "@/types";
import { Button } from "@/components/ui/button";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { TableCell, TableFooter, TableRow } from "@/components/ui/table";
import { StatsFooterMetricCells } from "./stats-footer-cells";
import { StatsTableShell } from "./stats-table-shell";
import { type StatsData } from "./types";

const utc = (date: string) => new TZDateMini(date, "UTC");
const formatDateForDisplay = (date: string) => format(utc(date), "MM/dd/yyyy");

type DayTotal = {
  date: string;
  cost: number;
  cachedTokens: number;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  conversations: number;
  toolCalls: number;
  terminalCommands: number;
  searches: number;
  filesRead: number;
  filesAdded: number;
  filesEdited: number;
  filesDeleted: number;
  linesRead: number;
  linesAdded: number;
  linesEdited: number;
  apps: string[];
  isEmpty: boolean;
};

function getAllDailyTotals(
  statsData: StatsData,
  includeEmptyDays: boolean
): DayTotal[] {
  if (!statsData?.stats) return [];

  const datKeys = Object.keys(statsData.stats).filter(
    (k) => k !== "totals" && k !== "grandTotal"
  );

  if (datKeys.length === 0) return [];

  const startDate = new Date(datKeys.sort()[0]);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const dateRange: string[] = [];
  const cursor = new Date(startDate);
  while (cursor <= today) {
    dateRange.push(`${cursor.toISOString().split("T")[0]}T00:00:00.000Z`);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dateRange
    .reverse()
    .map((date) => {
      const dayData = statsData.stats[date];
      if (!dayData) {
        return {
          date,
          cost: 0,
          cachedTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          reasoningTokens: 0,
          conversations: 0,
          toolCalls: 0,
          terminalCommands: 0,
          searches: 0,
          filesRead: 0,
          filesAdded: 0,
          filesEdited: 0,
          filesDeleted: 0,
          linesRead: 0,
          linesAdded: 0,
          linesEdited: 0,
          apps: [],
          isEmpty: true,
        };
      }

      const apps: string[] = [];
      let cost = 0,
        cachedTokens = 0,
        inputTokens = 0,
        outputTokens = 0,
        reasoningTokens = 0,
        conversations = 0,
        toolCalls = 0,
        terminalCommands = 0,
        searches = 0,
        filesRead = 0,
        filesAdded = 0,
        filesEdited = 0,
        filesDeleted = 0,
        linesRead = 0,
        linesAdded = 0,
        linesEdited = 0;

      (Object.keys(dayData) as ApplicationType[]).forEach((app) => {
        const s = dayData[app];
        if (!s || typeof s !== "object" || !("cost" in s)) return;
        if (Number(s.conversations ?? 0) > 0) apps.push(app);
        cost += s.cost ?? 0;
        cachedTokens += Number(s.cachedTokens ?? 0);
        inputTokens += Number(s.inputTokens ?? 0);
        outputTokens += Number(s.outputTokens ?? 0);
        reasoningTokens += Number(s.reasoningTokens ?? 0);
        conversations += Number(s.conversations ?? 0);
        toolCalls += Number(s.toolCalls ?? 0);
        terminalCommands += Number(s.terminalCommands ?? 0);
        searches +=
          Number(s.fileSearches ?? 0) + Number(s.fileContentSearches ?? 0);
        filesRead += Number(s.filesRead ?? 0);
        filesAdded += Number(s.filesAdded ?? 0);
        filesEdited += Number(s.filesEdited ?? 0);
        filesDeleted += Number(s.filesDeleted ?? 0);
        linesRead += Number(s.linesRead ?? 0);
        linesAdded += Number(s.linesAdded ?? 0);
        linesEdited += Number(s.linesEdited ?? 0);
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
  maxStats: Record<string, number>,
  formatConvertedCurrency: (amount: number) => string
): ColumnDef<DayTotal>[] {
  return [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDateForDisplay(row.getValue("date")),
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
      cell: ({ row }) => {
        const value = Number(row.getValue("cachedTokens"));
        return (
          <div
            className={
              value === maxStats.cachedTokens && maxStats.cachedTokens > 0
                ? "text-red-600"
                : ""
            }
          >
            {formatLargeNumber(value)}
          </div>
        );
      },
    },
    {
      accessorKey: "inputTokens",
      header: "Input Tokens",
      cell: ({ row }) => {
        const value = Number(row.getValue("inputTokens"));
        return (
          <div
            className={
              value === maxStats.inputTokens && maxStats.inputTokens > 0
                ? "text-red-600"
                : ""
            }
          >
            {formatLargeNumber(value)}
          </div>
        );
      },
    },
    {
      accessorKey: "outputTokens",
      header: "Output Tokens",
      cell: ({ row }) => {
        const value = Number(row.getValue("outputTokens"));
        return (
          <div
            className={
              value === maxStats.outputTokens && maxStats.outputTokens > 0
                ? "text-red-600"
                : ""
            }
          >
            {formatLargeNumber(value)}
          </div>
        );
      },
    },
    {
      accessorKey: "reasoningTokens",
      header: "Reasoning",
      cell: ({ row }) => {
        const value = Number(row.getValue("reasoningTokens"));
        return (
          <div
            className={
              value === maxStats.reasoningTokens &&
              maxStats.reasoningTokens > 0
                ? "text-red-600"
                : ""
            }
          >
            {formatLargeNumber(value)}
          </div>
        );
      },
    },
    {
      accessorKey: "conversations",
      header: "Conversations",
      cell: ({ row }) => {
        const value = Number(row.getValue("conversations"));
        return (
          <div
            className={
              value === maxStats.conversations && maxStats.conversations > 0
                ? "text-red-600"
                : ""
            }
          >
            {formatLargeNumber(value)}
          </div>
        );
      },
    },
    {
      accessorKey: "toolCalls",
      header: "Tool Calls",
      cell: ({ row }) => {
        const value = Number(row.getValue("toolCalls"));
        const isEmpty = row.original.isEmpty;
        return (
          <div
            className={
              value === maxStats.toolCalls && maxStats.toolCalls > 0
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
      cell: ({ row }) => formatLargeNumber(Number(row.getValue("terminalCommands"))),
    },
    {
      accessorKey: "searches",
      header: "Searches",
      cell: ({ row }) => formatLargeNumber(Number(row.getValue("searches"))),
    },
    {
      id: "files",
      header: "Files R/A/E/D",
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
}: {
  statsData: StatsData;
  formatConvertedCurrency: (amount: number) => string;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [showEmptyDays, setShowEmptyDays] = React.useState(false);

  const rows = React.useMemo(
    () => getAllDailyTotals(statsData, showEmptyDays),
    [statsData, showEmptyDays]
  );

  const grandTotal = statsData.stats?.grandTotal;

  const maxStats = React.useMemo(
    () =>
      rows.reduce(
        (acc, s) => ({
          cost: Math.max(acc.cost, s.cost),
          cachedTokens: Math.max(acc.cachedTokens, s.cachedTokens),
          inputTokens: Math.max(acc.inputTokens, s.inputTokens),
          outputTokens: Math.max(acc.outputTokens, s.outputTokens),
          reasoningTokens: Math.max(acc.reasoningTokens, s.reasoningTokens),
          conversations: Math.max(acc.conversations, s.conversations),
          toolCalls: Math.max(acc.toolCalls, s.toolCalls),
        }),
        {
          cost: 0,
          cachedTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          reasoningTokens: 0,
          conversations: 0,
          toolCalls: 0,
        }
      ),
    [rows]
  );

  const columns = React.useMemo(
    () => createColumns(maxStats, formatConvertedCurrency),
    [maxStats, formatConvertedCurrency]
  );

  if (rows.length === 0 && !showEmptyDays) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Daily breakdown — all sources
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
                  Total ({grandTotal.daysTracked}d)
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
