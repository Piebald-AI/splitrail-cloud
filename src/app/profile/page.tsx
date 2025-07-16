"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { type UserProfileData } from "@/types";
import { formatCurrency, formatLargeNumber, formatDate } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"all" | "year" | "month" | "week">(
    "month"
  );

  const fetchProfileData = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/user/${session.user.id}?timeRange=${timeRange}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch profile data");
      }

      const data = await response.json();

      if (data.success) {
        setProfileData(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch profile data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [session, timeRange]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfileData();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status, timeRange, fetchProfileData]);

  if (status === "loading" || loading) {
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

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-destructive">Error: {error}</p>
          <Button onClick={fetchProfileData} className="mt-2">
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
            No profile data found. Start using Claude Code with Splitrail to see
            your stats!
          </p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = profileData.dailyStats
    .slice(0, 30)
    .reverse()
    .map((stat) => ({
      date: formatDate(stat.date, "en-US", { month: "short", day: "numeric" }),
      cost: stat.cost,
      tokens: stat.inputTokens + stat.outputTokens + stat.cachedTokens,
      lines: stat.linesAdded + stat.linesDeleted + stat.linesModified,
    }));

  return (
    <>
      {/* Header */}
      <div className="mb-8">
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
              Member since{" "}
              {formatDate(profileData.createdAt, "en-US", {
                year: "numeric",
                month: "long",
              })}
            </p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Time Range:</span>
          {(["all", "year", "month", "week"] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === "all"
                ? "All Time"
                : range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(profileData.aggregatedStats.totalCost)}
            </div>
            <div className="text-sm text-muted-foreground">Total Cost</div>
            <div className="text-xs text-muted-foreground">
              Avg:{" "}
              {formatCurrency(profileData.aggregatedStats.averageCostPerDay)}
              /day
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {formatLargeNumber(profileData.aggregatedStats.totalTokens)}
            </div>
            <div className="text-sm text-muted-foreground">Total Tokens</div>
            <div className="text-xs text-muted-foreground">
              Avg:{" "}
              {formatLargeNumber(
                profileData.aggregatedStats.averageTokensPerDay
              )}
              /day
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {formatLargeNumber(
                profileData.aggregatedStats.totalLinesAdded +
                  profileData.aggregatedStats.totalLinesDeleted +
                  profileData.aggregatedStats.totalLinesModified
              )}
            </div>
            <div className="text-sm text-muted-foreground">Total Lines</div>
            <div className="text-xs text-muted-foreground">
              Avg:{" "}
              {formatLargeNumber(
                profileData.aggregatedStats.averageLinesPerDay
              )}
              /day
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {profileData.aggregatedStats.streakDays}
            </div>
            <div className="text-sm text-muted-foreground">Active Days</div>
            <div className="text-xs text-muted-foreground">
              {profileData.dailyStats.length} total sessions
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Cost Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tokens Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Tokens Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value) => formatLargeNumber(Number(value))}
                />
                <Line
                  type="monotone"
                  dataKey="tokens"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Models Used */}
        <Card>
          <CardHeader>
            <CardTitle>Models Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profileData.aggregatedStats.topModels
                .slice(0, 5)
                .map((model) => (
                  <div
                    key={model.name}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-sm">{model.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {(
                          (model.usage /
                            profileData.aggregatedStats.topModels.reduce(
                              (sum, m) => sum + m.usage,
                              0
                            )) *
                          100
                        ).toFixed(1)}
                        % usage
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {model.usage} calls
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tokens
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Lines
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Messages
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tools
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {profileData.dailyStats.slice(0, 10).map((stat) => {
                    const statDate = new Date(stat.date);
                    const dateStr = statDate.toISOString().split("T")[0];
                    const totalTokens =
                      stat.inputTokens + stat.outputTokens + stat.cachedTokens;
                    // const totalLines = stat.linesAdded + stat.linesDeleted + stat.linesModified
                    const totalMessages = stat.userMessages + stat.aiMessages;

                    return (
                      <tr key={stat.id} className="hover:bg-muted/50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Button
                            variant="link"
                            className="h-auto p-0 font-medium"
                            asChild
                          >
                            <Link href={`/profile/${dateStr}`}>
                              {formatDate(stat.date, "en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </Link>
                          </Button>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {formatCurrency(stat.cost)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {formatLargeNumber(totalTokens)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-1">
                            <UITooltip>
                              <TooltipTrigger>
                                <span className="text-green-600">
                                  +{formatLargeNumber(stat.linesAdded)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Lines Added</p>
                              </TooltipContent>
                            </UITooltip>
                            <UITooltip>
                              <TooltipTrigger>
                                <span className="text-red-600">
                                  -{formatLargeNumber(stat.linesDeleted)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Lines Deleted</p>
                              </TooltipContent>
                            </UITooltip>
                            <UITooltip>
                              <TooltipTrigger>
                                <span className="text-blue-600">
                                  {formatLargeNumber(stat.linesModified)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Lines Modified</p>
                              </TooltipContent>
                            </UITooltip>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {totalMessages}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {stat.toolCalls}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {profileData.dailyStats.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No activity data available. Start using Claude Code with
                Splitrail to see your daily stats!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
