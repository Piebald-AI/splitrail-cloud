import { type User } from "@prisma/client";

// ===== Core Constants =====

export const Applications = [
  "claude_code",
  "codex_cli",
  "gemini_cli",
  "qwen_code",
  "cline",
  "roo_code",
  "kilo_code",
  "kilo_cli",
  "copilot",
  "open_code",
  "pi_agent",
  "piebald",
] as const;
export const Periods = [
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
] as const;

export type ApplicationType = (typeof Applications)[number];
export type PeriodType = (typeof Periods)[number];

// ===== Stat Keys =====

export const BigIntStatKeys = [
  // File operations
  "filesRead",
  "filesAdded",
  "filesEdited",
  "filesDeleted",
  // Line operations
  "linesRead",
  "linesAdded",
  "linesEdited",
  "linesDeleted",
  // Byte operations
  "bytesRead",
  "bytesEdited",
  "bytesAdded",
  "bytesDeleted",
  // Tool usage
  "terminalCommands",
  "fileSearches",
  "fileContentSearches",
  "toolCalls",
  // Content categorization
  "codeLines",
  "docsLines",
  "dataLines",
  "mediaLines",
  "configLines",
  "otherLines",
  // Todo tracking
  "todosCreated",
  "todosCompleted",
  "todosInProgress",
  "todoReads",
  "todoWrites",
  // Token usage
  "inputTokens",
  "outputTokens",
  "cacheCreationTokens",
  "cacheReadTokens",
  "cachedTokens",
  "reasoningTokens",
  "tokens", // Calculated field (not stored in DB)
  // Message counts
  "assistantMessages",
  "userMessages",
] as const;

export const FloatStatKeys = ["cost"] as const;

export const StatKeys = [...BigIntStatKeys, ...FloatStatKeys] as const;
export const DbStatKeys = StatKeys.filter((key) => key !== "tokens");

// ===== Core Types =====

export interface Stats {
  // All bigint fields from database
  filesRead: bigint;
  filesAdded: bigint;
  filesEdited: bigint;
  filesDeleted: bigint;
  linesRead: bigint;
  linesAdded: bigint;
  linesEdited: bigint;
  linesDeleted: bigint;
  bytesRead: bigint;
  bytesEdited: bigint;
  bytesAdded: bigint;
  bytesDeleted: bigint;
  terminalCommands: bigint;
  fileSearches: bigint;
  fileContentSearches: bigint;
  toolCalls: bigint;
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
  inputTokens: bigint;
  outputTokens: bigint;
  cacheCreationTokens: bigint;
  cacheReadTokens: bigint;
  cachedTokens: bigint;
  reasoningTokens: bigint;
  tokens: bigint;
  assistantMessages: bigint;
  userMessages: bigint;
  // Float field
  cost: number;
}

// Stats as numbers (for API responses after n() conversion)
export interface StatsAsNumbers {
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
  toolCalls: number;
  codeLines: number;
  docsLines: number;
  dataLines: number;
  mediaLines: number;
  configLines: number;
  otherLines: number;
  todosCreated: number;
  todosCompleted: number;
  todosInProgress: number;
  todoReads: number;
  todoWrites: number;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  cachedTokens: number;
  reasoningTokens: number;
  tokens: number;
  assistantMessages: number;
  userMessages: number;
  cost: number;
}

// ===== User Types =====

export interface UserWithStats extends User, StatsAsNumbers {
  rank: number;
}

export interface UserPreferences {
  currency: string;
  timezone: string | null;
  publicProfile: boolean;
}

// ===== Message Stats =====

export interface ConversationMessage {
  role: "user" | "assistant";
  model: string | null;
  date: string;
  globalHash: string;
  projectHash: string;
  conversationHash: string;
  localHash: string | null;
  uuid: string | null;
  sessionName: string | null;
  application: ApplicationType;
  stats: Stats;
}

// ===== API Types =====

export interface LeaderboardRequest {
  period?: PeriodType;
  applications?: ApplicationType[];
  page?: number;
  pageSize?: number;
  sortBy?: keyof StatsAsNumbers;
  sortOrder?: "asc" | "desc";
}

export interface LeaderboardData {
  users: UserWithStats[];
  total: number;
  currentPage: number;
  pageSize: number;
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

// ===== Project Types =====

export interface Project {
  id: string;
  name: string;
  description?: string;
  openSource: boolean;
  githubLink?: string;
  websiteLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FolderProject {
  id: string;
  userId: string;
  folder: string;
  projectId: string;
  project?: Project;
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

// ===== Analytics Types =====

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

export interface ChartData {
  date: string;
  cost: number;
  tokens: number;
  lines: number;
  [key: string]: unknown;
}
