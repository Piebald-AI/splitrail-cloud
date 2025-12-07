"use client";

import { useSession } from "next-auth/react";
import { formatCurrency, formatDate, formatLargeNumber } from "@/lib/utils";
import { format } from "date-fns";
import { TZDateMini } from "@date-fns/tz";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ApplicationType, type UserPreferences } from "@/types";
import { ALL_APPLICATIONS, APPLICATION_LABELS } from "@/lib/application-config";
import { type User } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as React from "react";
import { convertCurrency } from "@/lib/currency";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";

type DayStat = {
  date: string;
  cost: number;
  cachedTokens: string;
  inputTokens: string;
  outputTokens: string;
  reasoningTokens: string;
  conversations: string | number;
  toolCalls: string;
  linesRead: string;
  linesAdded: string;
  linesEdited: string;
  models?: string[];
  isEmpty?: boolean;
};

type StatsData = {
  stats: Record<string, Record<string, DayStat>> & {
    totals: Record<string, DayStat>;
    grandTotal: {
      daysTracked: number;
      numApps: number;
      applications: string[];
      cost: number;
      inputTokens: number;
      outputTokens: number;
      cachedTokens: number;
      reasoningTokens: number;
      tokens: number;
      conversations: number;
      firstDate: string;
      lastDate: string;
      toolCalls: number;
      linesRead: number;
      linesAdded: number;
      linesEdited: number;
    };
  };
};
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarCheck,
  CircleDollarSign,
  Hammer,
  LucideIcon,
  SquareTerminal,
  WholeWord,
} from "lucide-react";
import { Code } from "@/components/ui/code";
import Link from "next/link";

// Note: We interpret dates from `/api/user/[userId]/stats` as UTC because we're
// only formatting the date; the dates from the server don't really have times, so
// timezone means nothing, and if we use timezones that subtract from UTC, the date
// will be for the previous day.
const utc = (date: string) => new TZDateMini(date, "UTC");

const formatDateForDisplay = (date: string) => {
  return format(utc(date), "MM/dd/yyyy");
};

// Column definitions outside component to avoid re-renders
const createColumns = (
  maxStats: Record<string, number>,
  statsData: StatsData | undefined,
  app: ApplicationType,
  formatConvertedCurrency: (amount: number) => string
): ColumnDef<DayStat>[] => [
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
          className={
            cost > 0
              ? `text-yellow-500 ${cost === maxStats.cost ? "!text-red-600" : ""}`
              : ""
          }
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

const StatCard = ({
  Icon,
  label,
  value,
  info,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  info?: string;
}) => (
  <Card className="w-full">
    <CardContent className="flex flex-col gap-y-2">
      <h4 className="flex items-center gap-x-1.5 text-[0.9375rem]">
        <Icon className="size-4.5 mb-0.5" />
        {label}
      </h4>
      <p className="text-2xl font-bold">{value}</p>
      {info && (
        <p className="text-sm font-normal text-muted-foreground">{info}</p>
      )}
    </CardContent>
  </Card>
);

export default function StatsPage() {
  const { data: session, status } = useSession();

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

  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["profile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error("No user session");

      const response = await fetch(`/api/user/${session.user.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch profile data");
      }

      const data = await response.json();
      if (data.success) {
        return data.data as User;
      } else {
        throw new Error(data.error || "Failed to fetch profile data");
      }
    },
    enabled: !!session?.user?.id,
  });

  const { data: statsData } = useQuery({
    queryKey: ["userStats", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error("No user session");

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await fetch(
        `/api/user/${session.user.id}/stats?timezone=${encodeURIComponent(timezone)}`
      );
      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      if (data.success) {
        return data.data as StatsData;
      }
      throw new Error("Failed to fetch stats");
    },
    enabled: !!session?.user?.id,
  });

  const grandTotalStats = statsData?.stats?.grandTotal;

  // Helper function to format currency with conversion
  const formatConvertedCurrency = React.useCallback(
    (amount: number) => {
      const currency = preferences?.currency || "USD";
      // Use browser locale on client; fallback to en-US on server
      const locale =
        typeof window !== "undefined"
          ? Array.isArray(navigator.languages) && navigator.languages.length > 0
            ? navigator.languages[0]
            : (navigator as Navigator & { language?: string }).language ||
              "en-US"
          : "en-US";

      // If no exchange rates or user wants USD, use regular formatting
      if (
        !exchangeRates?.data ||
        !exchangeRates?.eurToUsd ||
        currency === "USD"
      ) {
        return formatCurrency(amount, currency, locale);
      }

      // Convert and format
      const convertedAmount = convertCurrency(
        amount,
        currency,
        exchangeRates.data,
        exchangeRates.eurToUsd
      );
      return formatCurrency(convertedAmount, currency, locale);
    },
    [preferences, exchangeRates]
  );

  const applications = ALL_APPLICATIONS;
  const applicationNames = APPLICATION_LABELS;

  // State for selected application and sorting
  const [selectedApp, setSelectedApp] =
    React.useState<ApplicationType>("claude_code");
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const getStatsForApplication = React.useCallback(
    (app: ApplicationType) => {
      if (!statsData?.stats) return [];

      // Get all dates that have data for this specific application
      const appDates = Object.keys(statsData.stats)
        .filter((k) => k !== "totals" && k !== "grandTotal")
        .filter((date) => statsData.stats[date]?.[app]);

      if (appDates.length === 0) return [];

      // Sort dates to find the range for this specific application
      const sortedDates = appDates.sort();
      const startDate = new Date(sortedDates[0]);

      // End date should be today, not the last day with data
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Generate all dates in the range from first data to today
      const dateRange: string[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= today) {
        // Ensure consistent UTC midnight format to match API keys
        dateRange.push(
          `${currentDate.toISOString().split("T")[0]}T00:00:00.000Z`
        );
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }

      // Create stats array with zeros for missing days
      return dateRange.reverse().map((date) => {
        const existingStats = statsData.stats[date]?.[app];

        if (existingStats) {
          return {
            ...existingStats,
            date,
          };
        }

        // Return zero values for missing days
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
    },
    [statsData]
  );

  // Memoize stats calculation for selected application
  const appStats = React.useMemo(
    () => getStatsForApplication(selectedApp),
    [selectedApp, getStatsForApplication]
  );

  // Memoize totals row for selected application
  const totalsRow = React.useMemo(
    () => statsData?.stats?.totals?.[selectedApp],
    [selectedApp, statsData]
  );

  // Memoize max stats calculation
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

  // Memoize columns creation
  const columns = React.useMemo(
    () =>
      createColumns(maxStats, statsData, selectedApp, formatConvertedCurrency),
    [maxStats, statsData, selectedApp, formatConvertedCurrency]
  );

  const table = useReactTable({
    data: appStats,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  if (status === "loading" || profileLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile</h1>
          <p className="text-muted-foreground">
            Please sign in to view your profile.
          </p>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-destructive">
            Error:{" "}
            {profileError instanceof Error
              ? profileError.message
              : "An error occurred"}
          </p>
          <Button onClick={() => window.location.reload()} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile</h1>
          <p className="text-muted-foreground">
            No profile data found. Start using Claude Code / Codex CLI / Gemini
            CLI / Qwen Code / Cline / Roo Code / Kilo Code / GitHub Copilot /
            OpenCode / Pi Agent with Splitrail to see your stats!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-6">
      {/* Header */}
      {/* <div>
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={profileData.avatarUrl || undefined}
              alt={profileData.displayName || profileData.username}
            />
            <AvatarFallback className="text-xl font-medium">
              {(profileData.displayName || profileData.username)
                .charAt(0)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">
              {profileData.displayName || profileData.username}
            </h1>
            <p className="text-muted-foreground">@{profileData.username}</p>
            <p className="text-sm text-muted-foreground">
              Member since {formatDate(profileData.createdAt, "MMMM yyyy")}
            </p>
          </div>
        </div>
      </div> */}

      <div className="flex flex-col gap-y-8">
        <div className="flex flex-col gap-y-3">
          <h2 className="text-3xl font-bold">
            Your Agentic Development Tool Activity
          </h2>
          <p>
            <Link className="text-primary" href="/leaderboard">
              View{preferences?.publicProfile && " on"} the Leaderboard.
            </Link>
          </p>
        </div>
        {grandTotalStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              Icon={WholeWord}
              label="Tokens"
              value={formatLargeNumber(grandTotalStats.tokens)}
              info={`${formatLargeNumber(
                grandTotalStats.tokens / grandTotalStats.daysTracked
              )}/day`}
            />
            <StatCard
              Icon={CircleDollarSign}
              label="Cost"
              value={formatConvertedCurrency(grandTotalStats.cost)}
              info={`${formatConvertedCurrency(
                grandTotalStats.cost / grandTotalStats.daysTracked
              )}/day`}
            />
            <StatCard
              Icon={Hammer}
              label="Tool Calls"
              value={formatLargeNumber(grandTotalStats.toolCalls)}
              info={`${formatLargeNumber(
                grandTotalStats.toolCalls / grandTotalStats.daysTracked
              )}/day`}
            />
            <StatCard
              Icon={CalendarCheck}
              label="Days Tracked"
              value={formatLargeNumber(grandTotalStats.daysTracked)}
              info={`${formatDate(utc(grandTotalStats.firstDate), "MMM d, yyyy")} - ${formatDate(
                utc(grandTotalStats.lastDate),
                "MMM d, yyyy"
              )}`}
            />
            <StatCard
              Icon={SquareTerminal}
              label="Applications"
              value={formatLargeNumber(grandTotalStats.numApps)}
              info={
                grandTotalStats.applications
                  .map(
                    (app) =>
                      applicationNames[app as keyof typeof applicationNames]
                  )
                  .join(", ") || ""
              }
            />
          </div>
        )}

        {(() => {
          // Check if stats is null (no data from server)
          if (statsData?.stats === null) {
            return (
              <div className="space-y-2">
                <p>
                  You don&rsquo;t have any agentic development tool data. Once
                  you start using Claude Code / Codex CLI / Gemini CLI / Qwen
                  Code / Cline / Roo Code / Kilo Code / GitHub Copilot /
                  OpenCode / Pi Agent, you can get started by following these
                  steps:
                </p>
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
                      splitrail config set api-token &lt;your-token&gt;
                    </Code>
                    .
                  </li>
                  <li>
                    If you want to use auto-uploading, run{" "}
                    <Code variant="inline">
                      splitrail config auto-upload true
                    </Code>{" "}
                    and then run <Code variant="inline">splitrail</Code>{" "}
                    normally. Otherwise just run{" "}
                    <Code variant="inline">splitrail upload</Code>.
                  </li>
                </ol>
              </div>
            );
          }

          // Show loading spinner while data is being fetched
          if (statsData === undefined) {
            return (
              <div className="flex items-center justify-center py-8">
                <Spinner size="default" />
              </div>
            );
          }

          // Check if any application has data by looking at the raw stats data
          const hasAnyData =
            statsData?.stats && Object.keys(statsData.stats).length > 0;

          // Include all applications if we have any data
          const applicationsToShow = hasAnyData ? applications : [];

          const models = totalsRow?.models || [];

          // Update selected app when the applications list changes
          if (
            applicationsToShow.length > 0 &&
            !applicationsToShow.includes(selectedApp)
          ) {
            setSelectedApp(applicationsToShow[0]);
          }

          return (
            <Tabs
              value={selectedApp}
              onValueChange={(value) =>
                setSelectedApp(value as ApplicationType)
              }
              className="w-full"
            >
              <TabsList>
                {applicationsToShow.map((app) => {
                  const appTotalsRow = statsData?.stats?.totals?.[app];
                  const totalConversations = Number(
                    appTotalsRow?.conversations || 0
                  );
                  return (
                    <TabsTrigger key={app} value={app}>
                      {applicationNames[app]} ({totalConversations})
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <TabsContent value={selectedApp}>
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => {
                            return (
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
                            );
                          })}
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
                          <TableCell>Total ({appStats.length}d)</TableCell>
                          <TableCell className="text-yellow-500">
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
                          <TableCell>{models?.join(", ") || ""}</TableCell>
                        </TableRow>
                      </TableFooter>
                    )}
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          );
        })()}
      </div>
    </div>
  );
}
