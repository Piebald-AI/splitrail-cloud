"use client";

import * as React from "react";
import { format } from "date-fns";
import { TZDateMini } from "@date-fns/tz";
import { cn, formatLargeNumber } from "@/lib/utils";
import { ApplicationType } from "@/types";
import { Button } from "@/components/ui/button";
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
const toUtcDayKey = (date: Date) => `${date.toISOString().split("T")[0]}T00:00:00.000Z`;

type DayDelta = {
  cost: number;
  cachedTokens: number;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  conversations: number;
  toolCalls: number;
  terminalCommands: number;
  searches: number;
  filesTouched: number;
  linesRead: number;
  linesEdited: number;
  linesAdded: number;
};

function getStatsForApplication(
  statsData: StatsData,
  app: ApplicationType,
  includeEmptyDays: boolean
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
      terminalCommands: "0",
      fileSearches: "0",
      fileContentSearches: "0",
      filesRead: "0",
      filesAdded: "0",
      filesEdited: "0",
      filesDeleted: "0",
      linesRead: "0",
      linesAdded: "0",
      linesEdited: "0",
      isEmpty: true,
    };
  }).filter((stat) => includeEmptyDays || !stat.isEmpty);
}

function buildDeltasWithEmptyDays(
  statsData: StatsData,
  app: ApplicationType
): Record<string, DayDelta> {
  const withEmptyDays = getStatsForApplication(statsData, app, true);
  const deltas: Record<string, DayDelta> = {};

  withEmptyDays.forEach((current, index) => {
    const previous = withEmptyDays[index + 1];
    const currentSearches =
      Number(current.fileSearches ?? 0) + Number(current.fileContentSearches ?? 0);
    const previousSearches = previous
      ? Number(previous.fileSearches ?? 0) + Number(previous.fileContentSearches ?? 0)
      : 0;
    const currentFilesTouched =
      Number(current.filesRead ?? 0) +
      Number(current.filesAdded ?? 0) +
      Number(current.filesEdited ?? 0) +
      Number(current.filesDeleted ?? 0);
    const previousFilesTouched = previous
      ? Number(previous.filesRead ?? 0) +
        Number(previous.filesAdded ?? 0) +
        Number(previous.filesEdited ?? 0) +
        Number(previous.filesDeleted ?? 0)
      : 0;

    deltas[current.date] = {
      cost: current.cost - (previous?.cost ?? 0),
      cachedTokens: Number(current.cachedTokens) - Number(previous?.cachedTokens ?? 0),
      inputTokens: Number(current.inputTokens) - Number(previous?.inputTokens ?? 0),
      outputTokens: Number(current.outputTokens) - Number(previous?.outputTokens ?? 0),
      reasoningTokens:
        Number(current.reasoningTokens) - Number(previous?.reasoningTokens ?? 0),
      conversations:
        Number(current.conversations ?? 0) - Number(previous?.conversations ?? 0),
      toolCalls: Number(current.toolCalls) - Number(previous?.toolCalls ?? 0),
      terminalCommands:
        Number(current.terminalCommands ?? 0) - Number(previous?.terminalCommands ?? 0),
      searches: currentSearches - previousSearches,
      filesTouched: currentFilesTouched - previousFilesTouched,
      linesRead: Number(current.linesRead) - Number(previous?.linesRead ?? 0),
      linesEdited: Number(current.linesEdited) - Number(previous?.linesEdited ?? 0),
      linesAdded: Number(current.linesAdded) - Number(previous?.linesAdded ?? 0),
    };
  });

  return deltas;
}

function formatDelta(value: number): string {
  if (value === 0) return "0";
  return `${value > 0 ? "+" : ""}${formatLargeNumber(value)}`;
}

function DeltaText({
  value,
  kind = "number",
}: {
  value: number;
  kind?: "number" | "currency";
}) {
  if (value === 0) return null;

  return (
    <div
      className={cn(
        "text-[11px]",
        value > 0
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-rose-600 dark:text-rose-400"
      )}
    >
      {kind === "currency" ? (value > 0 ? "+" : "") : ""}
      {kind === "currency" ? value.toFixed(2) : formatDelta(value)}
    </div>
  );
}

function createColumns(
  maxStats: Record<string, number>,
  statsData: StatsData,
  app: ApplicationType,
  formatConvertedCurrency: (amount: number) => string,
  showDeltas: boolean,
  deltasByDate: Record<string, DayDelta>
): ColumnDef<DayStat>[] {
  const getDelta = (row: DayStat) => deltasByDate[row.date];

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
            {showDeltas && <DeltaText value={delta?.cost ?? 0} kind="currency" />}
          </div>
        );
      },
    },
    {
      accessorKey: "cachedTokens",
      header: "Cached Tokens",
      cell: ({ row }) => {
        const value = Number(row.getValue("cachedTokens"));
        const delta = getDelta(row.original);
        return (
          <div
            className={
              value === maxStats.cachedTokens && maxStats.cachedTokens > 0
                ? "text-red-600"
                : ""
            }
          >
            {formatLargeNumber(value)}
            {showDeltas && <DeltaText value={delta?.cachedTokens ?? 0} />}
          </div>
        );
      },
    },
    {
      accessorKey: "inputTokens",
      header: "Input Tokens",
      cell: ({ row }) => {
        const value = Number(row.getValue("inputTokens"));
        const delta = getDelta(row.original);
        return (
          <div
            className={
              value === maxStats.inputTokens && maxStats.inputTokens > 0
                ? "text-red-600"
                : ""
            }
          >
            {formatLargeNumber(value)}
            {showDeltas && <DeltaText value={delta?.inputTokens ?? 0} />}
          </div>
        );
      },
    },
    {
      accessorKey: "outputTokens",
      header: "Output Tokens",
      cell: ({ row }) => {
        const value = Number(row.getValue("outputTokens"));
        const delta = getDelta(row.original);
        return (
          <div
            className={
              value === maxStats.outputTokens && maxStats.outputTokens > 0
                ? "text-red-600"
                : ""
            }
          >
            {formatLargeNumber(value)}
            {showDeltas && <DeltaText value={delta?.outputTokens ?? 0} />}
          </div>
        );
      },
    },
    {
      accessorKey: "reasoningTokens",
      header: "Reasoning",
      cell: ({ row }) => {
        const value = Number(row.getValue("reasoningTokens"));
        const delta = getDelta(row.original);
        return (
          <div
            className={
              value === maxStats.reasoningTokens && maxStats.reasoningTokens > 0
                ? "text-red-600"
                : ""
            }
          >
            {formatLargeNumber(value)}
            {showDeltas && <DeltaText value={delta?.reasoningTokens ?? 0} />}
          </div>
        );
      },
    },
    {
      accessorKey: "conversations",
      header: "Conversations",
      cell: ({ row }) => {
        const value = Number(row.getValue("conversations") || 0);
        const delta = getDelta(row.original);
        return (
          <div
            className={
              value === maxStats.conversations && maxStats.conversations > 0
                ? "text-red-600"
                : ""
            }
          >
            {formatLargeNumber(value)}
            {showDeltas && <DeltaText value={delta?.conversations ?? 0} />}
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
        const delta = getDelta(row.original);
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
            {showDeltas && <DeltaText value={delta?.toolCalls ?? 0} />}
          </div>
        );
      },
    },
    {
      accessorKey: "terminalCommands",
      header: "Terminal",
      cell: ({ row }) => {
        const value = Number(row.getValue("terminalCommands") ?? 0);
        const delta = getDelta(row.original);
        return (
          <div>
            {formatLargeNumber(value)}
            {showDeltas && <DeltaText value={delta?.terminalCommands ?? 0} />}
          </div>
        );
      },
    },
    {
      id: "searches",
      header: "Searches",
      cell: ({ row }) => {
        const value =
          Number(row.original.fileSearches ?? 0) +
          Number(row.original.fileContentSearches ?? 0);
        const delta = getDelta(row.original);
        return (
          <div>
            {formatLargeNumber(value)}
            {showDeltas && <DeltaText value={delta?.searches ?? 0} />}
          </div>
        );
      },
    },
    {
      id: "files",
      header: "Files R/A/E/D",
      cell: ({ row }) => {
        const filesRead = Number(row.original.filesRead ?? 0);
        const filesAdded = Number(row.original.filesAdded ?? 0);
        const filesEdited = Number(row.original.filesEdited ?? 0);
        const filesDeleted = Number(row.original.filesDeleted ?? 0);
        const delta = getDelta(row.original);
        return (
          <div>
            <span>
              {formatLargeNumber(filesRead)}/{formatLargeNumber(filesAdded)}/
              {formatLargeNumber(filesEdited)}/{formatLargeNumber(filesDeleted)}
            </span>
            {showDeltas && <DeltaText value={delta?.filesTouched ?? 0} />}
          </div>
        );
      },
    },
    {
      id: "lines",
      header: "Lines",
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
                value={
                  (delta?.linesRead ?? 0) +
                  (delta?.linesEdited ?? 0) +
                  (delta?.linesAdded ?? 0)
                }
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
  const [showEmptyDays, setShowEmptyDays] = React.useState(true);
  const [showDeltas, setShowDeltas] = React.useState(false);

  const appStats = React.useMemo(
    () => getStatsForApplication(statsData, selectedApp, showEmptyDays),
    [statsData, selectedApp, showEmptyDays]
  );
  const deltasByDate = React.useMemo(
    () => buildDeltasWithEmptyDays(statsData, selectedApp),
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
          terminalCommands: Math.max(
            acc.terminalCommands,
            Number(s.terminalCommands || 0)
          ),
          searches: Math.max(
            acc.searches,
            Number(s.fileSearches || 0) + Number(s.fileContentSearches || 0)
          ),
          filesTouched: Math.max(
            acc.filesTouched,
            Number(s.filesRead || 0) +
              Number(s.filesAdded || 0) +
              Number(s.filesEdited || 0) +
              Number(s.filesDeleted || 0)
          ),
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
          terminalCommands: 0,
          searches: 0,
          filesTouched: 0,
          linesAdded: 0,
          linesEdited: 0,
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
        deltasByDate
      ),
    [
      maxStats,
      statsData,
      selectedApp,
      formatConvertedCurrency,
      showDeltas,
      deltasByDate,
    ]
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
                {formatLargeNumber(totalsRow.terminalCommands || 0)}
              </TableCell>
              <TableCell>
                {formatLargeNumber(
                  Number(totalsRow.fileSearches || 0) +
                    Number(totalsRow.fileContentSearches || 0)
                )}
              </TableCell>
              <TableCell>
                {formatLargeNumber(totalsRow.filesRead || 0)}/
                {formatLargeNumber(totalsRow.filesAdded || 0)}/
                {formatLargeNumber(totalsRow.filesEdited || 0)}/
                {formatLargeNumber(totalsRow.filesDeleted || 0)}
              </TableCell>
              <TableCell>
                {formatLargeNumber(totalsRow.linesRead || 0)}/
                {formatLargeNumber(totalsRow.linesAdded || 0)}/
                {formatLargeNumber(totalsRow.linesEdited || 0)}
              </TableCell>
              <TableCell>{models.join(", ")}</TableCell>
            </TableRow>
          </TableFooter>
        )}
        </Table>
      </div>
    </div>
  );
}
