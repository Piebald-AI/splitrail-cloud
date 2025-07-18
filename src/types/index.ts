import { type User, type UserPreferences } from "@prisma/client";

export interface UserStats {
  cost: number;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  messagesSent: number;
  toolsCalled: number;
  filesRead: number;
  filesEdited: number;
  filesWritten: number;
  linesRead: number;
  linesEdited: number;
  linesWritten: number;
  linesAdded: number;
  linesDeleted: number;
  linesModified: number;
  bytesRead: number;
  bytesEdited: number;
  bytesWritten: number;
  terminalCommands: number;
  globSearches: number;
  grepSearches: number;
  todosCreated: number;
  todosCompleted: number;
  todosInProgress: number;
  todoWrites: number;
  todoReads: number;
}

// Extended types for API responses
export interface UserWithStats extends User, UserStats {
  id: string;
  displayName: string;
  email: string;
  createdAt: Date;
  rank: number;
  badge?: "gold" | "silver" | "bronze";
}

export interface UserWithPeriods extends UserWithStats {
  hourlyStats: UserStats;
  dailyStats: UserStats;
  weeklyStats: UserStats;
  monthlyStats: UserStats;
  yearlyStats: UserStats;
  allTimeStats: UserStats;
}

export interface LeaderboardData {
  users: UserWithStats[];
  total: number;
  currentPage: number;
  pageSize: number;
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
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  cost: number;
  model: string;
  timestamp: string;
  messageId: string | null;
  requestId: string | null;
  hasCostUsd: boolean;
  toolCalls: number;
  entryType: string | null;
  hash: string | null;
  isUserMessage: boolean;
  conversationFile: string;
  fileOperations: FileOperationStats;
  todoStats: TodoStats;
};

export type UserMessage = {
  timestamp: string;
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

// CLI data structure (mirrors Rust types)
export interface FileOperationStats {
  filesRead: number;
  filesEdited: number;
  filesWritten: number;
  linesRead: number;
  linesAdded: number;
  linesDeleted: number;
  linesModified: number;
  bytesRead: number;
  bytesEdited: number;
  bytesWritten: number;
  bashCommands: number;
  globSearches: number;
  grepSearches: number;
  sourceCodeLines: number;
  dataLines: number;
  documentationLines: number;
  mediaLines: number;
  configurationLines: number;
  otherLines: number;
}

export interface TodoStats {
  todosCreated: number;
  todosCompleted: number;
  todosInProgress: number;
  todoReads: number;
  todoWrites: number;
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

export interface UserProfileData extends User {
  preferences: UserPreferences | null;
  dailyStats: DailyStats[];
  aggregatedStats: {
    totalCost: number;
    totalTokens: number;
    totalLinesAdded: number;
    totalLinesDeleted: number;
    totalLinesModified: number;
    totalProjects: number;
    totalLanguages: number;
    totalCodeLines: number;
    totalDocsLines: number;
    totalDataLines: number;
    totalTodosCompleted: number;
    averageCostPerDay: number;
    averageTokensPerDay: number;
    averageLinesPerDay: number;
    streakDays: number;
    topProjects: Array<{
      name: string;
      percentage: number;
      lines: number;
      isAssociated?: boolean;
      description?: string;
      openSource?: boolean;
      githubLink?: string;
      websiteLink?: string;
    }>;
    topLanguages: Array<{ name: string; lines: number; files: number }>;
    topModels: Array<{ name: string; usage: number }>;
  };
}
