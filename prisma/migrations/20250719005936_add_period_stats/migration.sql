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
    "filesRead" INTEGER,
    "filesEdited" INTEGER,
    "filesWritten" INTEGER,
    "fileTypes" JSONB,
    "terminalCommands" INTEGER,
    "globSearches" INTEGER,
    "grepSearches" INTEGER,
    "linesRead" INTEGER,
    "linesEdited" INTEGER,
    "linesWritten" INTEGER,
    "linesAdded" INTEGER,
    "linesDeleted" INTEGER,
    "linesModified" INTEGER,
    "codeLines" INTEGER,
    "docsLines" INTEGER,
    "dataLines" INTEGER,
    "bytesRead" INTEGER,
    "bytesEdited" INTEGER,
    "bytesWritten" INTEGER,
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
    "toolsCalled" INTEGER NOT NULL DEFAULT 0,
    "messagesSent" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheCreationTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheReadTokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "filesRead" INTEGER NOT NULL DEFAULT 0,
    "filesEdited" INTEGER NOT NULL DEFAULT 0,
    "filesWritten" INTEGER NOT NULL DEFAULT 0,
    "linesRead" INTEGER NOT NULL DEFAULT 0,
    "linesEdited" INTEGER NOT NULL DEFAULT 0,
    "linesWritten" INTEGER NOT NULL DEFAULT 0,
    "linesAdded" INTEGER NOT NULL DEFAULT 0,
    "linesDeleted" INTEGER NOT NULL DEFAULT 0,
    "linesModified" INTEGER NOT NULL DEFAULT 0,
    "codeLines" INTEGER NOT NULL DEFAULT 0,
    "docsLines" INTEGER NOT NULL DEFAULT 0,
    "dataLines" INTEGER NOT NULL DEFAULT 0,
    "bytesRead" INTEGER NOT NULL DEFAULT 0,
    "bytesEdited" INTEGER NOT NULL DEFAULT 0,
    "bytesWritten" INTEGER NOT NULL DEFAULT 0,
    "terminalCommands" INTEGER NOT NULL DEFAULT 0,
    "globSearches" INTEGER NOT NULL DEFAULT 0,
    "grepSearches" INTEGER NOT NULL DEFAULT 0,
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

-- Migrate data from user_daily_stats to user_stats with period = "all-time"
INSERT INTO "user_stats" (
    "id",
    "userId", 
    "period",
    "periodStart",
    "periodEnd",
    "toolsCalled",
    "messagesSent", 
    "inputTokens",
    "outputTokens",
    "cacheCreationTokens",
    "cacheReadTokens",
    "cost",
    "filesRead",
    "filesEdited", 
    "filesWritten",
    "linesRead",
    "linesEdited",
    "linesWritten",
    "linesAdded",
    "linesDeleted",
    "linesModified",
    "codeLines",
    "docsLines",
    "dataLines",
    "bytesRead",
    "bytesEdited",
    "bytesWritten", 
    "terminalCommands",
    "globSearches",
    "grepSearches",
    "todosCreated",
    "todosCompleted", 
    "todosInProgress",
    "todoWrites",
    "todoReads",
    "createdAt",
    "updatedAt"
)
SELECT 
    gen_random_uuid(),
    "userId",
    'all-time',
    NULL,
    NULL,
    COALESCE("toolCalls", 0),
    COALESCE("aiMessages" + "userMessages", 0),
    COALESCE("inputTokens", 0),
    COALESCE("outputTokens", 0),
    0, -- cacheCreationTokens (new field)
    COALESCE("cachedTokens", 0), -- map cachedTokens to cacheReadTokens
    COALESCE("cost", 0),
    COALESCE("filesRead", 0),
    COALESCE("filesEdited", 0),
    COALESCE("filesWritten", 0),
    COALESCE("linesRead", 0),
    0, -- linesEdited (not in old schema)
    0, -- linesWritten (not in old schema) 
    COALESCE("linesAdded", 0),
    COALESCE("linesDeleted", 0),
    COALESCE("linesModified", 0),
    COALESCE("codeLines", 0),
    COALESCE("docsLines", 0),
    COALESCE("dataLines", 0),
    COALESCE("bytesRead", 0),
    COALESCE("bytesEdited", 0),
    COALESCE("bytesWritten", 0),
    COALESCE("bashCommands", 0), -- map bashCommands to terminalCommands
    COALESCE("globSearches", 0),
    COALESCE("grepSearches", 0),
    COALESCE("todosCreated", 0),
    COALESCE("todosCompleted", 0),
    COALESCE("todosInProgress", 0),
    COALESCE("todoWrites", 0),
    COALESCE("todoReads", 0),
    "createdAt",
    "updatedAt"
FROM "user_daily_stats";

-- DropForeignKey
ALTER TABLE "user_daily_stats" DROP CONSTRAINT "user_daily_stats_userId_fkey";

-- DropTable
DROP TABLE "user_daily_stats";
