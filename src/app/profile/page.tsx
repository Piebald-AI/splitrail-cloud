"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { type UserProfileData } from "@/types";
import { formatCurrency, formatLargeNumber, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";

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
    </>
  );
}
