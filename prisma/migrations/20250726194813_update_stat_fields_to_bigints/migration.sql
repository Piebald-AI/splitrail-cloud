/*
  Warnings:

  - Made the column `inputTokens` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `outputTokens` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cacheCreationTokens` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cacheReadTokens` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cachedTokens` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `toolCalls` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `terminalCommands` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fileSearches` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fileContentSearches` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `filesRead` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `filesAdded` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `filesEdited` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `filesDeleted` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `linesRead` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `linesEdited` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `linesAdded` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `linesDeleted` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bytesRead` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bytesAdded` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bytesEdited` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bytesDeleted` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `codeLines` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `docsLines` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dataLines` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mediaLines` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `configLines` on table `message_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `otherLines` on table `message_stats` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "message_stats" ALTER COLUMN "inputTokens" SET NOT NULL,
ALTER COLUMN "inputTokens" SET DATA TYPE BIGINT,
ALTER COLUMN "outputTokens" SET NOT NULL,
ALTER COLUMN "outputTokens" SET DATA TYPE BIGINT,
ALTER COLUMN "cacheCreationTokens" SET NOT NULL,
ALTER COLUMN "cacheCreationTokens" SET DATA TYPE BIGINT,
ALTER COLUMN "cacheReadTokens" SET NOT NULL,
ALTER COLUMN "cacheReadTokens" SET DATA TYPE BIGINT,
ALTER COLUMN "cachedTokens" SET NOT NULL,
ALTER COLUMN "cachedTokens" SET DATA TYPE BIGINT,
ALTER COLUMN "toolCalls" SET NOT NULL,
ALTER COLUMN "toolCalls" SET DATA TYPE BIGINT,
ALTER COLUMN "terminalCommands" SET NOT NULL,
ALTER COLUMN "terminalCommands" SET DATA TYPE BIGINT,
ALTER COLUMN "fileSearches" SET NOT NULL,
ALTER COLUMN "fileSearches" SET DATA TYPE BIGINT,
ALTER COLUMN "fileContentSearches" SET NOT NULL,
ALTER COLUMN "fileContentSearches" SET DATA TYPE BIGINT,
ALTER COLUMN "filesRead" SET NOT NULL,
ALTER COLUMN "filesRead" SET DATA TYPE BIGINT,
ALTER COLUMN "filesAdded" SET NOT NULL,
ALTER COLUMN "filesAdded" SET DATA TYPE BIGINT,
ALTER COLUMN "filesEdited" SET NOT NULL,
ALTER COLUMN "filesEdited" SET DATA TYPE BIGINT,
ALTER COLUMN "filesDeleted" SET NOT NULL,
ALTER COLUMN "filesDeleted" SET DATA TYPE BIGINT,
ALTER COLUMN "linesRead" SET NOT NULL,
ALTER COLUMN "linesRead" SET DATA TYPE BIGINT,
ALTER COLUMN "linesEdited" SET NOT NULL,
ALTER COLUMN "linesEdited" SET DATA TYPE BIGINT,
ALTER COLUMN "linesAdded" SET NOT NULL,
ALTER COLUMN "linesAdded" SET DATA TYPE BIGINT,
ALTER COLUMN "linesDeleted" SET NOT NULL,
ALTER COLUMN "linesDeleted" SET DATA TYPE BIGINT,
ALTER COLUMN "bytesRead" SET NOT NULL,
ALTER COLUMN "bytesRead" SET DATA TYPE BIGINT,
ALTER COLUMN "bytesAdded" SET NOT NULL,
ALTER COLUMN "bytesAdded" SET DATA TYPE BIGINT,
ALTER COLUMN "bytesEdited" SET NOT NULL,
ALTER COLUMN "bytesEdited" SET DATA TYPE BIGINT,
ALTER COLUMN "bytesDeleted" SET NOT NULL,
ALTER COLUMN "bytesDeleted" SET DATA TYPE BIGINT,
ALTER COLUMN "codeLines" SET NOT NULL,
ALTER COLUMN "codeLines" SET DATA TYPE BIGINT,
ALTER COLUMN "docsLines" SET NOT NULL,
ALTER COLUMN "docsLines" SET DATA TYPE BIGINT,
ALTER COLUMN "dataLines" SET NOT NULL,
ALTER COLUMN "dataLines" SET DATA TYPE BIGINT,
ALTER COLUMN "mediaLines" SET NOT NULL,
ALTER COLUMN "mediaLines" SET DATA TYPE BIGINT,
ALTER COLUMN "configLines" SET NOT NULL,
ALTER COLUMN "configLines" SET DATA TYPE BIGINT,
ALTER COLUMN "otherLines" SET NOT NULL,
ALTER COLUMN "otherLines" SET DATA TYPE BIGINT,
ALTER COLUMN "todosCreated" SET DATA TYPE BIGINT,
ALTER COLUMN "todosCompleted" SET DATA TYPE BIGINT,
ALTER COLUMN "todosInProgress" SET DATA TYPE BIGINT,
ALTER COLUMN "todoWrites" SET DATA TYPE BIGINT,
ALTER COLUMN "todoReads" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "user_stats" ALTER COLUMN "toolCalls" SET DATA TYPE BIGINT,
ALTER COLUMN "userMessages" SET DATA TYPE BIGINT,
ALTER COLUMN "inputTokens" SET DATA TYPE BIGINT,
ALTER COLUMN "outputTokens" SET DATA TYPE BIGINT,
ALTER COLUMN "cacheCreationTokens" SET DATA TYPE BIGINT,
ALTER COLUMN "cacheReadTokens" SET DATA TYPE BIGINT,
ALTER COLUMN "cachedTokens" SET DATA TYPE BIGINT,
ALTER COLUMN "filesRead" SET DATA TYPE BIGINT,
ALTER COLUMN "filesAdded" SET DATA TYPE BIGINT,
ALTER COLUMN "filesEdited" SET DATA TYPE BIGINT,
ALTER COLUMN "filesDeleted" SET DATA TYPE BIGINT,
ALTER COLUMN "linesRead" SET DATA TYPE BIGINT,
ALTER COLUMN "linesAdded" SET DATA TYPE BIGINT,
ALTER COLUMN "linesEdited" SET DATA TYPE BIGINT,
ALTER COLUMN "linesDeleted" SET DATA TYPE BIGINT,
ALTER COLUMN "bytesRead" SET DATA TYPE BIGINT,
ALTER COLUMN "bytesAdded" SET DATA TYPE BIGINT,
ALTER COLUMN "bytesEdited" SET DATA TYPE BIGINT,
ALTER COLUMN "bytesDeleted" SET DATA TYPE BIGINT,
ALTER COLUMN "codeLines" SET DATA TYPE BIGINT,
ALTER COLUMN "docsLines" SET DATA TYPE BIGINT,
ALTER COLUMN "dataLines" SET DATA TYPE BIGINT,
ALTER COLUMN "mediaLines" SET DATA TYPE BIGINT,
ALTER COLUMN "configLines" SET DATA TYPE BIGINT,
ALTER COLUMN "otherLines" SET DATA TYPE BIGINT,
ALTER COLUMN "terminalCommands" SET DATA TYPE BIGINT,
ALTER COLUMN "fileSearches" SET DATA TYPE BIGINT,
ALTER COLUMN "fileContentSearches" SET DATA TYPE BIGINT,
ALTER COLUMN "todosCreated" SET DATA TYPE BIGINT,
ALTER COLUMN "todosCompleted" SET DATA TYPE BIGINT,
ALTER COLUMN "todosInProgress" SET DATA TYPE BIGINT,
ALTER COLUMN "todoWrites" SET DATA TYPE BIGINT,
ALTER COLUMN "todoReads" SET DATA TYPE BIGINT,
ALTER COLUMN "application" DROP DEFAULT,
ALTER COLUMN "assistantMessages" SET DATA TYPE BIGINT;
