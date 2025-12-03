-- DropIndex
DROP INDEX "user_stats_userId_period_application_key";

-- AlterTable
ALTER TABLE "user_stats" ALTER COLUMN "periodStart" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "user_stats_userId_period_application_periodStart_key" ON "user_stats"("userId", "period", "application", "periodStart");
