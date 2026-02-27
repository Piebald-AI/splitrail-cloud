export type DailyStatsRow = {
  day: Date;
  application: string;
  total_cost: number;
  cached_tokens: bigint;
  input_tokens: bigint;
  output_tokens: bigint;
  reasoning_tokens: bigint;
  cache_creation_tokens: bigint;
  cache_read_tokens: bigint;
  tool_calls: bigint;
  terminal_commands: bigint;
  file_searches: bigint;
  file_content_searches: bigint;
  files_read: bigint;
  files_added: bigint;
  files_edited: bigint;
  files_deleted: bigint;
  lines_read: bigint;
  lines_edited: bigint;
  lines_added: bigint;
  conversations: bigint;
  models: string[] | null;
};

export type TotalsAccumulator = {
  cost: number;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  reasoningTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  conversations: number;
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

export type StatsRecord = {
  [key: string]: Record<string, unknown>;
} & {
  totals?: Record<string, unknown>;
  grandTotal?: {
    daysTracked: number;
    numApps: number;
    applications: string[];
    cost: number;
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    reasoningTokens: number;
    tokens?: number;
    conversations: number;
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
    firstDate: Date;
    lastDate: Date;
  };
};

export const createEmptyTotalsAccumulator = (): TotalsAccumulator => ({
  cost: 0,
  inputTokens: 0,
  outputTokens: 0,
  cachedTokens: 0,
  reasoningTokens: 0,
  cacheCreationTokens: 0,
  cacheReadTokens: 0,
  conversations: 0,
  toolCalls: 0,
  terminalCommands: 0,
  fileSearches: 0,
  fileContentSearches: 0,
  filesRead: 0,
  filesAdded: 0,
  filesEdited: 0,
  filesDeleted: 0,
  linesRead: 0,
  linesAdded: 0,
  linesEdited: 0,
});

export const mergeTotals = (
  totalsByApp: Record<string, TotalsAccumulator>
): TotalsAccumulator =>
  Object.values(totalsByApp).reduce((acc, appTotals) => {
    acc.cost += appTotals.cost;
    acc.inputTokens += appTotals.inputTokens;
    acc.outputTokens += appTotals.outputTokens;
    acc.cachedTokens += appTotals.cachedTokens;
    acc.reasoningTokens += appTotals.reasoningTokens;
    acc.cacheCreationTokens += appTotals.cacheCreationTokens;
    acc.cacheReadTokens += appTotals.cacheReadTokens;
    acc.conversations += appTotals.conversations;
    acc.toolCalls += appTotals.toolCalls;
    acc.terminalCommands += appTotals.terminalCommands;
    acc.fileSearches += appTotals.fileSearches;
    acc.fileContentSearches += appTotals.fileContentSearches;
    acc.filesRead += appTotals.filesRead;
    acc.filesAdded += appTotals.filesAdded;
    acc.filesEdited += appTotals.filesEdited;
    acc.filesDeleted += appTotals.filesDeleted;
    acc.linesRead += appTotals.linesRead;
    acc.linesAdded += appTotals.linesAdded;
    acc.linesEdited += appTotals.linesEdited;
    return acc;
  }, createEmptyTotalsAccumulator());
