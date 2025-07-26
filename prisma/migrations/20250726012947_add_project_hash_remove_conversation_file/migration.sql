/*
  Warnings:

  - You are about to drop the column `conversationFile` on the `message_stats` table. All the data in the column will be lost.
  - You are about to drop the `accounts` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `projectHash` to the `message_stats` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_userId_fkey";

-- AlterTable
ALTER TABLE "message_stats" DROP COLUMN "conversationFile",
ADD COLUMN     "projectHash" TEXT NOT NULL;

-- DropTable
DROP TABLE "accounts";
