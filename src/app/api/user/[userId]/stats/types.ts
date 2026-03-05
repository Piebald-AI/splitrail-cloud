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
  lines_deleted: bigint;
  bytes_read: bigint;
  bytes_added: bigint;
  bytes_edited: bigint;
  bytes_deleted: bigint;
  code_lines: bigint;
  docs_lines: bigint;
  data_lines: bigint;
  media_lines: bigint;
  config_lines: bigint;
  other_lines: bigint;
  todos_created: bigint;
  todos_completed: bigint;
  todos_in_progress: bigint;
  todo_reads: bigint;
  todo_writes: bigint;
  conversations: bigint;
  models: string[] | null;
};

export type SerializedStatsCounters = {
  inputTokens: string;
  outputTokens: string;
  cachedTokens: string;
  reasoningTokens: string;
  cacheCreationTokens: string;
  cacheReadTokens: string;
  conversations: string;
  toolCalls: string;
  terminalCommands: string;
  fileSearches: string;
  fileContentSearches: string;
  filesRead: string;
  filesAdded: string;
  filesEdited: string;
  filesDeleted: string;
  linesRead: string;
  linesAdded: string;
  linesEdited: string;
  linesDeleted: string;
  bytesRead: string;
  bytesAdded: string;
  bytesEdited: string;
  bytesDeleted: string;
  codeLines: string;
  docsLines: string;
  dataLines: string;
  mediaLines: string;
  configLines: string;
  otherLines: string;
  todosCreated: string;
  todosCompleted: string;
  todosInProgress: string;
  todoReads: string;
  todoWrites: string;
};

export type TotalsAccumulator = {
  cost: number;
  inputTokens: bigint;
  outputTokens: bigint;
  cachedTokens: bigint;
  reasoningTokens: bigint;
  cacheCreationTokens: bigint;
  cacheReadTokens: bigint;
  conversations: bigint;
  toolCalls: bigint;
  terminalCommands: bigint;
  fileSearches: bigint;
  fileContentSearches: bigint;
  filesRead: bigint;
  filesAdded: bigint;
  filesEdited: bigint;
  filesDeleted: bigint;
  linesRead: bigint;
  linesAdded: bigint;
  linesEdited: bigint;
  linesDeleted: bigint;
  bytesRead: bigint;
  bytesAdded: bigint;
  bytesEdited: bigint;
  bytesDeleted: bigint;
  codeLines: bigint;
  docsLines: bigint;
  dataLines: bigint;
  mediaLines: bigint;
  configLines: bigint;
  otherLines: bigint;
  todosCreated: bigint;
  todosCompleted: bigint;
  todosInProgress: bigint;
  todoReads: bigint;
  todoWrites: bigint;
};

export type SerializedDayStats = SerializedStatsCounters & {
  cost: number;
  models: string[];
};

export type SerializedTotals = SerializedStatsCounters & {
  cost: number;
};

export type GrandTotal = SerializedTotals & {
  daysTracked: number;
  numApps: number;
  applications: string[];
  tokens?: string;
  firstDate: string;
  lastDate: string;
};

export type StatsByDateRecord = Record<string, Record<string, unknown>>;

export type StatsRecord = {
  dateStats: StatsByDateRecord;
  totals?: Record<string, SerializedTotals & { models: string[] }>;
  grandTotal?: GrandTotal;
};

export const createEmptyTotalsAccumulator = (): TotalsAccumulator => ({
  cost: 0,
  inputTokens: 0n,
  outputTokens: 0n,
  cachedTokens: 0n,
  reasoningTokens: 0n,
  cacheCreationTokens: 0n,
  cacheReadTokens: 0n,
  conversations: 0n,
  toolCalls: 0n,
  terminalCommands: 0n,
  fileSearches: 0n,
  fileContentSearches: 0n,
  filesRead: 0n,
  filesAdded: 0n,
  filesEdited: 0n,
  filesDeleted: 0n,
  linesRead: 0n,
  linesAdded: 0n,
  linesEdited: 0n,
  linesDeleted: 0n,
  bytesRead: 0n,
  bytesAdded: 0n,
  bytesEdited: 0n,
  bytesDeleted: 0n,
  codeLines: 0n,
  docsLines: 0n,
  dataLines: 0n,
  mediaLines: 0n,
  configLines: 0n,
  otherLines: 0n,
  todosCreated: 0n,
  todosCompleted: 0n,
  todosInProgress: 0n,
  todoReads: 0n,
  todoWrites: 0n,
});

export const serializeStatsCounters = (
  counters: TotalsAccumulator
): SerializedTotals => ({
  cost: counters.cost,
  inputTokens: counters.inputTokens.toString(),
  outputTokens: counters.outputTokens.toString(),
  cachedTokens: counters.cachedTokens.toString(),
  reasoningTokens: counters.reasoningTokens.toString(),
  cacheCreationTokens: counters.cacheCreationTokens.toString(),
  cacheReadTokens: counters.cacheReadTokens.toString(),
  conversations: counters.conversations.toString(),
  toolCalls: counters.toolCalls.toString(),
  terminalCommands: counters.terminalCommands.toString(),
  fileSearches: counters.fileSearches.toString(),
  fileContentSearches: counters.fileContentSearches.toString(),
  filesRead: counters.filesRead.toString(),
  filesAdded: counters.filesAdded.toString(),
  filesEdited: counters.filesEdited.toString(),
  filesDeleted: counters.filesDeleted.toString(),
  linesRead: counters.linesRead.toString(),
  linesAdded: counters.linesAdded.toString(),
  linesEdited: counters.linesEdited.toString(),
  linesDeleted: counters.linesDeleted.toString(),
  bytesRead: counters.bytesRead.toString(),
  bytesAdded: counters.bytesAdded.toString(),
  bytesEdited: counters.bytesEdited.toString(),
  bytesDeleted: counters.bytesDeleted.toString(),
  codeLines: counters.codeLines.toString(),
  docsLines: counters.docsLines.toString(),
  dataLines: counters.dataLines.toString(),
  mediaLines: counters.mediaLines.toString(),
  configLines: counters.configLines.toString(),
  otherLines: counters.otherLines.toString(),
  todosCreated: counters.todosCreated.toString(),
  todosCompleted: counters.todosCompleted.toString(),
  todosInProgress: counters.todosInProgress.toString(),
  todoReads: counters.todoReads.toString(),
  todoWrites: counters.todoWrites.toString(),
});

export const serializeDailyStatsRow = (
  row: DailyStatsRow
): SerializedDayStats => ({
  cost: row.total_cost ?? 0,
  inputTokens: row.input_tokens.toString(),
  outputTokens: row.output_tokens.toString(),
  cachedTokens: row.cached_tokens.toString(),
  reasoningTokens: row.reasoning_tokens.toString(),
  cacheCreationTokens: row.cache_creation_tokens.toString(),
  cacheReadTokens: row.cache_read_tokens.toString(),
  conversations: row.conversations.toString(),
  toolCalls: row.tool_calls.toString(),
  terminalCommands: row.terminal_commands.toString(),
  fileSearches: row.file_searches.toString(),
  fileContentSearches: row.file_content_searches.toString(),
  filesRead: row.files_read.toString(),
  filesAdded: row.files_added.toString(),
  filesEdited: row.files_edited.toString(),
  filesDeleted: row.files_deleted.toString(),
  linesRead: row.lines_read.toString(),
  linesAdded: row.lines_added.toString(),
  linesEdited: row.lines_edited.toString(),
  linesDeleted: row.lines_deleted.toString(),
  bytesRead: row.bytes_read.toString(),
  bytesAdded: row.bytes_added.toString(),
  bytesEdited: row.bytes_edited.toString(),
  bytesDeleted: row.bytes_deleted.toString(),
  codeLines: row.code_lines.toString(),
  docsLines: row.docs_lines.toString(),
  dataLines: row.data_lines.toString(),
  mediaLines: row.media_lines.toString(),
  configLines: row.config_lines.toString(),
  otherLines: row.other_lines.toString(),
  todosCreated: row.todos_created.toString(),
  todosCompleted: row.todos_completed.toString(),
  todosInProgress: row.todos_in_progress.toString(),
  todoReads: row.todo_reads.toString(),
  todoWrites: row.todo_writes.toString(),
  models: row.models ?? [],
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
    acc.linesDeleted += appTotals.linesDeleted;
    acc.bytesRead += appTotals.bytesRead;
    acc.bytesAdded += appTotals.bytesAdded;
    acc.bytesEdited += appTotals.bytesEdited;
    acc.bytesDeleted += appTotals.bytesDeleted;
    acc.codeLines += appTotals.codeLines;
    acc.docsLines += appTotals.docsLines;
    acc.dataLines += appTotals.dataLines;
    acc.mediaLines += appTotals.mediaLines;
    acc.configLines += appTotals.configLines;
    acc.otherLines += appTotals.otherLines;
    acc.todosCreated += appTotals.todosCreated;
    acc.todosCompleted += appTotals.todosCompleted;
    acc.todosInProgress += appTotals.todosInProgress;
    acc.todoReads += appTotals.todoReads;
    acc.todoWrites += appTotals.todoWrites;
    return acc;
  }, createEmptyTotalsAccumulator());
