/*
  Warnings:

  - You are about to drop the `user_daily_stats` table. If the table is not empty, all the data it contains will be lost.

*/

-- CreateTable
CREATE TABLE "message_stats" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "conversationFile" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "cacheCreationTokens" INTEGER,
    "cacheReadTokens" INTEGER,
    "cost" DOUBLE PRECISION,
    "model" TEXT,
    "toolCalls" INTEGER,
    "hash" TEXT,
    "fileTypes" JSONB,
    "terminalCommands" INTEGER,
    "fileSearches" INTEGER,
    "fileContentSearches" INTEGER,
    "filesRead" INTEGER,
    "filesAdded" INTEGER,
    "filesEdited" INTEGER,
    "filesDeleted" INTEGER,
    "linesRead" INTEGER,
    "linesEdited" INTEGER,
    "linesAdded" INTEGER,
    "linesDeleted" INTEGER,
    "bytesRead" INTEGER,
    "bytesAdded" INTEGER,
    "bytesEdited" INTEGER,
    "bytesDeleted" INTEGER,
    "codeLines" INTEGER,
    "docsLines" INTEGER,
    "dataLines" INTEGER,
    "mediaLines" INTEGER,
    "configLines" INTEGER,
    "otherLines" INTEGER,
    "todosCreated" INTEGER NOT NULL DEFAULT 0,
    "todosCompleted" INTEGER NOT NULL DEFAULT 0,
    "todosInProgress" INTEGER NOT NULL DEFAULT 0,
    "todoWrites" INTEGER NOT NULL DEFAULT 0,
    "todoReads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_stats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "toolCalls" INTEGER NOT NULL DEFAULT 0,
    "aiMessages" INTEGER NOT NULL DEFAULT 0,
    "userMessages" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheCreationTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheReadTokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "filesRead" INTEGER NOT NULL DEFAULT 0,
    "filesAdded" INTEGER NOT NULL DEFAULT 0,
    "filesEdited" INTEGER NOT NULL DEFAULT 0,
    "filesDeleted" INTEGER NOT NULL DEFAULT 0,
    "linesRead" INTEGER NOT NULL DEFAULT 0,
    "linesAdded" INTEGER NOT NULL DEFAULT 0,
    "linesEdited" INTEGER NOT NULL DEFAULT 0,
    "linesDeleted" INTEGER NOT NULL DEFAULT 0,
    "bytesRead" INTEGER NOT NULL DEFAULT 0,
    "bytesAdded" INTEGER NOT NULL DEFAULT 0,
    "bytesEdited" INTEGER NOT NULL DEFAULT 0,
    "bytesDeleted" INTEGER NOT NULL DEFAULT 0,
    "codeLines" INTEGER NOT NULL DEFAULT 0,
    "docsLines" INTEGER NOT NULL DEFAULT 0,
    "dataLines" INTEGER NOT NULL DEFAULT 0,
    "mediaLines" INTEGER NOT NULL DEFAULT 0,
    "configLines" INTEGER NOT NULL DEFAULT 0,
    "otherLines" INTEGER NOT NULL DEFAULT 0,
    "terminalCommands" INTEGER NOT NULL DEFAULT 0,
    "fileSearches" INTEGER NOT NULL DEFAULT 0,
    "fileContentSearches" INTEGER NOT NULL DEFAULT 0,
    "todosCreated" INTEGER NOT NULL DEFAULT 0,
    "todosCompleted" INTEGER NOT NULL DEFAULT 0,
    "todosInProgress" INTEGER NOT NULL DEFAULT 0,
    "todoWrites" INTEGER NOT NULL DEFAULT 0,
    "todoReads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_stats_userId_period_key" ON "user_stats"("userId", "period");

-- AddForeignKey
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate data from user_daily_stats to user_stats (aggregated as 'all-time')
INSERT INTO "user_stats" (
    "id",
    "userId", 
    "period",
    "periodStart",
    "periodEnd",
    "toolCalls",
    "aiMessages",
    "userMessages",
    "inputTokens",
    "outputTokens", 
    "cacheCreationTokens",
    "cacheReadTokens",
    "cost",
    "filesRead",
    "filesAdded",
    "filesEdited", 
    "filesDeleted",
    "linesRead",
    "linesAdded",
    "linesEdited",
    "linesDeleted",
    "bytesRead",
    "bytesAdded",
    "bytesEdited",
    "bytesDeleted",
    "codeLines",
    "docsLines", 
    "dataLines",
    "mediaLines",
    "configLines",
    "otherLines",
    "terminalCommands",
    "fileSearches", 
    "fileContentSearches",
    "todosCreated",
    "todosCompleted",
    "todosInProgress",
    "todoWrites",
    "todoReads",
    "createdAt",
    "updatedAt"
)
SELECT 
    gen_random_uuid() as "id",
    "userId",
    'all-time' as "period",
    NULL as "periodStart",
    NULL as "periodEnd", 
    COALESCE(SUM("toolCalls"), 0) as "toolCalls",
    COALESCE(SUM("aiMessages"), 0) as "aiMessages",
    COALESCE(SUM("userMessages"), 0) as "userMessages",
    COALESCE(SUM("inputTokens"), 0) as "inputTokens",
    COALESCE(SUM("outputTokens"), 0) as "outputTokens",
    0 as "cacheCreationTokens",
    COALESCE(SUM("cachedTokens"), 0) as "cacheReadTokens", 
    COALESCE(SUM("cost"), 0) as "cost",
    COALESCE(SUM("filesRead"), 0) as "filesRead",
    COALESCE(SUM("filesWritten"), 0) as "filesAdded",
    COALESCE(SUM("filesEdited"), 0) as "filesEdited",
    0 as "filesDeleted",
    COALESCE(SUM("linesRead"), 0) as "linesRead", 
    COALESCE(SUM("linesAdded"), 0) as "linesAdded",
    COALESCE(SUM("linesModified"), 0) as "linesEdited",
    COALESCE(SUM("linesDeleted"), 0) as "linesDeleted",
    COALESCE(SUM("bytesRead"), 0) as "bytesRead",
    COALESCE(SUM("bytesWritten"), 0) as "bytesAdded",
    COALESCE(SUM("bytesEdited"), 0) as "bytesEdited",
    0 as "bytesDeleted",
    COALESCE(SUM("codeLines"), 0) as "codeLines",
    COALESCE(SUM("docsLines"), 0) as "docsLines",
    COALESCE(SUM("dataLines"), 0) as "dataLines", 
    0 as "mediaLines",
    0 as "configLines",
    0 as "otherLines",
    COALESCE(SUM("bashCommands"), 0) as "terminalCommands",
    COALESCE(SUM("globSearches"), 0) as "fileSearches",
    COALESCE(SUM("grepSearches"), 0) as "fileContentSearches",
    COALESCE(SUM("todosCreated"), 0) as "todosCreated",
    COALESCE(SUM("todosCompleted"), 0) as "todosCompleted", 
    COALESCE(SUM("todosInProgress"), 0) as "todosInProgress",
    COALESCE(SUM("todoWrites"), 0) as "todoWrites",
    COALESCE(SUM("todoReads"), 0) as "todoReads",
    MIN("createdAt") as "createdAt",
    MAX("updatedAt") as "updatedAt"
FROM "user_daily_stats"
GROUP BY "userId";

-- DropForeignKey
ALTER TABLE "user_daily_stats" DROP CONSTRAINT "user_daily_stats_userId_fkey";

-- DropTable
DROP TABLE "user_daily_stats";

