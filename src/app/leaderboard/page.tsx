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
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, Rocket, Search } from "lucide-react";
import React from "react";
import { createColumns } from "./TableColumns";
import {
  type ApplicationType,
  type UserPreferences,
  type UserWithStats,
} from "@/types";
import { ALL_APPLICATIONS } from "@/lib/application-config";
import { ColumnsDropdown } from "./ColumnsDropdown";
import { ApplicationDropdown } from "./ApplicationDropdown";
import { TablePagination } from "./TablePagination";
import { useSession } from "next-auth/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Code } from "@/components/ui/code";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { convertCurrency } from "@/lib/currency";

export default function Leaderboard() {
  const { data: session } = useSession();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [apps, setApps] = React.useState<ApplicationType[]>(ALL_APPLICATIONS);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [usernameFilter, setUsernameFilter] = React.useState("");

  // Fetch user preferences
  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ["preferences", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error("No user session");

      const response = await fetch(`/api/user/${session.user.id}/preferences`);
      if (!response.ok) throw new Error("Failed to fetch preferences");

      const data = await response.json();
      if (data.success) {
        return data.data as UserPreferences;
      }
      throw new Error("Failed to fetch preferences");
    },
    enabled: !!session?.user?.id,
  });

  // Fetch exchange rates
  const { data: exchangeRates } = useQuery({
    queryKey: ["exchangeRates"],
    queryFn: async () => {
      const response = await fetch("/api/exchange-rates");
      const data = await response.json();
      if (data.success) {
        return data;
      }
      throw new Error("Failed to fetch exchange rates");
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "leaderboard",
      apps,
      pagination.pageIndex,
      pagination.pageSize,
      usernameFilter,
    ],
    queryFn: async () => {
      const applicationsParam = apps.join(",");
      const params = new URLSearchParams({
        applications: applicationsParam,
        sortBy: "cost",
        sortOrder: "desc",
        page: String(pagination.pageIndex + 1),
        pageSize: String(pagination.pageSize),
      });

      if (usernameFilter) {
        params.append("username", usernameFilter);
      }

      const response = await fetch(`/api/leaderboard?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard data");
      }

      const result = await response.json();

      if (result.success) {
        return result.data || { users: [], total: 0 };
      } else {
        throw new Error(result.error || "Failed to fetch leaderboard data");
      }
    },
  });

  // Separate query to check if the logged-in user has any data
  const { data: userHasData } = useQuery({
    queryKey: ["userHasData", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;

      const response = await fetch(`/api/user/${session.user.id}/stats`);

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      // Check if user has any stats data
      return result.success && result.data?.stats !== null;
    },
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - reduce refetching
  });

  // Transform data with currency conversion
  const transformedData = React.useMemo(() => {
    if (!data?.users) return [];

    const currency = preferences?.currency || "USD";

    // If no exchange rates or user wants USD, return original data
    if (
      !exchangeRates?.data ||
      !exchangeRates?.eurToUsd ||
      currency === "USD"
    ) {
      return data.users;
    }

    // Convert costs to user's preferred currency
    return data.users.map((user: UserWithStats) => ({
      ...user,
      cost: convertCurrency(
        user.cost,
        currency,
        exchangeRates.data,
        exchangeRates.eurToUsd
      ),
    }));
  }, [data, preferences, exchangeRates]);

  // Create columns with user's currency and browser locale
  const columns = React.useMemo(() => {
    const currency = preferences?.currency || "USD";
    const locale =
      typeof window !== "undefined"
        ? Array.isArray(navigator.languages) && navigator.languages.length > 0
          ? navigator.languages[0]
          : (navigator as Navigator & { language?: string }).language || "en-US"
        : "en-US";
    return createColumns(currency, locale);
  }, [preferences]);

  const table = useReactTable({
    data: transformedData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    manualPagination: true,
    manualFiltering: true,
    pageCount: data ? Math.ceil(data.total / pagination.pageSize) : -1,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  return (
    <div className="flex flex-col gap-y-8">
      <h1 className="font-bold text-3xl">Leaderboard</h1>

      {/* No Data Banner */}
      {session && userHasData === false && (
        <Alert>
          <Rocket />
          <AlertTitle>Get Started with Splitrail</AlertTitle>
          <AlertDescription>
            <p className="mb-3">
              You&apos;re signed in but haven&apos;t uploaded any data yet.
            </p>
            <div className="space-y-2 text-sm">
              <p>To get started:</p>
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
                  .
                </li>
                <li>
                  Go to{" "}
                  <Link
                    href="/settings"
                    className="text-primary hover:underline"
                  >
                    Settings
                  </Link>{" "}
                  to create an API token.
                </li>
                <li>
                  Set your API token by running{" "}
                  <Code variant="inline">
                    splitrail config set-token &lt;your-token&gt;
                  </Code>
                  .
                </li>
                <li>
                  If you want to use auto-uploading, run{" "}
                  <Code variant="inline">
                    splitrail config auto-upload true
                  </Code>{" "}
                  and then run <Code variant="inline">splitrail</Code> normally.
                  Otherwise just run{" "}
                  <Code variant="inline">splitrail upload</Code>.
                </li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="w-full max-w-full flex flex-col gap-y-4">
        <div className="flex items-center flex-row gap-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by developer name..."
              value={usernameFilter}
              onChange={(event) => {
                setUsernameFilter(event.target.value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              className="pl-10"
            />
          </div>
          <ColumnsDropdown table={table} />
          <ApplicationDropdown apps={apps} setApps={setApps} />
        </div>
        <div className="rounded-md border bg-card overflow-x-auto">
          <Table className="min-w-full text-center">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className="border-r border-border last:border-r-0 text-center !p-2"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              "flex items-center justify-center",
                              header.column.getCanSort()
                                ? "cursor-pointer gap-x-1"
                                : ""
                            )}
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
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 20 }).map((_, i) => (
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
                    Error:{" "}
                    {error instanceof Error
                      ? error.message
                      : "An error occurred"}
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
    </div>
  );
}
