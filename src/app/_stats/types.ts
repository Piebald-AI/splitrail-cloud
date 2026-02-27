export type AnalyticsPeriod = "daily" | "weekly" | "monthly";

export type DayStat = {
  date: string;
  cost: number;
  cachedTokens: number | string;
  inputTokens: number | string;
  outputTokens: number | string;
  reasoningTokens: number | string;
  cacheCreationTokens?: number | string;
  cacheReadTokens?: number | string;
  conversations: string | number;
  toolCalls: number | string;
  terminalCommands?: number | string;
  fileSearches?: number | string;
  fileContentSearches?: number | string;
  filesRead?: number | string;
  filesAdded?: number | string;
  filesEdited?: number | string;
  filesDeleted?: number | string;
  linesRead: number | string;
  linesAdded: number | string;
  linesEdited: number | string;
  models?: string[];
  isEmpty?: boolean;
};

export type GrandTotal = {
  daysTracked: number;
  numApps: number;
  applications: string[];
  cost: number;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  reasoningTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  tokens: number;
  conversations: number;
  firstDate: string;
  lastDate: string;
  toolCalls: number;
  terminalCommands: number;
  fileSearches: number;
  fileContentSearches: number;
  filesRead: number;
  filesAdded: number;
  filesEdited: number;
  filesDeleted: number;
  linesRead: number;
  linesAdded: number;
  linesEdited: number;
};

export type StatsData = {
  stats: Record<string, Record<string, DayStat>> & {
    totals: Record<string, DayStat>;
    grandTotal: GrandTotal;
  };
};
