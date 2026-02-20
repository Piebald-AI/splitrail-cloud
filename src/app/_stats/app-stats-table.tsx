"use client";

import * as React from "react";
import { format } from "date-fns";
import { TZDateMini } from "@date-fns/tz";
import { cn, formatLargeNumber } from "@/lib/utils";
import { ApplicationType } from "@/types";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type DayStat, type StatsData } from "./types";

const utc = (date: string) => new TZDateMini(date, "UTC");
const formatDateForDisplay = (date: string) => format(utc(date), "MM/dd/yyyy");

function getStatsForApplication(
  statsData: StatsData,
  app: ApplicationType
): DayStat[] {
  if (!statsData?.stats) return [];

  const appDates = Object.keys(statsData.stats)
    .filter((k) => k !== "totals" && k !== "grandTotal")
    .filter((date) => statsData.stats[date]?.[app]);

  if (appDates.length === 0) return [];

  const startDate = new Date(appDates.sort()[0]);

  // Fill through today so empty days are visible
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const dateRange: string[] = [];
  const cursor = new Date(startDate);
  while (cursor <= today) {
    dateRange.push(`${cursor.toISOString().split("T")[0]}T00:00:00.000Z`);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dateRange.reverse().map((date) => {
    const existing = statsData.stats[date]?.[app];
    if (existing) return { ...existing, date };

    return {
      date,
      cost: 0,
      cachedTokens: "0",
      inputTokens: "0",
      outputTokens: "0",
      reasoningTokens: "0",
      conversations: 0,
      toolCalls: "0",
      linesRead: "0",
      linesAdded: "0",
      linesEdited: "0",
      isEmpty: true,
    };
  });
}

function createColumns(
  maxStats: Record<string, number>,
  statsData: StatsData,
  app: ApplicationType,
  formatConvertedCurrency: (amount: number) => string
): ColumnDef<DayStat>[] {
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
              value === maxStats.reasoningTokens && maxStats.reasoningTokens > 0
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
        const value = Number(row.getValue("conversations") || 0);
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
      id: "lines",
      header: "Lines",
      cell: ({ row }) => (
        <span className={row.original.isEmpty ? "" : "text-blue-500"}>
          {formatLargeNumber(row.original.linesRead)}/
          {formatLargeNumber(row.original.linesEdited)}/
          {formatLargeNumber(row.original.linesAdded)}
        </span>
      ),
    },
    {
      id: "models",
      header: "Models",
      cell: ({ row }) => {
        const models = statsData?.stats?.[row.original.date]?.[app]?.models || [];
        return models.join(", ");
      },
    },
  ];
}

export function AppStatsTable({
  statsData,
  selectedApp,
  formatConvertedCurrency,
}: {
  statsData: StatsData;
  selectedApp: ApplicationType;
  formatConvertedCurrency: (amount: number) => string;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const appStats = React.useMemo(
    () => getStatsForApplication(statsData, selectedApp),
    [statsData, selectedApp]
  );

  const totalsRow = React.useMemo(
    () => statsData.stats?.totals?.[selectedApp],
    [selectedApp, statsData]
  );

  const maxStats = React.useMemo(
    () =>
      appStats.reduce(
        (acc, s) => ({
          cost: Math.max(acc.cost, s.cost),
          cachedTokens: Math.max(acc.cachedTokens, Number(s.cachedTokens)),
          inputTokens: Math.max(acc.inputTokens, Number(s.inputTokens)),
          outputTokens: Math.max(acc.outputTokens, Number(s.outputTokens)),
          reasoningTokens: Math.max(
            acc.reasoningTokens,
            Number(s.reasoningTokens || 0)
          ),
          conversations: Math.max(
            acc.conversations,
            Number(s.conversations || 0)
          ),
          toolCalls: Math.max(acc.toolCalls, Number(s.toolCalls)),
          linesAdded: Math.max(acc.linesAdded, Number(s.linesAdded)),
          linesEdited: Math.max(acc.linesEdited, Number(s.linesEdited)),
        }),
        {
          cost: 0,
          cachedTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          reasoningTokens: 0,
          conversations: 0,
          toolCalls: 0,
          linesAdded: 0,
          linesEdited: 0,
        }
      ),
    [appStats]
  );

  const columns = React.useMemo(
    () => createColumns(maxStats, statsData, selectedApp, formatConvertedCurrency),
    [maxStats, statsData, selectedApp, formatConvertedCurrency]
  );

  const table = useReactTable({
    data: appStats,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  });

  const models = totalsRow?.models || [];

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : (
                    <div
                      className={
                        header.column.getCanSort()
                          ? "cursor-pointer flex items-center gap-x-1"
                          : ""
                      }
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() === "asc" && (
                        <ChevronUp className="size-4" />
                      )}
                      {header.column.getIsSorted() === "desc" && (
                        <ChevronDown className="size-4" />
                      )}
                    </div>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={row.original.isEmpty ? "opacity-50" : ""}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {totalsRow && (
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">
                Total ({appStats.length}d)
              </TableCell>
              <TableCell className="font-mono text-amber-600 dark:text-amber-400">
                {formatConvertedCurrency(totalsRow.cost || 0)}
              </TableCell>
              <TableCell>
                {formatLargeNumber(totalsRow.cachedTokens || 0)}
              </TableCell>
              <TableCell>
                {formatLargeNumber(totalsRow.inputTokens || 0)}
              </TableCell>
              <TableCell>
                {formatLargeNumber(totalsRow.outputTokens || 0)}
              </TableCell>
              <TableCell>
                {formatLargeNumber(totalsRow.reasoningTokens || 0)}
              </TableCell>
              <TableCell>
                {formatLargeNumber(totalsRow.conversations || 0)}
              </TableCell>
              <TableCell className="text-green-600">
                {formatLargeNumber(totalsRow.toolCalls || 0)}
              </TableCell>
              <TableCell>
                {formatLargeNumber(totalsRow.linesAdded || 0)}/
                {formatLargeNumber(totalsRow.linesEdited || 0)}
              </TableCell>
              <TableCell>{models.join(", ")}</TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
