export type DayStat = {
  date: string;
  cost: number;
  cachedTokens: string;
  inputTokens: string;
  outputTokens: string;
  reasoningTokens: string;
  conversations: string | number;
  toolCalls: string;
  linesRead: string;
  linesAdded: string;
  linesEdited: string;
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
  tokens: number;
  conversations: number;
  firstDate: string;
  lastDate: string;
  toolCalls: number;
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
