import {
  type User,
  type DailyStats,
  type UserPreferences,
} from "@prisma/client";

// Extended types for API responses
export interface UserWithStats extends User {
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
  rank: number;
  badge?: "gold" | "silver" | "bronze";
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

// API request/response types
export interface UploadStatsRequest {
  date: string;
  folder?: string;
  stats: {
    cost: number;
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    userMessages: number;
    aiMessages: number;
    toolCalls: number;
    conversations: number;
    maxFlowLengthSeconds: number;
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
    todosCreated: number;
    todosCompleted: number;
    todosInProgress: number;
    todoReads: number;
    todoWrites: number;
    projectsData: ProjectStatsData;
    languagesData: LanguageData;
    modelsData: ModelData;
    codeLines: number;
    docsLines: number;
    dataLines: number;
  };
}

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

// Leaderboard sorting options
export type SortColumn =
  | "cost"
  | "tokens"
  | "linesAdded"
  | "linesDeleted"
  | "linesModified"
  | "projects"
  | "languages"
  | "codeLines"
  | "docsLines"
  | "dataLines"
  | "todosCompleted";

export type SortOrder = "asc" | "desc";

export interface LeaderboardFilters {
  sortBy: SortColumn;
  sortOrder: SortOrder;
  page: number;
  pageSize: number;
  timeRange?: "all" | "year" | "month" | "week" | "day";
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
export interface CLIFileOperationStats {
  files_read: number;
  files_edited: number;
  files_written: number;
  lines_read: number;
  lines_added: number;
  lines_deleted: number;
  lines_modified: number;
  bytes_read: number;
  bytes_edited: number;
  bytes_written: number;
  bash_commands: number;
  glob_searches: number;
  grep_searches: number;
  source_code_lines: number;
  data_lines: number;
  documentation_lines: number;
  media_lines: number;
  configuration_lines: number;
  other_lines: number;
}

export interface CLITodoStats {
  todos_created: number;
  todos_completed: number;
  todos_in_progress: number;
  todo_reads: number;
  todo_writes: number;
}

export interface CLIDailyStats {
  date: string;
  cost: number;
  cached_tokens: number;
  input_tokens: number;
  output_tokens: number;
  user_messages: number;
  ai_messages: number;
  tool_calls: number;
  conversations: number;
  models: Record<string, number>;
  file_operations: CLIFileOperationStats;
  todo_stats: CLITodoStats;
  max_flow_length_seconds: number;
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
