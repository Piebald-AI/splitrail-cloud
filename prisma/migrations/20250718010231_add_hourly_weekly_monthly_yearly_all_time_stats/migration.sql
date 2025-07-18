/*
  Warnings:

  - You are about to drop the column `aiMessages` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `bashCommands` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `bytesEdited` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `bytesRead` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `bytesWritten` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `cachedTokens` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `codeLines` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `conversations` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `cost` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `dataLines` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `docsLines` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `filesEdited` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `filesRead` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `filesWritten` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `folder` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `globSearches` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `grepSearches` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `inputTokens` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `languagesData` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `linesAdded` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `linesDeleted` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `linesModified` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `linesRead` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `maxFlowLengthSeconds` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `modelsData` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `outputTokens` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `projectsData` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `rawData` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `todoReads` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `todoWrites` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `todosCompleted` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `todosCreated` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `todosInProgress` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `toolCalls` on the `user_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `userMessages` on the `user_daily_stats` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `user_daily_stats` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `periodEnd` to the `user_daily_stats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodStart` to the `user_daily_stats` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "user_daily_stats_userId_date_key";

-- AlterTable
ALTER TABLE "user_daily_stats" DROP COLUMN "aiMessages",
DROP COLUMN "bashCommands",
DROP COLUMN "bytesEdited",
DROP COLUMN "bytesRead",
DROP COLUMN "bytesWritten",
DROP COLUMN "cachedTokens",
DROP COLUMN "codeLines",
DROP COLUMN "conversations",
DROP COLUMN "cost",
DROP COLUMN "dataLines",
DROP COLUMN "date",
DROP COLUMN "docsLines",
DROP COLUMN "filesEdited",
DROP COLUMN "filesRead",
DROP COLUMN "filesWritten",
DROP COLUMN "folder",
DROP COLUMN "globSearches",
DROP COLUMN "grepSearches",
DROP COLUMN "inputTokens",
DROP COLUMN "languagesData",
DROP COLUMN "linesAdded",
DROP COLUMN "linesDeleted",
DROP COLUMN "linesModified",
DROP COLUMN "linesRead",
DROP COLUMN "maxFlowLengthSeconds",
DROP COLUMN "modelsData",
DROP COLUMN "outputTokens",
DROP COLUMN "projectsData",
DROP COLUMN "rawData",
DROP COLUMN "todoReads",
DROP COLUMN "todoWrites",
DROP COLUMN "todosCompleted",
DROP COLUMN "todosCreated",
DROP COLUMN "todosInProgress",
DROP COLUMN "toolCalls",
DROP COLUMN "userMessages",
ADD COLUMN     "periodEnd" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "periodStart" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "totalBytesEdited" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "totalBytesRead" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "totalBytesWritten" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "totalCacheCreationTokens" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "totalCacheReadTokens" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalFilesEdited" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalFilesRead" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalFilesWritten" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalGlobSearches" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalGrepSearches" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalInputTokens" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "totalLinesEdited" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "totalLinesRead" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "totalLinesWritten" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "totalMessagesSent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalOutputTokens" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "totalTerminalCommands" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalTodoReads" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalTodoWrites" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalTodosCompleted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalTodosCreated" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalTodosInProgress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalToolsCalled" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "user_hourly_stats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalToolsCalled" INTEGER NOT NULL DEFAULT 0,
    "totalMessagesSent" INTEGER NOT NULL DEFAULT 0,
    "totalInputTokens" BIGINT NOT NULL DEFAULT 0,
    "totalOutputTokens" BIGINT NOT NULL DEFAULT 0,
    "totalCacheCreationTokens" BIGINT NOT NULL DEFAULT 0,
    "totalCacheReadTokens" BIGINT NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFilesRead" INTEGER NOT NULL DEFAULT 0,
    "totalFilesEdited" INTEGER NOT NULL DEFAULT 0,
    "totalFilesWritten" INTEGER NOT NULL DEFAULT 0,
    "totalLinesRead" BIGINT NOT NULL DEFAULT 0,
    "totalLinesEdited" BIGINT NOT NULL DEFAULT 0,
    "totalLinesWritten" BIGINT NOT NULL DEFAULT 0,
    "totalBytesRead" BIGINT NOT NULL DEFAULT 0,
    "totalBytesEdited" BIGINT NOT NULL DEFAULT 0,
    "totalBytesWritten" BIGINT NOT NULL DEFAULT 0,
    "totalTerminalCommands" INTEGER NOT NULL DEFAULT 0,
    "totalGlobSearches" INTEGER NOT NULL DEFAULT 0,
    "totalGrepSearches" INTEGER NOT NULL DEFAULT 0,
    "totalTodosCreated" INTEGER NOT NULL DEFAULT 0,
    "totalTodosCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalTodosInProgress" INTEGER NOT NULL DEFAULT 0,
    "totalTodoWrites" INTEGER NOT NULL DEFAULT 0,
    "totalTodoReads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_hourly_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventDate" DATE NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "conversationFile" TEXT NOT NULL,
    "toolsUsed" INTEGER NOT NULL DEFAULT 0,
    "messagesCount" INTEGER NOT NULL DEFAULT 1,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheCreationTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheReadTokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "filesRead" INTEGER NOT NULL DEFAULT 0,
    "filesEdited" INTEGER NOT NULL DEFAULT 0,
    "filesWritten" INTEGER NOT NULL DEFAULT 0,
    "linesRead" BIGINT NOT NULL DEFAULT 0,
    "linesEdited" BIGINT NOT NULL DEFAULT 0,
    "linesWritten" BIGINT NOT NULL DEFAULT 0,
    "bytesRead" BIGINT NOT NULL DEFAULT 0,
    "bytesEdited" BIGINT NOT NULL DEFAULT 0,
    "bytesWritten" BIGINT NOT NULL DEFAULT 0,
    "terminalCommands" INTEGER NOT NULL DEFAULT 0,
    "globSearches" INTEGER NOT NULL DEFAULT 0,
    "grepSearches" INTEGER NOT NULL DEFAULT 0,
    "todosCreated" INTEGER NOT NULL DEFAULT 0,
    "todosCompleted" INTEGER NOT NULL DEFAULT 0,
    "todosInProgress" INTEGER NOT NULL DEFAULT 0,
    "todoWrites" INTEGER NOT NULL DEFAULT 0,
    "todoReads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_monthly_stats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalToolsCalled" INTEGER NOT NULL DEFAULT 0,
    "totalMessagesSent" INTEGER NOT NULL DEFAULT 0,
    "totalInputTokens" BIGINT NOT NULL DEFAULT 0,
    "totalOutputTokens" BIGINT NOT NULL DEFAULT 0,
    "totalCacheCreationTokens" BIGINT NOT NULL DEFAULT 0,
    "totalCacheReadTokens" BIGINT NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFilesRead" INTEGER NOT NULL DEFAULT 0,
    "totalFilesEdited" INTEGER NOT NULL DEFAULT 0,
    "totalFilesWritten" INTEGER NOT NULL DEFAULT 0,
    "totalLinesRead" BIGINT NOT NULL DEFAULT 0,
    "totalLinesEdited" BIGINT NOT NULL DEFAULT 0,
    "totalLinesWritten" BIGINT NOT NULL DEFAULT 0,
    "totalBytesRead" BIGINT NOT NULL DEFAULT 0,
    "totalBytesEdited" BIGINT NOT NULL DEFAULT 0,
    "totalBytesWritten" BIGINT NOT NULL DEFAULT 0,
    "totalTerminalCommands" INTEGER NOT NULL DEFAULT 0,
    "totalGlobSearches" INTEGER NOT NULL DEFAULT 0,
    "totalGrepSearches" INTEGER NOT NULL DEFAULT 0,
    "totalTodosCreated" INTEGER NOT NULL DEFAULT 0,
    "totalTodosCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalTodosInProgress" INTEGER NOT NULL DEFAULT 0,
    "totalTodoWrites" INTEGER NOT NULL DEFAULT 0,
    "totalTodoReads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_monthly_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_weekly_stats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalToolsCalled" INTEGER NOT NULL DEFAULT 0,
    "totalMessagesSent" INTEGER NOT NULL DEFAULT 0,
    "totalInputTokens" BIGINT NOT NULL DEFAULT 0,
    "totalOutputTokens" BIGINT NOT NULL DEFAULT 0,
    "totalCacheCreationTokens" BIGINT NOT NULL DEFAULT 0,
    "totalCacheReadTokens" BIGINT NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFilesRead" INTEGER NOT NULL DEFAULT 0,
    "totalFilesEdited" INTEGER NOT NULL DEFAULT 0,
    "totalFilesWritten" INTEGER NOT NULL DEFAULT 0,
    "totalLinesRead" BIGINT NOT NULL DEFAULT 0,
    "totalLinesEdited" BIGINT NOT NULL DEFAULT 0,
    "totalLinesWritten" BIGINT NOT NULL DEFAULT 0,
    "totalBytesRead" BIGINT NOT NULL DEFAULT 0,
    "totalBytesEdited" BIGINT NOT NULL DEFAULT 0,
    "totalBytesWritten" BIGINT NOT NULL DEFAULT 0,
    "totalTerminalCommands" INTEGER NOT NULL DEFAULT 0,
    "totalGlobSearches" INTEGER NOT NULL DEFAULT 0,
    "totalGrepSearches" INTEGER NOT NULL DEFAULT 0,
    "totalTodosCreated" INTEGER NOT NULL DEFAULT 0,
    "totalTodosCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalTodosInProgress" INTEGER NOT NULL DEFAULT 0,
    "totalTodoWrites" INTEGER NOT NULL DEFAULT 0,
    "totalTodoReads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_weekly_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_yearly_stats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalToolsCalled" INTEGER NOT NULL DEFAULT 0,
    "totalMessagesSent" INTEGER NOT NULL DEFAULT 0,
    "totalInputTokens" BIGINT NOT NULL DEFAULT 0,
    "totalOutputTokens" BIGINT NOT NULL DEFAULT 0,
    "totalCacheCreationTokens" BIGINT NOT NULL DEFAULT 0,
    "totalCacheReadTokens" BIGINT NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFilesRead" INTEGER NOT NULL DEFAULT 0,
    "totalFilesEdited" INTEGER NOT NULL DEFAULT 0,
    "totalFilesWritten" INTEGER NOT NULL DEFAULT 0,
    "totalLinesRead" BIGINT NOT NULL DEFAULT 0,
    "totalLinesEdited" BIGINT NOT NULL DEFAULT 0,
    "totalLinesWritten" BIGINT NOT NULL DEFAULT 0,
    "totalBytesRead" BIGINT NOT NULL DEFAULT 0,
    "totalBytesEdited" BIGINT NOT NULL DEFAULT 0,
    "totalBytesWritten" BIGINT NOT NULL DEFAULT 0,
    "totalTerminalCommands" INTEGER NOT NULL DEFAULT 0,
    "totalGlobSearches" INTEGER NOT NULL DEFAULT 0,
    "totalGrepSearches" INTEGER NOT NULL DEFAULT 0,
    "totalTodosCreated" INTEGER NOT NULL DEFAULT 0,
    "totalTodosCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalTodosInProgress" INTEGER NOT NULL DEFAULT 0,
    "totalTodoWrites" INTEGER NOT NULL DEFAULT 0,
    "totalTodoReads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_yearly_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_all_time_stats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalToolsCalled" INTEGER NOT NULL DEFAULT 0,
    "totalMessagesSent" INTEGER NOT NULL DEFAULT 0,
    "totalInputTokens" BIGINT NOT NULL DEFAULT 0,
    "totalOutputTokens" BIGINT NOT NULL DEFAULT 0,
    "totalCacheCreationTokens" BIGINT NOT NULL DEFAULT 0,
    "totalCacheReadTokens" BIGINT NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFilesRead" INTEGER NOT NULL DEFAULT 0,
    "totalFilesEdited" INTEGER NOT NULL DEFAULT 0,
    "totalFilesWritten" INTEGER NOT NULL DEFAULT 0,
    "totalLinesRead" BIGINT NOT NULL DEFAULT 0,
    "totalLinesEdited" BIGINT NOT NULL DEFAULT 0,
    "totalLinesWritten" BIGINT NOT NULL DEFAULT 0,
    "totalBytesRead" BIGINT NOT NULL DEFAULT 0,
    "totalBytesEdited" BIGINT NOT NULL DEFAULT 0,
    "totalBytesWritten" BIGINT NOT NULL DEFAULT 0,
    "totalTerminalCommands" INTEGER NOT NULL DEFAULT 0,
    "totalGlobSearches" INTEGER NOT NULL DEFAULT 0,
    "totalGrepSearches" INTEGER NOT NULL DEFAULT 0,
    "totalTodosCreated" INTEGER NOT NULL DEFAULT 0,
    "totalTodosCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalTodosInProgress" INTEGER NOT NULL DEFAULT 0,
    "totalTodoWrites" INTEGER NOT NULL DEFAULT 0,
    "totalTodoReads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_all_time_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_hourly_stats_userId_key" ON "user_hourly_stats"("userId");

-- CreateIndex
CREATE INDEX "user_events_eventDate_idx" ON "user_events"("eventDate");

-- CreateIndex
CREATE INDEX "user_events_userId_eventDate_idx" ON "user_events"("userId", "eventDate");

-- CreateIndex
CREATE INDEX "user_events_createdAt_idx" ON "user_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_monthly_stats_userId_key" ON "user_monthly_stats"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_weekly_stats_userId_key" ON "user_weekly_stats"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_yearly_stats_userId_key" ON "user_yearly_stats"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_all_time_stats_userId_key" ON "user_all_time_stats"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_daily_stats_userId_key" ON "user_daily_stats"("userId");

-- AddForeignKey
ALTER TABLE "user_hourly_stats" ADD CONSTRAINT "user_hourly_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_events" ADD CONSTRAINT "user_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_monthly_stats" ADD CONSTRAINT "user_monthly_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_weekly_stats" ADD CONSTRAINT "user_weekly_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_yearly_stats" ADD CONSTRAINT "user_yearly_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_all_time_stats" ADD CONSTRAINT "user_all_time_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
