import type { ChartConfig } from "@/components/ui/chart";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Period = "lifetime" | "year" | "30d" | "7d" | "custom";
export type BarMetric = "tokens" | "cost" | "toolCalls";

export type RawDataPoint = {
  date: string;
  displayDate: string;
  tokens: number;
  cost: number;
  toolCalls: number;
  lines: number;
  files: number;
  terminalCommands: number;
  searches: number;
};

export type AreaChartPoint = RawDataPoint & {
  tokensNorm: number;
  costNorm: number;
  toolCallsNorm: number;
  linesNorm: number;
  filesNorm: number;
  terminalCommandsNorm: number;
  searchesNorm: number;
};

export type ModelData = Record<
  string,
  Record<string, { tokens: number; cost: number; toolCalls: number }>
>;

export type BarChartPoint = { date: string; displayDate: string } & Record<
  string,
  number | string
>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const BAR_METRIC_OPTIONS: { value: BarMetric; label: string }[] = [
  { value: "tokens", label: "Tokens" },
  { value: "cost", label: "Cost" },
  { value: "toolCalls", label: "Tool Calls" },
];

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "lifetime", label: "Lifetime" },
  { value: "year", label: "This year" },
  { value: "30d", label: "Last 30 days" },
  { value: "7d", label: "Last 7 days" },
  { value: "custom", label: "Custom" },
];

export const AREA_SERIES = [
  {
    key: "tokens" as const,
    normKey: "tokensNorm" as const,
    label: "Tokens",
    color: "var(--chart-1)",
  },
  {
    key: "cost" as const,
    normKey: "costNorm" as const,
    label: "Cost",
    color: "var(--chart-2)",
  },
  {
    key: "toolCalls" as const,
    normKey: "toolCallsNorm" as const,
    label: "Tool Calls",
    color: "var(--chart-3)",
  },
  {
    key: "lines" as const,
    normKey: "linesNorm" as const,
    label: "Lines",
    color: "var(--chart-4)",
  },
  {
    key: "files" as const,
    normKey: "filesNorm" as const,
    label: "Files",
    color: "var(--chart-5)",
  },
  {
    key: "terminalCommands" as const,
    normKey: "terminalCommandsNorm" as const,
    label: "Terminal",
    color: "#8b5cf6",
  },
  {
    key: "searches" as const,
    normKey: "searchesNorm" as const,
    label: "Searches",
    color: "#10b981",
  },
] as const;

export const AREA_CHART_CONFIG: ChartConfig = {
  tokensNorm: { label: "Tokens", color: "var(--chart-1)" },
  costNorm: { label: "Cost", color: "var(--chart-2)" },
  toolCallsNorm: { label: "Tool Calls", color: "var(--chart-3)" },
  linesNorm: { label: "Lines", color: "var(--chart-4)" },
  filesNorm: { label: "Files", color: "var(--chart-5)" },
  terminalCommandsNorm: { label: "Terminal", color: "#8b5cf6" },
  searchesNorm: { label: "Searches", color: "#10b981" },
};

export const MODEL_PALETTE = [
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
