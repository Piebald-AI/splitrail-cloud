import { type User } from "@prisma/client";

// Application types for CLI/agentic development tools
export type ApplicationType = "claude_code" | "gemini_cli" | "codex_cli";

// Period types
export const Periods = [
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "all-time",
] as const;

export type PeriodType = (typeof Periods)[number];

// Using strings for stat keys instead of manually spelling them out in the interfaces so that in
// the routes that update the database we can use these keys to determine what to update.

export const FileOperationStatKeys = [
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
] as const;

export const CompositionStatKeys = [
  "codeLines",
  "docsLines",
  "dataLines",
  "mediaLines",
  "configLines",
  "otherLines",
] as const;

export const TodoStatKeys = [
  "todosCreated",
  "todosCompleted",
  "todosInProgress",
  "todoReads",
  "todoWrites",
] as const;

export const GeneralStatKeys = [
  "inputTokens",
  "outputTokens",
  "cacheCreationTokens",
  "cacheReadTokens",
  "cachedTokens",
  "cost",
  "toolCalls",
] as const;

export const StatKeys = [
  ...FileOperationStatKeys,
  ...CompositionStatKeys,
  ...TodoStatKeys,
  ...GeneralStatKeys,
  "assistantMessages",
  "userMessages",
] as const;

// CLI data structure (mirrors Rust types)
export type FileOperationStats = Record<
  (typeof FileOperationStatKeys)[number],
  number
>;

export type CompositionStats = Record<
  (typeof CompositionStatKeys)[number],
  number
>;

export type TodoStats = Record<(typeof TodoStatKeys)[number], number>;

export type GeneralStats = Record<(typeof GeneralStatKeys)[number], number>;

export type Stats = Record<(typeof StatKeys)[number], number>;

export type UserStats = Stats;

export type UserStatsPeriods = {
  period: string;
  application: ApplicationType;
  periodStart?: Date;
  periodEnd?: Date;
}

export type UserStatsWithPeriods = UserStats & UserStatsPeriods;

export type DbUserStats = Partial<UserStats> & UserStatsPeriods & {
  id?: string;
  userId: string;
  updatedAt: Date;
  createdAt: Date;
};

export type DbMessageStats = Omit<Partial<UserStats>, "assistantMessages" | "userMessages"> & {
  hash: string;
  userId: string;
  application: ApplicationType;
  role: string;
  timestamp: string;
  projectHash: string;
  model: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Extended types for API responses
export interface UserWithStats extends User, UserStats {
  id: string;
  displayName: string;
  email: string;
  createdAt: Date;
  rank: number;
}

export interface UserWithPeriods extends UserWithStats {
  userStats: Array<UserStatsWithPeriods>;
}

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

export interface DailyStats {
  date: string;
  cost: number;
  cachedTokens: number;
  inputTokens: number;
  outputTokens: number;
  userMessages: number;
  aiMessages: number;
  toolCalls: number;
  conversations: number;
  models: Record<string, number>;
  fileOperations: FileOperationStats;
  todoStats: TodoStats;
  maxFlowLengthSeconds: number;
}

// Chart data types
export interface ChartData {
  date: string;
  cost: number;
  tokens: number;
  lines: number;
  [key: string]: unknown;
}
