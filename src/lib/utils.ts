import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format numbers with locale-aware formatting
export function formatNumber(
  num: number,
  locale: string = "en-US",
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat(locale, options).format(num);
}

// Format currency
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount);
}

// Format large numbers (e.g., 1000 -> 1k, 1000000 -> 1M)
export function formatLargeNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
}

// Format dates with locale awareness
export function formatDate(
  date: Date | string,
  locale: string = "en-US",
  options: Intl.DateTimeFormatOptions = {}
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

// Get relative time (e.g., "2 days ago")
export function getRelativeTime(
  date: Date | string,
  locale: string = "en-US"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, "second");
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), "minute");
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), "hour");
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), "day");
  } else if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), "month");
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), "year");
  }
}

// Calculate badge based on rank
export function calculateBadge(
  rank: number
): "gold" | "silver" | "bronze" | undefined {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return undefined;
}

// Programming language icons mapping
export const languageIcons: Record<string, string> = {
  javascript: "🟨",
  typescript: "🔷",
  python: "🐍",
  java: "☕",
  go: "🐹",
  rust: "🦀",
  "c++": "🔧",
  c: "🔧",
  "c#": "💜",
  php: "🐘",
  ruby: "💎",
  swift: "🦉",
  kotlin: "🅺",
  dart: "🎯",
  html: "🌐",
  css: "🎨",
  scss: "🎨",
  less: "🎨",
  json: "📋",
  xml: "📋",
  yaml: "📋",
  yml: "📋",
  markdown: "📝",
  md: "📝",
  sql: "🗃️",
  shell: "🖥️",
  bash: "🖥️",
  powershell: "🖥️",
  dockerfile: "🐳",
  docker: "🐳",
  default: "📄",
};

// Get language icon
export function getLanguageIcon(language: string): string {
  const normalizedLang = language.toLowerCase();
  return languageIcons[normalizedLang] || languageIcons.default;
}

// Convert CLI data to database format
export function transformCliData(
  cliData: Record<string, unknown>,
  folder?: string
): Record<string, unknown> {
  return {
    cost: cliData.cost || 0,
    inputTokens: cliData.inputTokens || 0,
    outputTokens: cliData.outputTokens || 0,
    cachedTokens: cliData.cachedTokens || 0,
    userMessages: cliData.userMessages || 0,
    aiMessages: cliData.aiMessages || 0,
    toolCalls: cliData.toolCalls || 0,
    conversations: cliData.conversations || 0,
    maxFlowLengthSeconds: cliData.maxFlowLengthSeconds || 0,
    filesRead: cliData.filesRead || 0,
    filesEdited: cliData.filesEdited || 0,
    filesWritten: cliData.filesWritten || 0,
    linesRead: cliData.linesRead || 0,
    linesAdded: cliData.linesAdded || 0,
    linesDeleted: cliData.linesDeleted || 0,
    linesModified: cliData.linesModified || 0,
    bytesRead: cliData.bytesRead || 0,
    bytesEdited: cliData.bytesEdited || 0,
    bytesWritten: cliData.bytesWritten || 0,
    bashCommands: cliData.bashCommands || 0,
    globSearches: cliData.globSearches || 0,
    grepSearches: cliData.grepSearches || 0,
    todosCreated: cliData.todosCreated || 0,
    todosCompleted: cliData.todosCompleted || 0,
    todosInProgress: cliData.todosInProgress || 0,
    todoReads: cliData.todoReads || 0,
    todoWrites: cliData.todoWrites || 0,
    codeLines: cliData.codeLines || 0,
    docsLines: cliData.docsLines || 0,
    dataLines: cliData.dataLines || 0,
    projectsData: cliData.projectsData || {},
    languagesData: cliData.languagesData || {},
    modelsData: cliData.modelsData || {},
    folder: folder || null,
    rawData: cliData,
  };
}

// Generate API token
export function generateApiToken(): string {
  return (
    "st_" +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Validate API token format
export function isValidApiToken(token: string): boolean {
  return /^st_[a-zA-Z0-9]{20,}$/.test(token);
}

// Get display name based on user preference
export function getDisplayName(
  user: { username: string; displayName: string | null },
  preference: "displayName" | "username" = "displayName"
): string {
  if (preference === "displayName" && user.displayName) {
    return user.displayName;
  }
  return user.username;
}

// Calculate streak days
export function calculateStreakDays(
  dailyStats: Array<{ date: Date | string }>
): number {
  if (!dailyStats.length) return 0;

  const sortedDates = dailyStats
    .map((stat) => new Date(stat.date))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 0;
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const date of sortedDates) {
    const statDate = new Date(date);
    statDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (currentDate.getTime() - statDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === streak) {
      streak++;
    } else if (diffDays === streak + 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}
