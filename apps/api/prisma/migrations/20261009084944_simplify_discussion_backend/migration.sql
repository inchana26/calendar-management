/*
  Warnings:

  - You are about to drop the column `optionId` on the `DiscussionPollVote` table. All the data in the column will be lost.
  - You are about to drop the column `pollId` on the `DiscussionPollVote` table. All the data in the column will be lost.
  - You are about to drop the `DiscussionCommunity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DiscussionPoll` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DiscussionPollOption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DiscussionScope` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DiscussionTag` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[postId,optionIndex,userId]` on the table `DiscussionPollVote` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `optionIndex` to the `DiscussionPollVote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postId` to the `DiscussionPollVote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `communityName` to the `DiscussionPost` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DiscussionPoll" DROP CONSTRAINT "DiscussionPoll_postId_fkey";

-- DropForeignKey
ALTER TABLE "DiscussionPollOption" DROP CONSTRAINT "DiscussionPollOption_pollId_fkey";

-- DropForeignKey
ALTER TABLE "DiscussionPollVote" DROP CONSTRAINT "DiscussionPollVote_optionId_fkey";

-- DropForeignKey
ALTER TABLE "DiscussionPollVote" DROP CONSTRAINT "DiscussionPollVote_pollId_fkey";

-- DropForeignKey
ALTER TABLE "DiscussionPost" DROP CONSTRAINT "DiscussionPost_communityId_fkey";

-- DropForeignKey
ALTER TABLE "DiscussionScope" DROP CONSTRAINT "DiscussionScope_communityId_fkey";

-- DropForeignKey
ALTER TABLE "DiscussionTag" DROP CONSTRAINT "DiscussionTag_postId_fkey";

-- DropIndex
DROP INDEX "DiscussionBookmark_postId_idx";

-- DropIndex
DROP INDEX "DiscussionFollow_postId_idx";

-- DropIndex
DROP INDEX "DiscussionPollVote_optionId_idx";

-- DropIndex
DROP INDEX "DiscussionPollVote_pollId_idx";

-- DropIndex
DROP INDEX "DiscussionPollVote_pollId_optionId_userId_key";

-- AlterTable
ALTER TABLE "DiscussionPollVote" DROP COLUMN "optionId",
DROP COLUMN "pollId",
ADD COLUMN     "optionIndex" INTEGER NOT NULL,
ADD COLUMN     "postId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DiscussionPost" ADD COLUMN     "communityName" TEXT NOT NULL,
ADD COLUMN     "pollAllowComments" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pollMultiple" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pollOptions" JSONB,
ADD COLUMN     "pollShowResults" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- DropTable
DROP TABLE "DiscussionCommunity";

-- DropTable
DROP TABLE "DiscussionPoll";

-- DropTable
DROP TABLE "DiscussionPollOption";

-- DropTable
DROP TABLE "DiscussionScope";

-- DropTable
DROP TABLE "DiscussionTag";

-- CreateIndex
CREATE INDEX "DiscussionPollVote_postId_idx" ON "DiscussionPollVote"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionPollVote_postId_optionIndex_userId_key" ON "DiscussionPollVote"("postId", "optionIndex", "userId");

-- AddForeignKey
ALTER TABLE "DiscussionPollVote" ADD CONSTRAINT "DiscussionPollVote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "DiscussionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
