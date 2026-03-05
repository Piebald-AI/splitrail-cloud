import type { ApplicationType } from "@/types";
import {
  addCounterValues,
  counterToApproxNumber,
  type StatsData,
} from "@/app/_stats/types";
import type {
  AreaChartPoint,
  BarChartPoint,
  BarMetric,
  ModelData,
  Period,
  RawDataPoint,
} from "@/app/_stats/stats-charts-config";

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

export function toUTCDateKey(d: Date): string {
  return `${d.toISOString().split("T")[0]}T00:00:00.000Z`;
}

export function getDateRange(
  period: Period,
  firstDataDate: string,
  customStart?: string,
  customEnd?: string
): string[] {
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  let start: Date;
  let end: Date = today;

  if (period === "custom" && customStart && customEnd) {
    start = new Date(customStart + "T00:00:00.000Z");
    end = new Date(customEnd + "T00:00:00.000Z");
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      start = new Date(today);
      start.setUTCDate(start.getUTCDate() - 29);
      end = today;
    }
  } else if (period === "lifetime") {
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
  while (cursor <= end) {
    dates.push(toUTCDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

// ---------------------------------------------------------------------------
// Area chart data builder
// ---------------------------------------------------------------------------

export function buildAreaData(
  statsData: StatsData,
  selectedSource: "total" | ApplicationType,
  period: Period,
  customStart?: string,
  customEnd?: string
): AreaChartPoint[] {
  if (!statsData?.stats) return [];

  const allDataDates = Object.keys(statsData.stats)
    .filter((k) => k !== "totals" && k !== "grandTotal")
    .sort();

  if (allDataDates.length === 0) return [];

  const dates = getDateRange(period, allDataDates[0], customStart, customEnd);

  const raw: RawDataPoint[] = dates.map((dateKey) => {
    const dayData = statsData.stats[dateKey];
    let tokens = 0n,
      cost = 0,
      toolCalls = 0n,
      lines = 0n,
      files = 0n,
      terminalCommands = 0n,
      searches = 0n;

    if (dayData) {
      if (selectedSource === "total") {
        Object.values(dayData).forEach((appStat) => {
          if (appStat && typeof appStat === "object" && "cost" in appStat) {
            tokens += addCounterValues(
              appStat.inputTokens,
              appStat.outputTokens,
              appStat.cachedTokens,
              appStat.reasoningTokens
            );
            cost += Number(appStat.cost) || 0;
            toolCalls += addCounterValues(appStat.toolCalls);
            lines += addCounterValues(
              appStat.linesRead,
              appStat.linesAdded,
              appStat.linesEdited
            );
            files += addCounterValues(
              appStat.filesRead,
              appStat.filesAdded,
              appStat.filesEdited,
              appStat.filesDeleted
            );
            terminalCommands += addCounterValues(appStat.terminalCommands);
            searches += addCounterValues(
              appStat.fileSearches,
              appStat.fileContentSearches
            );
          }
        });
      } else {
        const appStat = dayData[selectedSource];
        if (appStat) {
          tokens = addCounterValues(
            appStat.inputTokens,
            appStat.outputTokens,
            appStat.cachedTokens,
            appStat.reasoningTokens
          );
          cost = Number(appStat.cost) || 0;
          toolCalls = addCounterValues(appStat.toolCalls);
          lines = addCounterValues(
            appStat.linesRead,
            appStat.linesAdded,
            appStat.linesEdited
          );
          files = addCounterValues(
            appStat.filesRead,
            appStat.filesAdded,
            appStat.filesEdited,
            appStat.filesDeleted
          );
          terminalCommands = addCounterValues(appStat.terminalCommands);
          searches = addCounterValues(
            appStat.fileSearches,
            appStat.fileContentSearches
          );
        }
      }
    }

    const d = new Date(dateKey);
    const displayDate = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    return {
      date: dateKey,
      displayDate,
      tokens: counterToApproxNumber(tokens),
      cost,
      toolCalls: counterToApproxNumber(toolCalls),
      lines: counterToApproxNumber(lines),
      files: counterToApproxNumber(files),
      terminalCommands: counterToApproxNumber(terminalCommands),
      searches: counterToApproxNumber(searches),
    };
  });

  const maxTokens = Math.max(...raw.map((r) => r.tokens), 1);
  const maxCost = Math.max(...raw.map((r) => r.cost), 1);
  const maxToolCalls = Math.max(...raw.map((r) => r.toolCalls), 1);
  const maxLines = Math.max(...raw.map((r) => r.lines), 1);
  const maxFiles = Math.max(...raw.map((r) => r.files), 1);
  const maxTerminalCommands = Math.max(
    ...raw.map((r) => r.terminalCommands),
    1
  );
  const maxSearches = Math.max(...raw.map((r) => r.searches), 1);

  return raw.map((r) => ({
    ...r,
    tokensNorm: (r.tokens / maxTokens) * 100,
    costNorm: (r.cost / maxCost) * 100,
    toolCallsNorm: (r.toolCalls / maxToolCalls) * 100,
    linesNorm: (r.lines / maxLines) * 100,
    filesNorm: (r.files / maxFiles) * 100,
    terminalCommandsNorm: (r.terminalCommands / maxTerminalCommands) * 100,
    searchesNorm: (r.searches / maxSearches) * 100,
  }));
}

// ---------------------------------------------------------------------------
// Bar chart data builder (per-model)
// ---------------------------------------------------------------------------

export function buildBarData(
  modelData: ModelData,
  period: Period,
  firstDataDate: string,
  metric: BarMetric,
  customStart?: string,
  customEnd?: string
): { points: BarChartPoint[]; models: string[] } {
  const dates = getDateRange(period, firstDataDate, customStart, customEnd);

  const modelSet = new Set<string>();
  dates.forEach((dateKey) => {
    const day = modelData[dateKey];
    if (day) {
      Object.keys(day).forEach((m) => {
        modelSet.add(m);
      });
    }
  });
  const models = Array.from(modelSet).sort();

  const points: BarChartPoint[] = dates.map((dateKey) => {
    const day = modelData[dateKey];
    const d = new Date(dateKey);
    const displayDate = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    const point: BarChartPoint = { date: dateKey, displayDate };
    models.forEach((model) => {
      point[model] = day?.[model]?.[metric] ?? 0;
    });
    return point;
  });

  return { points, models };
}
