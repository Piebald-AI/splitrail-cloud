"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/ui/page-loading";
import { useQuery } from "@tanstack/react-query";
import { useFormatConvertedCurrency } from "@/hooks/use-format-converted-currency";
import { StatsOverview } from "@/app/_stats/stats-overview";
import { SetupInstructions } from "@/app/_stats/setup-instructions";
import { SourceBadges, type SelectedSource } from "@/app/_stats/source-badges";
import { StatsCharts } from "@/app/_stats/stats-charts";
import { TotalStatsTable } from "@/app/_stats/total-stats-table";
import { hasStatsCollectionData, type StatsData } from "@/app/_stats/types";
import { useDeferredLoading } from "@/hooks/use-deferred-loading";

export default function StatsPage() {
  const { data: session, status } = useSession();
  const [selectedSource, setSelectedSource] =
    React.useState<SelectedSource>("total");
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const { formatConvertedCurrency, formatConvertedCurrencyAdaptive } =
    useFormatConvertedCurrency(session?.user?.id, {
      enabled: !!session?.user?.id,
    });

  const {
    data: statsData,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErrorObj,
  } = useQuery<StatsData, Error>({
    queryKey: ["userStats", session?.user?.id, timezone],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error("No user session");
      const response = await fetch(
        `/api/user/${session.user.id}/stats?timezone=${encodeURIComponent(timezone)}`
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

  // --- Early returns for auth / error states ---

  const showSkeleton = useDeferredLoading(status === "loading" || statsLoading);

  if (status === "loading") {
    return showSkeleton ? <DashboardSkeleton /> : null;
  }

  if (!session) {
    return (
      <div className="container mx-auto p-6 text-center animate-in fade-in-0 duration-300">
        <h1 className="text-2xl font-bold mb-4">Stats Dashboard</h1>
        <p className="text-muted-foreground">
          Please sign in to view your stats dashboard.
        </p>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="container mx-auto p-6 text-center animate-in fade-in-0 duration-300">
        <h1 className="text-2xl font-bold mb-4">Stats Dashboard</h1>
        <p className="text-destructive">
          Error loading stats:{" "}
          {statsErrorObj instanceof Error
            ? statsErrorObj.message
            : "An error occurred"}
        </p>
        <Button onClick={() => window.location.reload()} className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  if (statsLoading || !statsData) {
    return showSkeleton ? <DashboardSkeleton /> : null;
  }

  if (!hasStatsCollectionData(statsData.stats)) {
    return (
      <div className="flex flex-col gap-y-8 animate-in fade-in-0 duration-300">
        <SetupInstructions />
      </div>
    );
  }

  // --- Main dashboard ---

  const stats = statsData.stats;
  const grandTotal = stats.grandTotal;

  return (
    <div className="flex flex-col gap-y-8 animate-in fade-in-0 duration-300">
      <SourceBadges
        statsData={statsData}
        selectedSource={selectedSource}
        onSelectSource={setSelectedSource}
      />

      {selectedSource === "total" ? (
        <>
          {grandTotal && (
            <StatsOverview
              grandTotal={grandTotal}
              appTotals={stats.totals}
              formatConvertedCurrency={formatConvertedCurrency}
              formatConvertedCurrencyAdaptive={formatConvertedCurrencyAdaptive}
            />
          )}
          <StatsCharts
            statsData={statsData}
            selectedSource={selectedSource}
            formatConvertedCurrency={formatConvertedCurrency}
          />
          <TotalStatsTable
            statsData={statsData}
            formatConvertedCurrency={formatConvertedCurrency}
          />
        </>
      ) : (
        <>
          {/* Per-app dashboard stays chart-focused; detailed per-period tables live on analytics-page via AppStatsTable. */}
          <StatsCharts
            statsData={statsData}
            selectedSource={selectedSource}
            formatConvertedCurrency={formatConvertedCurrency}
          />
        </>
      )}
    </div>
  );
}
