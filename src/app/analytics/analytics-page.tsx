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

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const [selectedSource, setSelectedSource] =
    React.useState<SelectedSource>("total");
  const [period, setPeriod] = React.useState<AnalyticsPeriod>("daily");

  const { formatConvertedCurrency } = useFormatConvertedCurrency(
    session?.user?.id
  );

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["userStats", session?.user?.id, period],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error("No user session");
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await fetch(
        `/api/user/${session.user.id}/stats?timezone=${encodeURIComponent(timezone)}&period=${period}`
      );
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      if (data.success) return data.data as StatsData;
      throw new Error("Failed to fetch stats");
    },
    enabled: !!session?.user?.id,
  });

  if (status === "loading" || statsLoading) {
    return <AnalyticsSkeleton />;
  }

  if (!statsData?.stats) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm animate-in fade-in-0 duration-300">
        No stats data available yet.
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
            if (value === "daily" || value === "weekly" || value === "monthly") {
              setPeriod(value);
            }
          }}
          aria-label="Period grouping"
        >
          <ToggleGroupItem value="daily" aria-label="Daily period" className="">
            Daily
          </ToggleGroupItem>
          <ToggleGroupItem value="weekly" aria-label="Weekly period" className="px-2">
            Weekly
          </ToggleGroupItem>
          <ToggleGroupItem value="monthly" aria-label="Monthly period" className="px-3">
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
