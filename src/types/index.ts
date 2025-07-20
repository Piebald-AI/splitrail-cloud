import { type User, type UserPreferences } from "@prisma/client";

// CLI data structure (mirrors Rust types)
export interface FileOperationStats {
  filesRead: number;
  filesAdded: number;
  filesEdited: number;
  filesDeleted: number;
  linesRead: number;
  linesAdded: number;
  linesEdited: number;
  linesDeleted: number;
  bytesRead: number;
  bytesEdited: number;
  bytesAdded: number;
  bytesDeleted: number;
  terminalCommands: number;
  fileSearches: number;
  fileContentSearches: number;
}

export interface CompositionStats {
  codeLines: number;
  docsLines: number;
  dataLines: number;
  mediaLines: number;
  configLines: number;
  otherLines: number;
}

export interface TodoStats {
  todosCreated: number;
  todosCompleted: number;
  todosInProgress: number;
  todoReads: number;
  todoWrites: number;
}

export interface GeneralStats {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  cost: number;
  toolCalls: number;
}

export type UserStats = FileOperationStats &
  CompositionStats &
  TodoStats &
  GeneralStats & {
    aiMessages: number;
    userMessages: number;
  };

export interface UserStatsWithPeriods extends UserStats {
  period: string;
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
  conversationFile: string;
  generalStats: GeneralStats;
  fileOperations: FileOperationStats;
  todoStats: TodoStats;
  compositionStats: CompositionStats;
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
