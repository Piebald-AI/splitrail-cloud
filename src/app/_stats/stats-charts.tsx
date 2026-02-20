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
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { formatLargeNumber } from "@/lib/utils";
import { type ApplicationType } from "@/types";
import { type StatsData } from "./types";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type Period = "lifetime" | "year" | "30d" | "7d";
type ChartType = "area" | "bar";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "lifetime", label: "Lifetime" },
  { value: "year", label: "This year" },
  { value: "30d", label: "Last 30 days" },
  { value: "7d", label: "Last 7 days" },
];

const AREA_SERIES = [
  { key: "tokens" as const, normKey: "tokensNorm" as const, label: "Tokens", color: "var(--chart-1)" },
  { key: "cost" as const, normKey: "costNorm" as const, label: "Cost", color: "var(--chart-2)" },
  { key: "toolCalls" as const, normKey: "toolCallsNorm" as const, label: "Tool Calls", color: "var(--chart-3)" },
  { key: "lines" as const, normKey: "linesNorm" as const, label: "Lines", color: "var(--chart-4)" },
] as const;

const AREA_CHART_CONFIG: ChartConfig = {
  tokensNorm: { label: "Tokens", color: "var(--chart-1)" },
  costNorm: { label: "Cost", color: "var(--chart-2)" },
  toolCallsNorm: { label: "Tool Calls", color: "var(--chart-3)" },
  linesNorm: { label: "Lines", color: "var(--chart-4)" },
};

// Palette for dynamic model colors
const MODEL_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
];

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function toUTCDateKey(d: Date): string {
  return `${d.toISOString().split("T")[0]}T00:00:00.000Z`;
}

function getDateRange(period: Period, firstDataDate: string): string[] {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  let start: Date;
  if (period === "lifetime") {
    start = new Date(firstDataDate);
  } else if (period === "year") {
    start = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
  } else if (period === "30d") {
    start = new Date(today);
    start.setUTCDate(start.getUTCDate() - 29);
  } else {
    // 7d
    start = new Date(today);
    start.setUTCDate(start.getUTCDate() - 6);
  }

  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    dates.push(toUTCDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

// ---------------------------------------------------------------------------
// Area chart data builder
// ---------------------------------------------------------------------------

type RawDataPoint = {
  date: string;
  displayDate: string;
  tokens: number;
  cost: number;
  toolCalls: number;
  lines: number;
};

type AreaChartPoint = RawDataPoint & {
  tokensNorm: number;
  costNorm: number;
  toolCallsNorm: number;
  linesNorm: number;
};

function buildAreaData(
  statsData: StatsData,
  selectedSource: "total" | ApplicationType,
  period: Period
): AreaChartPoint[] {
  if (!statsData?.stats) return [];

  const allDataDates = Object.keys(statsData.stats)
    .filter((k) => k !== "totals" && k !== "grandTotal")
    .sort();

  if (allDataDates.length === 0) return [];

  const dates = getDateRange(period, allDataDates[0]);

  const raw: RawDataPoint[] = dates.map((dateKey) => {
    const dayData = statsData.stats[dateKey];
    let tokens = 0, cost = 0, toolCalls = 0, lines = 0;

    if (dayData) {
      if (selectedSource === "total") {
        Object.values(dayData).forEach((appStat) => {
          if (appStat && typeof appStat === "object" && "cost" in appStat) {
            tokens +=
              (Number(appStat.inputTokens) || 0) +
              (Number(appStat.outputTokens) || 0) +
              (Number(appStat.cachedTokens) || 0) +
              (Number(appStat.reasoningTokens) || 0);
            cost += Number(appStat.cost) || 0;
            toolCalls += Number(appStat.toolCalls) || 0;
            lines +=
              (Number(appStat.linesRead) || 0) +
              (Number(appStat.linesAdded) || 0) +
              (Number(appStat.linesEdited) || 0);
          }
        });
      } else {
        const appStat = dayData[selectedSource];
        if (appStat) {
          tokens =
            (Number(appStat.inputTokens) || 0) +
            (Number(appStat.outputTokens) || 0) +
            (Number(appStat.cachedTokens) || 0) +
            (Number(appStat.reasoningTokens) || 0);
          cost = Number(appStat.cost) || 0;
          toolCalls = Number(appStat.toolCalls) || 0;
          lines =
            (Number(appStat.linesRead) || 0) +
            (Number(appStat.linesAdded) || 0) +
            (Number(appStat.linesEdited) || 0);
        }
      }
    }

    const d = new Date(dateKey);
    const displayDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    return { date: dateKey, displayDate, tokens, cost, toolCalls, lines };
  });

  const maxTokens = Math.max(...raw.map((r) => r.tokens), 1);
  const maxCost = Math.max(...raw.map((r) => r.cost), 1);
  const maxToolCalls = Math.max(...raw.map((r) => r.toolCalls), 1);
  const maxLines = Math.max(...raw.map((r) => r.lines), 1);

  return raw.map((r) => ({
    ...r,
    tokensNorm: (r.tokens / maxTokens) * 100,
    costNorm: (r.cost / maxCost) * 100,
    toolCallsNorm: (r.toolCalls / maxToolCalls) * 100,
    linesNorm: (r.lines / maxLines) * 100,
  }));
}

// ---------------------------------------------------------------------------
// Bar chart data builder (per-model)
// ---------------------------------------------------------------------------

type ModelData = Record<string, Record<string, { tokens: number; cost: number; toolCalls: number }>>;

type BarChartPoint = { date: string; displayDate: string } & Record<string, number | string>;

function buildBarData(
  modelData: ModelData,
  period: Period,
  firstDataDate: string
): { points: BarChartPoint[]; models: string[] } {
  const dates = getDateRange(period, firstDataDate);

  const modelSet = new Set<string>();
  dates.forEach((dateKey) => {
    const day = modelData[dateKey];
    if (day) Object.keys(day).forEach((m) => modelSet.add(m));
  });
  const models = Array.from(modelSet).sort();

  const points: BarChartPoint[] = dates.map((dateKey) => {
    const day = modelData[dateKey];
    const d = new Date(dateKey);
    const displayDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    const point: BarChartPoint = { date: dateKey, displayDate };
    models.forEach((model) => {
      point[model] = day?.[model]?.tokens ?? 0;
    });
    return point;
  });

  return { points, models };
}

// ---------------------------------------------------------------------------
// Tooltips
// ---------------------------------------------------------------------------

function AreaTooltip({
  active,
  payload,
  label,
  formatConvertedCurrency,
  hidden,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; color: string; payload: AreaChartPoint }>;
  label?: string;
  formatConvertedCurrency: (amount: number) => string;
  hidden: Set<string>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="border-border/50 bg-background grid min-w-[10rem] gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{label}</div>
      {AREA_SERIES.filter((s) => !hidden.has(s.normKey)).map((s) => {
        const item = payload.find((p) => p.dataKey === s.normKey);
        if (!item) return null;
        const formatted = s.key === "cost" ? formatConvertedCurrency(point[s.key]) : formatLargeNumber(point[s.key]);
        return (
          <div key={s.key} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground">{s.label}</span>
            </div>
            <span className="font-mono font-medium tabular-nums">{formatted}</span>
          </div>
        );
      })}
    </div>
  );
}

function BarTooltip({
  active,
  payload,
  label,
  modelColors,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; color: string; value: number }>;
  label?: string;
  modelColors: Record<string, string>;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);

  return (
    <div className="border-border/50 bg-background grid min-w-[10rem] gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{label}</div>
      {payload.filter((p) => p.value > 0).map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: modelColors[p.dataKey] || p.color }} />
            <span className="text-muted-foreground truncate max-w-[120px]">{p.dataKey}</span>
          </div>
          <span className="font-mono font-medium tabular-nums">{formatLargeNumber(p.value)}</span>
        </div>
      ))}
      {total > 0 && (
        <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-1 mt-0.5">
          <span className="text-muted-foreground">Total</span>
          <span className="font-mono font-medium tabular-nums">{formatLargeNumber(total)}</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Legends
// ---------------------------------------------------------------------------

function AreaLegend({ hidden, onToggle }: { hidden: Set<string>; onToggle: (key: string) => void }) {
  return (
    <div className="flex items-center justify-center gap-4 pt-2">
      {AREA_SERIES.map((s) => (
        <button
          key={s.key}
          onClick={() => onToggle(s.normKey)}
          className={`flex items-center gap-1.5 text-xs transition-opacity ${hidden.has(s.normKey) ? "opacity-30" : "opacity-100"}`}
        >
          <div className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: s.color }} />
          <span className="text-muted-foreground">{s.label}</span>
        </button>
      ))}
    </div>
  );
}

function BarLegend({
  models,
  modelColors,
  hidden,
  onToggle,
}: {
  models: string[];
  modelColors: Record<string, string>;
  hidden: Set<string>;
  onToggle: (model: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-2">
      {models.map((model) => (
        <button
          key={model}
          onClick={() => onToggle(model)}
          className={`flex items-center gap-1.5 text-xs transition-opacity ${hidden.has(model) ? "opacity-30" : "opacity-100"}`}
        >
          <div className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: modelColors[model] }} />
          <span className="text-muted-foreground truncate max-w-[200px]">{model}</span>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

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
  const [chartType, setChartType] = React.useState<ChartType>("area");
  const [hiddenArea, setHiddenArea] = React.useState<Set<string>>(new Set(["linesNorm"]));
  const [hiddenModels, setHiddenModels] = React.useState<Set<string>>(new Set());

  const { data: modelData } = useQuery<ModelData>({
    queryKey: ["modelStats", session?.user?.id, selectedSource],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error("No session");
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const appParam =
        selectedSource !== "total" ? `&application=${encodeURIComponent(selectedSource)}` : "";
      const res = await fetch(
        `/api/user/${session.user.id}/stats/models?timezone=${encodeURIComponent(timezone)}${appParam}`
      );
      const json = await res.json();
      if (json.success) return json.data as ModelData;
      throw new Error("Failed");
    },
    enabled: !!session?.user?.id && chartType === "bar",
    staleTime: 5 * 60 * 1000,
  });

  const allDataDates = React.useMemo(
    () =>
      Object.keys(statsData?.stats ?? {})
        .filter((k) => k !== "totals" && k !== "grandTotal")
        .sort(),
    [statsData]
  );
  const firstDataDate = allDataDates[0] ?? new Date().toISOString();

  const areaData = React.useMemo(
    () => buildAreaData(statsData, selectedSource, period),
    [statsData, selectedSource, period]
  );

  const { points: barPoints, models } = React.useMemo(() => {
    if (!modelData || allDataDates.length === 0) return { points: [], models: [] };
    return buildBarData(modelData, period, firstDataDate);
  }, [modelData, period, firstDataDate, allDataDates]);

  const modelColors = React.useMemo(() => {
    const map: Record<string, string> = {};
    models.forEach((m, i) => { map[m] = MODEL_PALETTE[i % MODEL_PALETTE.length]; });
    return map;
  }, [models]);

  const barConfig = React.useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = {};
    models.forEach((m, i) => { cfg[m] = { label: m, color: MODEL_PALETTE[i % MODEL_PALETTE.length] }; });
    return cfg;
  }, [models]);

  const toggleArea = React.useCallback((key: string) => {
    setHiddenArea((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }, []);

  const toggleModel = React.useCallback((model: string) => {
    setHiddenModels((prev) => { const n = new Set(prev); n.has(model) ? n.delete(model) : n.add(model); return n; });
  }, []);

  if (!statsData?.stats) return null;

  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-sm font-medium">Activity</span>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Chart type */}
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5">
            {(["area", "bar"] as ChartType[]).map((t) => (
              <button
                key={t}
                onClick={() => setChartType(t)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  chartType === t
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
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
        </div>
      </div>

      {/* Area chart */}
      {chartType === "area" && (
        <>
          <ChartContainer config={AREA_CHART_CONFIG} className="h-56 w-full aspect-auto">
            <AreaChart data={areaData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <defs>
                {AREA_SERIES.map((s) => (
                  <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} interval="preserveStartEnd" className="fill-muted-foreground" />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} className="fill-muted-foreground" />
              <Tooltip content={<AreaTooltip formatConvertedCurrency={formatConvertedCurrency} hidden={hiddenArea} />} />
              {AREA_SERIES.map((s) =>
                hiddenArea.has(s.normKey) ? null : (
                  <Area key={s.key} type="monotone" dataKey={s.normKey} name={s.label} stroke={s.color} strokeWidth={1.5} fill={`url(#grad-${s.key})`} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} isAnimationActive={false} />
                )
              )}
            </AreaChart>
          </ChartContainer>
          <AreaLegend hidden={hiddenArea} onToggle={toggleArea} />
        </>
      )}

      {/* Bar chart */}
      {chartType === "bar" && (
        <>
          <ChartContainer config={barConfig} className="h-56 w-full aspect-auto">
            <BarChart data={barPoints} margin={{ top: 4, right: 4, bottom: 0, left: -24 }} barCategoryGap="20%">
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} interval="preserveStartEnd" className="fill-muted-foreground" />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => formatLargeNumber(v)} className="fill-muted-foreground" />
              <Tooltip content={<BarTooltip modelColors={modelColors} />} />
              {models.map((model) =>
                hiddenModels.has(model) ? null : (
                  <Bar key={model} dataKey={model} stackId="models" fill={modelColors[model]} isAnimationActive={false} radius={0} />
                )
              )}
            </BarChart>
          </ChartContainer>
          {models.length > 0 ? (
            <BarLegend models={models} modelColors={modelColors} hidden={hiddenModels} onToggle={toggleModel} />
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">No model data for this period.</p>
          )}
        </>
      )}
    </div>
  );
}
