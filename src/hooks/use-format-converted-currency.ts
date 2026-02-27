"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { convertCurrency } from "@/lib/currency";
import { formatCurrency } from "@/lib/utils";
import { type UserPreferences } from "@/types";

type ExchangeRatesResponse = {
  success: boolean;
  data: Array<{ currency: string; rate: number }>;
  eurToUsd: number;
};

export function useFormatConvertedCurrency(userId?: string) {
  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ["preferences", userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user session");
      const response = await fetch(`/api/user/${userId}/preferences`);
      if (!response.ok) throw new Error("Failed to fetch preferences");
      const data = await response.json();
      if (data.success) return data.data as UserPreferences;
      throw new Error("Failed to fetch preferences");
    },
    enabled: Boolean(userId),
  });

  const { data: exchangeRates } = useQuery<ExchangeRatesResponse>({
    queryKey: ["exchangeRates"],
    queryFn: async () => {
      const response = await fetch("/api/exchange-rates");
      const data = await response.json();
      if (data.success) return data as ExchangeRatesResponse;
      throw new Error("Failed to fetch exchange rates");
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const locale = React.useMemo(() => {
    if (typeof window === "undefined") return "en-US";
    if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
      return navigator.languages[0];
    }
    return (navigator as Navigator & { language?: string }).language || "en-US";
  }, []);

  const formatConvertedCurrency = React.useCallback(
    (amount: number) => {
      const currency = preferences?.currency || "USD";
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
    [preferences, exchangeRates, locale]
  );

  const formatConvertedCurrencyAdaptive = React.useCallback(
    (amount: number) => {
      const currency = preferences?.currency || "USD";
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
    [preferences, exchangeRates, locale]
  );

  return { formatConvertedCurrency, formatConvertedCurrencyAdaptive };
}
