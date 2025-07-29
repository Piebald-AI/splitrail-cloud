import { type User } from "@prisma/client";

export const Applications = ["claude_code", "gemini_cli", "codex_cli"] as const;

// Period types
export const Periods = [
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly"
] as const;

export type ApplicationType = (typeof Applications)[number];
export type PeriodType = (typeof Periods)[number];

// Using strings for stat keys instead of manually spelling them out in the interfaces so that in
// the routes that update the database we can use these keys to determine what to update.

export const BigIntStatKeys = [
  "filesRead",
  "filesAdded",
  "filesEdited",
  "filesDeleted",
  "linesRead",
  "linesAdded",
  "linesEdited",
  "linesDeleted",
  "bytesRead",
  "bytesEdited",
  "bytesAdded",
  "bytesDeleted",
  "terminalCommands",
  "fileSearches",
  "fileContentSearches",
  "codeLines",
  "docsLines",
  "dataLines",
  "mediaLines",
  "configLines",
  "otherLines",
  "todosCreated",
  "todosCompleted",
  "todosInProgress",
  "todoReads",
  "todoWrites",
  "inputTokens",
  "outputTokens",
  "cacheCreationTokens",
  "cacheReadTokens",
  "cachedTokens",
  "toolCalls",
  "assistantMessages",
  "userMessages",
] as const;

export const FloatStatKeys = ["cost"] as const;

export const StatKeys = [...BigIntStatKeys, ...FloatStatKeys];

export type Stats = Record<(typeof FloatStatKeys)[number], number> &
  Record<(typeof BigIntStatKeys)[number], bigint>;

export type StatsFromAPI = Record<(typeof FloatStatKeys)[number], number> &
  Record<(typeof BigIntStatKeys)[number], Record<"$bigint", string>>;

export type DbStats = Record<(typeof FloatStatKeys)[number], number> &
  Record<(typeof BigIntStatKeys)[number], string>;

export type UserStats = Stats;

export type UserStatsPeriods = {
  period: string;
  application: ApplicationType;
  periodStart: Date;
  periodEnd: Date;
};

export type UserStatsWithPeriods = UserStats & UserStatsPeriods;

export type DbUserStats = Stats &
  UserStatsPeriods & {
    id?: string;
    userId: string;
    updatedAt: Date;
    createdAt: Date;
  };

export type DbMessageStats = Omit<
  UserStats,
  "assistantMessages" | "userMessages"
> & {
  hash: string;
  userId: string;
  application: ApplicationType;
  role: "user" | "assistant";
  timestamp: string;
  projectHash: string;
  model: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserWithStatsFromAPI = User &
  StatsFromAPI & {
    id: string;
    displayName: string;
    email: string;
    createdAt: Date;
    rank: number;
  };

// Extended types for API responses
export type UserWithStats = User &
  UserStats & {
    id: string;
    displayName: string;
    email: string;
    createdAt: Date;
    rank: number;
  };

export type UserWithPeriods = UserWithStats & {
  userStats: Array<UserStatsWithPeriods>;
};

export interface LeaderboardData {
  users: UserWithStats[];
  total: number;
  currentPage: number;
  pageSize: number;
}

export interface LeaderboardRequest {
  period?: string;
  applications?: ApplicationType[];
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface ProjectStatsData {
  [projectName: string]: {
    percentage: number;
    lines: number;
  };
}

export interface LanguageData {
  [languageName: string]: {
    lines: number;
    files: number;
  };
}

export interface ModelData {
  [modelName: string]: number;
}

// API request/response types
export type ConversationMessage = {
  role: "user" | "assistant";
  model: string | null;
  timestamp: string;
  hash: string;
  projectHash: string;
  application: ApplicationType;
  stats: Stats;
};

export interface ApiError {
  error: string;
  message: string;
  code?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
  email: string;
}

// User preferences
export interface UserPreferencesData {
  displayNamePreference: "displayName" | "username";
  locale: string;
  timezone: string;
  currency: string;
  optOutPublic: boolean;
}

// Project entity types
export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  openSource: boolean;
  githubLink?: string;
  websiteLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FolderProjectData {
  id: string;
  userId: string;
  folder: string;
  projectId: string;
  project?: ProjectData;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  openSource: boolean;
  githubLink?: string;
  websiteLink?: string;
}

export interface AssociateFolderRequest {
  folder: string;
  projectId: string;
}

// Chart data types
export interface ChartData {
  date: string;
  cost: number;
  tokens: number;
  lines: number;
  [key: string]: unknown;
}
