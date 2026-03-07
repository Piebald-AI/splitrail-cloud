export type AnalyticsPeriod = "daily" | "weekly" | "monthly";

export type CounterString = `${bigint}`;
export type CounterInput = CounterString | bigint | number | null | undefined;

export type StatsCounters = {
  cachedTokens: CounterString;
  inputTokens: CounterString;
  outputTokens: CounterString;
  reasoningTokens: CounterString;
  cacheCreationTokens: CounterString;
  cacheReadTokens: CounterString;
  conversations: CounterString;
  toolCalls: CounterString;
  terminalCommands: CounterString;
  fileSearches: CounterString;
  fileContentSearches: CounterString;
  filesRead: CounterString;
  filesAdded: CounterString;
  filesEdited: CounterString;
  filesDeleted: CounterString;
  linesRead: CounterString;
  linesAdded: CounterString;
  linesEdited: CounterString;
  linesDeleted: CounterString;
  bytesRead: CounterString;
  bytesAdded: CounterString;
  bytesEdited: CounterString;
  bytesDeleted: CounterString;
  codeLines: CounterString;
  docsLines: CounterString;
  dataLines: CounterString;
  mediaLines: CounterString;
  configLines: CounterString;
  otherLines: CounterString;
  todosCreated: CounterString;
  todosCompleted: CounterString;
  todosInProgress: CounterString;
  todoReads: CounterString;
  todoWrites: CounterString;
};

export type DayStat = StatsCounters & {
  date: string;
  cost: number;
  models: string[];
  isEmpty?: boolean;
};

export type TotalsRow = StatsCounters & {
  cost: number;
  models: string[];
};

export type GrandTotal = StatsCounters & {
  daysTracked: number;
  numApps: number;
  applications: string[];
  cost: number;
  tokens: CounterString;
  firstDate: string;
  lastDate: string;
};

export type DayStatsByApp = Record<string, DayStat>;
export type StatsByDate = Record<string, DayStatsByApp>;
export type StatsCollection = {
  dateStats: StatsByDate;
  totals: Record<string, TotalsRow>;
  grandTotal: GrandTotal;
};

export type StatsData = {
  stats: StatsCollection | null;
};

export const ZERO_COUNTER: CounterString = "0";

export function counterToBigInt(value: CounterInput): bigint {
  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "string") {
    return BigInt(value);
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      throw new Error("Counter numbers must be finite integers");
    }

    if (!Number.isSafeInteger(value)) {
      throw new Error("Counter numbers must stay within the safe integer range");
    }

    return BigInt(value);
  }

  return 0n;
}

export function counterToApproxNumber(value: CounterInput): number {
  return Number(counterToBigInt(value));
}

export function addCounterValues(...values: CounterInput[]): bigint {
  return values.reduce<bigint>(
    (sum, value) => sum + counterToBigInt(value),
    0n
  );
}

export function subtractCounterValues(
  left: CounterInput,
  right: CounterInput
): bigint {
  return counterToBigInt(left) - counterToBigInt(right);
}

export function compareCounterValues(
  left: CounterInput,
  right: CounterInput
): number {
  const leftValue = counterToBigInt(left);
  const rightValue = counterToBigInt(right);

  if (leftValue < rightValue) return -1;
  if (leftValue > rightValue) return 1;
  return 0;
}

export function isPositiveCounter(value: CounterInput): boolean {
  return counterToBigInt(value) > 0n;
}

export function counterSortingFn<TRow>(
  getValue: (row: TRow) => CounterInput
) {
  return (
    rowA: { original: TRow },
    rowB: { original: TRow }
  ) => compareCounterValues(getValue(rowA.original), getValue(rowB.original));
}
