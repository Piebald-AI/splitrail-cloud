"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { AnalyticsSkeleton } from "@/components/ui/page-loading";
import { useQuery } from "@tanstack/react-query";
import { useFormatConvertedCurrency } from "@/hooks/use-format-converted-currency";
import { AppStatsTable } from "@/app/_stats/app-stats-table";
import { TotalDailyStatsTable } from "@/app/_stats/total-daily-stats-table";
import { SourceBadges, type SelectedSource } from "@/app/_stats/source-badges";
import { type AnalyticsPeriod, type StatsData } from "@/app/_stats/types";
import { type ApplicationType } from "@/types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SetupInstructions } from "@/app/_stats/setup-instructions";
import { useDeferredLoading } from "@/hooks/use-deferred-loading";

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const [selectedSource, setSelectedSource] =
    React.useState<SelectedSource>("total");
  const [period, setPeriod] = React.useState<AnalyticsPeriod>("daily");

  const { formatConvertedCurrency } = useFormatConvertedCurrency(
    session?.user?.id
  );

  const {
    data: statsData,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErrorObj,
  } = useQuery<StatsData, Error>({
    queryKey: ["userStats", session?.user?.id, period],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error("No user session");
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await fetch(
        `/api/user/${session.user.id}/stats?timezone=${encodeURIComponent(timezone)}&period=${period}`
      );
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = (await response.json()) as {
        success?: boolean;
        data?: StatsData;
        error?: string;
      };
      if (data.success && data.data) return data.data;
      throw new Error(data.error || "Failed to fetch stats");
    },
    enabled: !!session?.user?.id,
  });

  const showSkeleton = useDeferredLoading(status === "loading" || statsLoading);

  if (status === "loading" || statsLoading) {
    return showSkeleton ? <AnalyticsSkeleton /> : null;
  }

  if (!session) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm animate-in fade-in-0 duration-300">
        Please sign in to view your analytics.
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="text-center py-12 text-sm animate-in fade-in-0 duration-300">
        <p className="text-destructive">
          Error loading stats:{" "}
          {statsErrorObj instanceof Error
            ? statsErrorObj.message
            : "An error occurred"}
        </p>
      </div>
    );
  }

  if (!statsData?.stats) {
    return (
      <div className="animate-in fade-in-0 duration-300">
        <SetupInstructions />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-8 animate-in fade-in-0 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <SourceBadges
            statsData={statsData}
            selectedSource={selectedSource}
            onSelectSource={setSelectedSource}
          />
        </div>
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={period}
          onValueChange={(value) => {
            if (
              value === "daily" ||
              value === "weekly" ||
              value === "monthly"
            ) {
              setPeriod(value);
            }
          }}
          aria-label="Period grouping"
        >
          <ToggleGroupItem value="daily" aria-label="Daily period" className="">
            Daily
          </ToggleGroupItem>
          <ToggleGroupItem
            value="weekly"
            aria-label="Weekly period"
            className="px-2"
          >
            Weekly
          </ToggleGroupItem>
          <ToggleGroupItem
            value="monthly"
            aria-label="Monthly period"
            className="px-3"
          >
            Monthly
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      {selectedSource === "total" ? (
        <TotalDailyStatsTable
          statsData={statsData}
          formatConvertedCurrency={formatConvertedCurrency}
          period={period}
        />
      ) : (
        <AppStatsTable
          statsData={statsData}
          selectedApp={selectedSource as ApplicationType}
          formatConvertedCurrency={formatConvertedCurrency}
          period={period}
        />
      )}
    </div>
  );
}
