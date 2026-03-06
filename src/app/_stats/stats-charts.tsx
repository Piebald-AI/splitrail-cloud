"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatLargeNumber } from "@/lib/utils";
import { type ApplicationType } from "@/types";
import { type StatsData } from "@/app/_stats/types";
import {
  AREA_CHART_CONFIG,
  AREA_SERIES,
  BAR_METRIC_OPTIONS,
  MODEL_PALETTE,
  PERIOD_OPTIONS,
  type BarMetric,
  type ModelData,
  type Period,
} from "@/app/_stats/stats-charts-config";
import {
  buildAreaData,
  buildBarData,
  getDateRange,
} from "@/app/_stats/stats-charts-utils";
import { AreaTooltip, BarTooltip } from "@/app/_stats/stats-charts-tooltips";
import { AreaLegend, BarLegend } from "@/app/_stats/stats-charts-legends";

export function StatsCharts({
  statsData,
  selectedSource,
  formatConvertedCurrency,
}: {
  statsData: StatsData;
  selectedSource: "total" | ApplicationType;
  formatConvertedCurrency: (amount: number) => string;
}) {
  const { data: session } = useSession();
  const [period, setPeriod] = React.useState<Period>("30d");
  const [barMetric, setBarMetric] = React.useState<BarMetric>("tokens");
  const [hiddenArea, setHiddenArea] = React.useState<Set<string>>(
    new Set(["linesNorm", "filesNorm", "terminalCommandsNorm", "searchesNorm"])
  );
  const [hiddenModels, setHiddenModels] = React.useState<Set<string>>(
    new Set()
  );

  // Custom date range state — default to last 30 days as initial values
  const today = React.useMemo(() => new Date(), []);
  const thirtyDaysAgo = React.useMemo(() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 29);
    return d;
  }, []);
  const [customStartDate, setCustomStartDate] =
    React.useState<Date>(thirtyDaysAgo);
  const [customEndDate, setCustomEndDate] = React.useState<Date>(today);
  const [startOpen, setStartOpen] = React.useState(false);
  const [endOpen, setEndOpen] = React.useState(false);

  const customStart = React.useMemo(
    () =>
      `${customStartDate.getFullYear()}-${String(customStartDate.getMonth() + 1).padStart(2, "0")}-${String(customStartDate.getDate()).padStart(2, "0")}`,
    [customStartDate]
  );
  const customEnd = React.useMemo(
    () =>
      `${customEndDate.getFullYear()}-${String(customEndDate.getMonth() + 1).padStart(2, "0")}-${String(customEndDate.getDate()).padStart(2, "0")}`,
    [customEndDate]
  );

  const allDataDates = React.useMemo(
    () =>
      Object.keys(statsData?.stats?.dateStats ?? {}).sort(),
    [statsData]
  );
  const firstDataDate = allDataDates[0] ?? new Date().toISOString();
  const modelRange = React.useMemo(() => {
    if (allDataDates.length === 0) return null;
    const dates = getDateRange(period, firstDataDate, customStart, customEnd);
    if (dates.length === 0) return null;
    return {
      startDate: dates[0].split("T")[0],
      endDate: dates[dates.length - 1].split("T")[0],
    };
  }, [allDataDates, customEnd, customStart, firstDataDate, period]);

  const {
    data: modelData,
    isError: isModelDataError,
    error: modelDataError,
  } = useQuery<ModelData, Error>({
    queryKey: [
      "modelStats",
      session?.user?.id,
      selectedSource,
      modelRange?.startDate,
      modelRange?.endDate,
    ],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error("No session");
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const appParam =
        selectedSource !== "total"
          ? `&application=${encodeURIComponent(selectedSource)}`
          : "";
      const dateRangeParam = modelRange
        ? `&startDate=${encodeURIComponent(modelRange.startDate)}&endDate=${encodeURIComponent(modelRange.endDate)}`
        : "";
      const res = await fetch(
        `/api/user/${session.user.id}/stats/models?timezone=${encodeURIComponent(timezone)}${appParam}${dateRangeParam}`
      );
      const responseText = await res.text();
      let json:
        | {
            success?: boolean;
            data?: ModelData;
            error?: string;
          }
        | null = null;

      try {
        json = responseText
          ? (JSON.parse(responseText) as {
              success?: boolean;
              data?: ModelData;
              error?: string;
            })
          : null;
      } catch {
        json = null;
      }

      if (!res.ok) {
        throw new Error(
          json?.error ??
            `${res.status} ${res.statusText}${
              responseText ? `: ${responseText}` : ""
            }`
        );
      }

      if (!json?.success) {
        throw new Error(json?.error ?? "Model stats request did not succeed");
      }

      return json.data as ModelData;
    },
    enabled: !!session?.user?.id && !!modelRange,
    staleTime: 5 * 60 * 1000,
  });

  const areaData = React.useMemo(
    () =>
      buildAreaData(statsData, selectedSource, period, customStart, customEnd),
    [statsData, selectedSource, period, customStart, customEnd]
  );

  const { points: barPoints, models } = React.useMemo(() => {
    if (!modelData || allDataDates.length === 0)
      return { points: [], models: [] };
    return buildBarData(
      modelData,
      period,
      firstDataDate,
      barMetric,
      customStart,
      customEnd
    );
  }, [
    modelData,
    period,
    firstDataDate,
    barMetric,
    allDataDates,
    customStart,
    customEnd,
  ]);

  const formatBarValue = React.useCallback(
    (v: number) =>
      barMetric === "cost" ? formatConvertedCurrency(v) : formatLargeNumber(v),
    [barMetric, formatConvertedCurrency]
  );

  const modelColors = React.useMemo(() => {
    const map: Record<string, string> = {};
    models.forEach((m, i) => {
      map[m] = MODEL_PALETTE[i % MODEL_PALETTE.length];
    });
    return map;
  }, [models]);

  const barConfig = React.useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = {};
    models.forEach((m, i) => {
      cfg[m] = { label: m, color: MODEL_PALETTE[i % MODEL_PALETTE.length] };
    });
    return cfg;
  }, [models]);

  const toggleArea = React.useCallback((key: string) => {
    setHiddenArea((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleModel = React.useCallback((model: string) => {
    setHiddenModels((prev) => {
      const next = new Set(prev);
      if (next.has(model)) {
        next.delete(model);
      } else {
        next.add(model);
      }
      return next;
    });
  }, []);

  if (!statsData?.stats) return null;

  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-sm font-medium">Activity</span>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Period */}
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  period === opt.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Custom date range pickers — inline with period selector */}
          {period === "custom" && (
            <>
              <Popover open={startOpen} onOpenChange={setStartOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 px-2 text-xs font-medium"
                  >
                    <CalendarIcon className="size-3" />
                    {format(customStartDate, "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={(date) => {
                      if (date) {
                        setCustomStartDate(date);
                        setStartOpen(false);
                      }
                    }}
                    disabled={{ after: customEndDate }}
                    defaultMonth={customStartDate}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
              <span className="text-xs text-muted-foreground">–</span>
              <Popover open={endOpen} onOpenChange={setEndOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 px-2 text-xs font-medium"
                  >
                    <CalendarIcon className="size-3" />
                    {format(customEndDate, "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={(date) => {
                      if (date) {
                        setCustomEndDate(date);
                        setEndOpen(false);
                      }
                    }}
                    disabled={{ before: customStartDate, after: today }}
                    defaultMonth={customEndDate}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
      </div>

      {/* Area chart — always visible */}
      <ChartContainer
        config={AREA_CHART_CONFIG}
        className="h-56 w-full aspect-auto"
      >
        <AreaChart
          data={areaData}
          margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
        >
          <defs>
            {AREA_SERIES.map((s) => (
              <linearGradient
                key={s.key}
                id={`grad-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            className="stroke-border/40"
          />
          <XAxis
            dataKey="displayDate"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
            className="fill-muted-foreground"
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
            className="fill-muted-foreground"
          />
          <Tooltip
            content={
              <AreaTooltip
                formatConvertedCurrency={formatConvertedCurrency}
                hidden={hiddenArea}
              />
            }
          />
          {AREA_SERIES.map((s) =>
            hiddenArea.has(s.normKey) ? null : (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.normKey}
                name={s.label}
                stroke={s.color}
                strokeWidth={1.5}
                fill={`url(#grad-${s.key})`}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            )
          )}
        </AreaChart>
      </ChartContainer>
      <AreaLegend hidden={hiddenArea} onToggle={toggleArea} />

      {/* Model breakdown */}
      <div className="border-t border-border/40 pt-3 mt-1">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <span className="text-sm font-medium">Model breakdown</span>
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5">
            {BAR_METRIC_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setBarMetric(opt.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  barMetric === opt.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <ChartContainer config={barConfig} className="h-56 w-full aspect-auto">
          <BarChart
            data={barPoints}
            margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
            barCategoryGap="20%"
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              className="stroke-border/40"
            />
            <XAxis
              dataKey="displayDate"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
              className="fill-muted-foreground"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              tickFormatter={formatBarValue}
              className="fill-muted-foreground"
            />
            <Tooltip
              content={
                <BarTooltip
                  modelColors={modelColors}
                  formatValue={formatBarValue}
                />
              }
            />
            {models.map((model) =>
              hiddenModels.has(model) ? null : (
                <Bar
                  key={model}
                  dataKey={model}
                  stackId="models"
                  fill={modelColors[model]}
                  isAnimationActive={false}
                  radius={0}
                />
              )
            )}
          </BarChart>
        </ChartContainer>
        {isModelDataError ? (
          <p className="text-xs text-destructive text-center py-2">
            {modelDataError.message}
          </p>
        ) : models.length > 0 ? (
          <BarLegend
            models={models}
            modelColors={modelColors}
            hidden={hiddenModels}
            onToggle={toggleModel}
          />
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">
            No model data for this period.
          </p>
        )}
      </div>
    </div>
  );
}
