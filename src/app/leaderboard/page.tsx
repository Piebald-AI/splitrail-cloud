"use client";

import { Input } from "@/components/ui/input";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "@/components/ui/table";
import {
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Search, Upload } from "lucide-react";
import React from "react";
import { columns } from "./TableColumns";
import {
  type UserWithStatsFromAPI,
  type ApplicationType,
  PeriodType,
} from "@/types";
import { ColumnsDropdown } from "./ColumnsDropdown";
import { PeriodDropdown } from "./PeriodDropdown";
import { ApplicationDropdown } from "./ApplicationDropdown";
import { TablePagination } from "./TablePagination";
import { useSession } from "next-auth/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Code } from "@/components/ui/code";
import Link from "next/link";

export default function Leaderboard() {
  const { data: session } = useSession();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [period, setPeriod] = React.useState<PeriodType>("yearly");
  const [apps, setApps] = React.useState<ApplicationType[]>([
    "claude_code",
    "gemini_cli",
    "codex_cli",
  ]);
  const [data, setData] = React.useState<UserWithStatsFromAPI[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [userHasData, setUserHasData] = React.useState<boolean | null>(null);

  const fetchLeaderboardData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const applicationsParam = apps.join(",");
      const response = await fetch(
        `/api/leaderboard?period=${period}&applications=${applicationsParam}&sortBy=cost&sortOrder=desc&pageSize=100`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard data");
      }

      const result = await response.json();

      if (result.success) {
        const users = result.data?.users || [];
        setData(users);

        // Check if the current user has data
        if (session?.user?.username) {
          const currentUser = users.find(
            (user: UserWithStatsFromAPI) => user.username === session.user.username
          );
          setUserHasData(!!currentUser);
        }
      } else {
        throw new Error(result.error || "Failed to fetch leaderboard data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [period, apps, session?.user?.username]);

  React.useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full max-w-full">
      {/* No Data Banner */}
      {session && userHasData === false && !loading && (
        <Alert className="mb-6">
          <Upload className="h-4 w-4" />
          <AlertTitle>Get Started with Splitrail</AlertTitle>
          <AlertDescription>
            <p className="mb-3">
              You're signed in but haven't uploaded any data yet. Start tracking your development activity with the Splitrail CLI.
            </p>
            <div className="space-y-2 text-sm">
              <p className="font-medium">Quick setup:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>
                  Install Splitrail CLI from{" "}
                  <a
                    href="https://github.com/Piebald-AI/splitrail/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  Go to <Link href="/settings" className="text-primary hover:underline">Settings</Link> to create an API token
                </li>
                <li>
                  Configure CLI: <Code variant="inline">splitrail config set-token &lt;your-token&gt;</Code>
                </li>
                <li>
                  If you want to use auto-uploading, run <Code variant="inline">splitrail config auto-upload true</Code> and then run <Code variant="inline">splitrail</Code> normally. Otherwise just run <Code variant="inline">splitrail upload</Code>.
                </li>
              </ol>
              <div className="mt-3">
                <Button asChild size="sm">
                  <Link href="/settings">Get Started</Link>
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center pb-4 flex-row gap-2">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by developer name..."
            value={
              (table.getColumn("username")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("username")?.setFilterValue(event.target.value)
            }
            className="pl-10"
          />
        </div>
        <ColumnsDropdown table={table} />
        <PeriodDropdown period={period} setPeriod={setPeriod} />
        <ApplicationDropdown apps={apps} setApps={setApps} />
      </div>
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="border-r border-border last:border-r-0 text-center !p-2"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, colIndex) => (
                    <TableCell
                      key={colIndex}
                      className="border-r border-border last:border-r-0 text-center py-4"
                    >
                      <div className="h-4 bg-muted rounded animate-pulse"></div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-destructive"
                >
                  Error: {error}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50 cursor-pointer border-b border-border"
                  onClick={() =>
                    window.open(
                      `https://github.com/${row.original.username}`,
                      "_blank"
                    )
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="border-r border-border last:border-r-0 text-center py-1"
                    >
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
        </Table>
      </div>
      <TablePagination table={table} />
    </div>
  );
}
