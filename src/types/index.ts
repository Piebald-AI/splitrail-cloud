import { type User } from "@prisma/client";

// Application types for CLI/agentic development tools
export type ApplicationType = "claude_code" | "gemini_cli" | "codex_cli";

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
  "cost",
  "toolCalls",
] as const;

export const StatKeys = [
  ...FileOperationStatKeys,
  ...CompositionStatKeys,
  ...TodoStatKeys,
  ...GeneralStatKeys,
  "aiMessages",
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

export type UserStats = Record<(typeof StatKeys)[number], number>;

export interface UserStatsWithPeriods extends UserStats {
  period: string;
  application?: ApplicationType;
  periodStart?: Date;
  periodEnd?: Date;
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

export type AIMessage = {
  model: string;
  timestamp: string;
  hash: string | null;
  application: ApplicationType;
  conversationFile: string;
  generalStats: GeneralStats;
  fileOperations: FileOperationStats;
  todoStats: TodoStats;
  compositionStats: CompositionStats;
};

export type UserMessage = {
  timestamp: string;
  application: ApplicationType;
  conversationFile: string;
  todoStats: TodoStats;
};

// API request/response types
export type UploadStatsRequest = {
  hash: string;
  message: {
    AI?: AIMessage;
    User?: UserMessage;
  };
}[];

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
