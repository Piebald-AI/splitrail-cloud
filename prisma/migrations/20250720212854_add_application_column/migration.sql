/*
  Warnings:

  - A unique constraint covering the columns `[userId,period,application]` on the table `user_stats` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "user_stats_userId_period_key";

-- AlterTable
ALTER TABLE "message_stats" ADD COLUMN     "application" TEXT NOT NULL DEFAULT 'claude_code';

-- AlterTable
ALTER TABLE "user_stats" ADD COLUMN     "application" TEXT NOT NULL DEFAULT 'claude_code';

-- CreateIndex
CREATE INDEX "message_stats_application_timestamp_idx" ON "message_stats"("application", "timestamp");

-- CreateIndex
CREATE INDEX "user_stats_application_period_idx" ON "user_stats"("application", "period");

-- CreateIndex
CREATE UNIQUE INDEX "user_stats_userId_period_application_key" ON "user_stats"("userId", "period", "application");
