"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { type UserPreferences } from "@/types";
import { type User } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { convertCurrency } from "@/lib/currency";
import { StatsOverview } from "./_stats/stats-overview";
import { AppStatsTable } from "./_stats/app-stats-table";
import { SetupInstructions } from "./_stats/setup-instructions";
import { SourceBadges, type SelectedSource } from "./_stats/source-badges";
import { TotalStatsTable } from "./_stats/total-stats-table";
import { StatsCharts } from "./_stats/stats-charts";
import { type StatsData } from "./_stats/types";
import { type ApplicationType } from "@/types";

export default function StatsPage() {
  const { data: session, status } = useSession();
  const [selectedSource, setSelectedSource] =
    React.useState<SelectedSource>("total");

  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ["preferences", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error("No user session");
      const response = await fetch(`/api/user/${session.user.id}/preferences`);
      if (!response.ok) throw new Error("Failed to fetch preferences");
      const data = await response.json();
      if (data.success) return data.data as UserPreferences;
      throw new Error("Failed to fetch preferences");
    },
    enabled: !!session?.user?.id,
  });

  const { data: exchangeRates } = useQuery({
    queryKey: ["exchangeRates"],
    queryFn: async () => {
      const response = await fetch("/api/exchange-rates");
      const data = await response.json();
      if (data.success) return data;
      throw new Error("Failed to fetch exchange rates");
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
      if (!response.ok) throw new Error("Failed to fetch profile data");
      const data = await response.json();
      if (data.success) return data.data as User;
      throw new Error(data.error || "Failed to fetch profile data");
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
      if (data.success) return data.data as StatsData;
      throw new Error("Failed to fetch stats");
    },
    enabled: !!session?.user?.id,
  });

  const formatConvertedCurrency = React.useCallback(
    (amount: number) => {
      const currency = preferences?.currency || "USD";
      const locale =
        typeof window !== "undefined"
          ? Array.isArray(navigator.languages) && navigator.languages.length > 0
            ? navigator.languages[0]
            : (navigator as Navigator & { language?: string }).language ||
              "en-US"
          : "en-US";

      if (!exchangeRates?.data || !exchangeRates?.eurToUsd || currency === "USD") {
        return formatCurrency(amount, currency, locale);
      }

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

  const formatConvertedCurrencyAdaptive = React.useCallback(
    (amount: number) => {
      const currency = preferences?.currency || "USD";
      const locale =
        typeof window !== "undefined"
          ? Array.isArray(navigator.languages) && navigator.languages.length > 0
            ? navigator.languages[0]
            : (navigator as Navigator & { language?: string }).language ||
              "en-US"
          : "en-US";

      const convertedAmount =
        !exchangeRates?.data || !exchangeRates?.eurToUsd || currency === "USD"
          ? amount
          : convertCurrency(
              amount,
              currency,
              exchangeRates.data,
              exchangeRates.eurToUsd
            );

      const absValue = Math.abs(convertedAmount);
      const maximumFractionDigits =
        absValue >= 1 ? 2 : absValue >= 0.1 ? 3 : absValue >= 0.01 ? 4 : 6;

      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits,
      }).format(convertedAmount);
    },
    [preferences, exchangeRates]
  );

  // --- Early returns for loading / auth / error states ---

  if (status === "loading" || profileLoading) {
    return (
      <div className="container mx-auto p-6 text-center">
        <Spinner size="lg" className="mx-auto" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <p className="text-muted-foreground">
          Please sign in to view your profile.
        </p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="container mx-auto p-6 text-center">
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
    );
  }

  if (!profileData) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <p className="text-muted-foreground">
          No profile data found. Start using Claude Code / Codex CLI / Gemini
          CLI / Qwen Code / Cline / Roo Code / Kilo Code / GitHub Copilot /
          OpenCode / Pi Agent / Piebald with Splitrail to see your stats!
        </p>
      </div>
    );
  }

  // --- Main dashboard ---

  const grandTotal = statsData?.stats?.grandTotal;

  return (
    <div className="flex flex-col gap-y-8">

      {statsData?.stats === null ? (
        <SetupInstructions />
      ) : statsData === undefined ? (
        <div className="flex items-center justify-center py-4">
          <Spinner size="default" />
        </div>
      ) : (
        <>
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
                  appTotals={statsData.stats.totals}
                  formatConvertedCurrency={formatConvertedCurrency}
                  formatConvertedCurrencyAdaptive={
                    formatConvertedCurrencyAdaptive
                  }
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
              <StatsCharts
                statsData={statsData}
                selectedSource={selectedSource}
                formatConvertedCurrency={formatConvertedCurrency}
              />
              <AppStatsTable
                statsData={statsData}
                selectedApp={selectedSource as ApplicationType}
                formatConvertedCurrency={formatConvertedCurrency}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
