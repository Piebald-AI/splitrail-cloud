/*
  Warnings:

  - You are about to drop the column `type` on the `message_stats` table. All the data in the column will be lost.
  - You are about to drop the column `aiMessages` on the `user_stats` table. All the data in the column will be lost.
  - Added the required column `role` to the `message_stats` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable - Add role column with temporary default, then update values
ALTER TABLE "message_stats" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';

-- Update existing data: AI -> assistant, User -> user
UPDATE "message_stats" SET "role" = 'assistant' WHERE "type" = 'AI';
UPDATE "message_stats" SET "role" = 'user' WHERE "type" = 'User';

-- Drop the old type column
ALTER TABLE "message_stats" DROP COLUMN "type";

-- Remove the temporary default
ALTER TABLE "message_stats" ALTER COLUMN "role" DROP DEFAULT;

-- AlterTable - Add assistantMessages column and migrate data
ALTER TABLE "user_stats" ADD COLUMN "assistantMessages" INTEGER NOT NULL DEFAULT 0;

-- Migrate existing aiMessages data to assistantMessages
UPDATE "user_stats" SET "assistantMessages" = "aiMessages";

-- Drop the old aiMessages column
ALTER TABLE "user_stats" DROP COLUMN "aiMessages";
