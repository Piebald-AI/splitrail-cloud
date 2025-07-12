"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { type DailyStats } from "@prisma/client";
import {
  formatCurrency,
  formatLargeNumber,
  formatDate,
  getLanguageIcon,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";

export default function DailyBreakdownPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const date = params.date as string;

  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyStats = useCallback(async () => {
    if (!session?.user?.id || !date) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/user/${session.user.id}/daily/${date}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError("No data found for this date");
        } else {
          throw new Error("Failed to fetch daily stats");
        }
        return;
      }

      const data = await response.json();

      if (data.success) {
        setDailyStats(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch daily stats");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [session, date]);

  useEffect(() => {
    if (session?.user?.id && date) {
      fetchDailyStats();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status, date, fetchDailyStats]);

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
          <h1 className="text-2xl font-bold mb-4">Daily Breakdown</h1>
          <p className="text-muted-foreground">
            Please sign in to view your daily stats.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-4">
          <Button variant="link" className="p-0 h-auto" asChild>
            <Link href="/profile">← Back to Profile</Link>
          </Button>
        </div>
        <div className="text-center">
          <p className="text-destructive mb-4">Error: {error}</p>
          <Button onClick={fetchDailyStats}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!dailyStats) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-4">
          <Button variant="link" className="p-0 h-auto" asChild>
            <Link href="/profile">← Back to Profile</Link>
          </Button>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Daily Breakdown</h1>
          <p className="text-muted-foreground">
            No data found for{" "}
            {formatDate(date, "en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            .
          </p>
        </div>
      </div>
    );
  }

  const totalTokens =
    dailyStats.inputTokens + dailyStats.outputTokens + dailyStats.cachedTokens;
  const totalLines =
    dailyStats.linesAdded + dailyStats.linesDeleted + dailyStats.linesModified;
  const totalFileOps =
    dailyStats.filesRead + dailyStats.filesEdited + dailyStats.filesWritten;

  // Parse JSON data safely
  const projectsData =
    typeof dailyStats.projectsData === "object"
      ? (dailyStats.projectsData as Record<
          string,
          { lines: number; percentage: number }
        >)
      : {};
  const languagesData =
    typeof dailyStats.languagesData === "object"
      ? (dailyStats.languagesData as Record<
          string,
          { lines: number; files: number }
        >)
      : {};
  const modelsData =
    typeof dailyStats.modelsData === "object"
      ? (dailyStats.modelsData as Record<string, number>)
      : {};

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4">
          <Button variant="link" className="p-0 h-auto" asChild>
            <Link href="/profile">← Back to Profile</Link>
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-2">Daily Breakdown</h1>
        <p className="text-lg text-muted-foreground">
          {formatDate(dailyStats.date, "en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(dailyStats.cost)}
            </div>
            <div className="text-sm text-muted-foreground">Total Cost</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {formatLargeNumber(totalTokens)}
            </div>
            <div className="text-sm text-muted-foreground">Total Tokens</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {formatLargeNumber(totalLines)}
            </div>
            <div className="text-sm text-muted-foreground">Lines Modified</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {dailyStats.conversations}
            </div>
            <div className="text-sm text-muted-foreground">Conversations</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Token Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Input Tokens
                </span>
                <span className="font-medium">
                  {formatLargeNumber(dailyStats.inputTokens)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Output Tokens
                </span>
                <span className="font-medium">
                  {formatLargeNumber(dailyStats.outputTokens)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Cached Tokens
                </span>
                <span className="font-medium">
                  {formatLargeNumber(dailyStats.cachedTokens)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center font-semibold">
                <span>Total</span>
                <span>{formatLargeNumber(totalTokens)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Messages & Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  User Messages
                </span>
                <span className="font-medium">{dailyStats.userMessages}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  AI Messages
                </span>
                <span className="font-medium">{dailyStats.aiMessages}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Tool Calls
                </span>
                <span className="font-medium">{dailyStats.toolCalls}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Max Flow (seconds)
                </span>
                <span className="font-medium">
                  {dailyStats.maxFlowLengthSeconds}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Operations */}
        <Card>
          <CardHeader>
            <CardTitle>File Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Files Read
                </span>
                <span className="font-medium">{dailyStats.filesRead}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Files Edited
                </span>
                <span className="font-medium">{dailyStats.filesEdited}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Files Written
                </span>
                <span className="font-medium">{dailyStats.filesWritten}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center font-semibold">
                <span>Total Operations</span>
                <span>{totalFileOps}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Operations */}
        <Card>
          <CardHeader>
            <CardTitle>Line Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600">Lines Added</span>
                <span className="font-medium text-green-600">
                  +{formatLargeNumber(dailyStats.linesAdded)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-red-600">Lines Deleted</span>
                <span className="font-medium text-red-600">
                  -{formatLargeNumber(dailyStats.linesDeleted)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-600">Lines Modified</span>
                <span className="font-medium text-blue-600">
                  {formatLargeNumber(dailyStats.linesModified)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Lines Read
                </span>
                <span className="font-medium">
                  {formatLargeNumber(dailyStats.linesRead)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tool Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Tool Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Bash Commands
                </span>
                <span className="font-medium">{dailyStats.bashCommands}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Glob Searches
                </span>
                <span className="font-medium">{dailyStats.globSearches}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Grep Searches
                </span>
                <span className="font-medium">{dailyStats.grepSearches}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Todo Management */}
        <Card>
          <CardHeader>
            <CardTitle>Todo Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Todos Created
                </span>
                <span className="font-medium">{dailyStats.todosCreated}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Todos Completed
                </span>
                <span className="font-medium">{dailyStats.todosCompleted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Todo Reads
                </span>
                <span className="font-medium">{dailyStats.todoReads}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Todo Writes
                </span>
                <span className="font-medium">{dailyStats.todoWrites}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects, Languages, and Models */}
      {(Object.keys(projectsData).length > 0 ||
        Object.keys(languagesData).length > 0 ||
        Object.keys(modelsData).length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Projects */}
          {Object.keys(projectsData).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(projectsData).map(([project, data]) => (
                    <div
                      key={project}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium text-sm">{project}</div>
                        <div className="text-xs text-muted-foreground">
                          {data.percentage?.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatLargeNumber(data.lines || 0)} lines
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Languages */}
          {Object.keys(languagesData).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Languages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(languagesData).map(([language, data]) => (
                    <div
                      key={language}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center gap-2">
                        <span>{getLanguageIcon(language)}</span>
                        <div>
                          <div className="font-medium text-sm">{language}</div>
                          <div className="text-xs text-muted-foreground">
                            {data.files || 0} files
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatLargeNumber(data.lines || 0)} lines
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Models */}
          {Object.keys(modelsData).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Models Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(modelsData).map(([model, usage]) => (
                    <div
                      key={model}
                      className="flex justify-between items-center"
                    >
                      <div className="font-medium text-sm">{model}</div>
                      <div className="text-sm text-muted-foreground">
                        {usage} calls
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
