-- CreateEnum
CREATE TYPE "DiscussionPostType" AS ENUM ('QUESTION', 'DISCUSSION', 'POLL', 'RESOURCE');

-- CreateEnum
CREATE TYPE "DiscussionPostStatus" AS ENUM ('OPEN', 'ANSWERED', 'SOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DiscussionReportStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "DiscussionCommunity" (
    "id" TEXT NOT NULL,
    "tenantType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionCommunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionScope" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionPost" (
    "id" TEXT NOT NULL,
    "tenantType" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorRole" TEXT,
    "type" "DiscussionPostType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "scopeLabel" TEXT NOT NULL,
    "status" "DiscussionPostStatus" NOT NULL DEFAULT 'OPEN',
    "attachment" TEXT,
    "resourceUrl" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionTag" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "DiscussionTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionReply" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "parentReplyId" TEXT,
    "authorId" TEXT NOT NULL,
    "authorRole" TEXT,
    "content" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionReaction" (
    "id" TEXT NOT NULL,
    "tenantType" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "postId" TEXT,
    "replyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionBookmark" (
    "id" TEXT NOT NULL,
    "tenantType" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscussionBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionFollow" (
    "id" TEXT NOT NULL,
    "tenantType" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscussionFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionPoll" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "multiple" BOOLEAN NOT NULL DEFAULT false,
    "showResultsAfterVote" BOOLEAN NOT NULL DEFAULT true,
    "allowComments" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionPoll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionPollOption" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionPollOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionPollVote" (
    "id" TEXT NOT NULL,
    "tenantType" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscussionPollVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionReport" (
    "id" TEXT NOT NULL,
    "tenantType" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "replyId" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "DiscussionReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscussionCommunity_tenantType_idx" ON "DiscussionCommunity"("tenantType");

-- CreateIndex
CREATE INDEX "DiscussionScope_communityId_idx" ON "DiscussionScope"("communityId");

-- CreateIndex
CREATE INDEX "DiscussionPost_tenantType_idx" ON "DiscussionPost"("tenantType");

-- CreateIndex
CREATE INDEX "DiscussionPost_communityId_idx" ON "DiscussionPost"("communityId");

-- CreateIndex
CREATE INDEX "DiscussionPost_scopeId_idx" ON "DiscussionPost"("scopeId");

-- CreateIndex
CREATE INDEX "DiscussionPost_type_idx" ON "DiscussionPost"("type");

-- CreateIndex
CREATE INDEX "DiscussionPost_status_idx" ON "DiscussionPost"("status");

-- CreateIndex
CREATE INDEX "DiscussionPost_authorId_idx" ON "DiscussionPost"("authorId");

-- CreateIndex
CREATE INDEX "DiscussionPost_createdAt_idx" ON "DiscussionPost"("createdAt");

-- CreateIndex
CREATE INDEX "DiscussionTag_postId_idx" ON "DiscussionTag"("postId");

-- CreateIndex
CREATE INDEX "DiscussionTag_value_idx" ON "DiscussionTag"("value");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionTag_postId_value_key" ON "DiscussionTag"("postId", "value");

-- CreateIndex
CREATE INDEX "DiscussionReply_postId_idx" ON "DiscussionReply"("postId");

-- CreateIndex
CREATE INDEX "DiscussionReply_parentReplyId_idx" ON "DiscussionReply"("parentReplyId");

-- CreateIndex
CREATE INDEX "DiscussionReply_authorId_idx" ON "DiscussionReply"("authorId");

-- CreateIndex
CREATE INDEX "DiscussionReaction_postId_idx" ON "DiscussionReaction"("postId");

-- CreateIndex
CREATE INDEX "DiscussionReaction_replyId_idx" ON "DiscussionReaction"("replyId");

-- CreateIndex
CREATE INDEX "DiscussionReaction_userId_idx" ON "DiscussionReaction"("userId");

-- CreateIndex
CREATE INDEX "DiscussionBookmark_postId_idx" ON "DiscussionBookmark"("postId");

-- CreateIndex
CREATE INDEX "DiscussionBookmark_userId_idx" ON "DiscussionBookmark"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionBookmark_postId_userId_key" ON "DiscussionBookmark"("postId", "userId");

-- CreateIndex
CREATE INDEX "DiscussionFollow_postId_idx" ON "DiscussionFollow"("postId");

-- CreateIndex
CREATE INDEX "DiscussionFollow_userId_idx" ON "DiscussionFollow"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionFollow_postId_userId_key" ON "DiscussionFollow"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionPoll_postId_key" ON "DiscussionPoll"("postId");

-- CreateIndex
CREATE INDEX "DiscussionPollOption_pollId_idx" ON "DiscussionPollOption"("pollId");

-- CreateIndex
CREATE INDEX "DiscussionPollVote_pollId_idx" ON "DiscussionPollVote"("pollId");

-- CreateIndex
CREATE INDEX "DiscussionPollVote_optionId_idx" ON "DiscussionPollVote"("optionId");

-- CreateIndex
CREATE INDEX "DiscussionPollVote_userId_idx" ON "DiscussionPollVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionPollVote_pollId_optionId_userId_key" ON "DiscussionPollVote"("pollId", "optionId", "userId");

-- CreateIndex
CREATE INDEX "DiscussionReport_tenantType_idx" ON "DiscussionReport"("tenantType");

-- CreateIndex
CREATE INDEX "DiscussionReport_postId_idx" ON "DiscussionReport"("postId");

-- CreateIndex
CREATE INDEX "DiscussionReport_replyId_idx" ON "DiscussionReport"("replyId");

-- CreateIndex
CREATE INDEX "DiscussionReport_status_idx" ON "DiscussionReport"("status");

-- CreateIndex
CREATE INDEX "DiscussionReport_reportedBy_idx" ON "DiscussionReport"("reportedBy");

-- AddForeignKey
ALTER TABLE "DiscussionScope" ADD CONSTRAINT "DiscussionScope_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "DiscussionCommunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionPost" ADD CONSTRAINT "DiscussionPost_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "DiscussionCommunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionTag" ADD CONSTRAINT "DiscussionTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "DiscussionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionReply" ADD CONSTRAINT "DiscussionReply_postId_fkey" FOREIGN KEY ("postId") REFERENCES "DiscussionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionReply" ADD CONSTRAINT "DiscussionReply_parentReplyId_fkey" FOREIGN KEY ("parentReplyId") REFERENCES "DiscussionReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionReaction" ADD CONSTRAINT "DiscussionReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "DiscussionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionReaction" ADD CONSTRAINT "DiscussionReaction_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "DiscussionReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionBookmark" ADD CONSTRAINT "DiscussionBookmark_postId_fkey" FOREIGN KEY ("postId") REFERENCES "DiscussionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionFollow" ADD CONSTRAINT "DiscussionFollow_postId_fkey" FOREIGN KEY ("postId") REFERENCES "DiscussionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionPoll" ADD CONSTRAINT "DiscussionPoll_postId_fkey" FOREIGN KEY ("postId") REFERENCES "DiscussionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionPollOption" ADD CONSTRAINT "DiscussionPollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "DiscussionPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionPollVote" ADD CONSTRAINT "DiscussionPollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "DiscussionPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionPollVote" ADD CONSTRAINT "DiscussionPollVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "DiscussionPollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionReport" ADD CONSTRAINT "DiscussionReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "DiscussionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionReport" ADD CONSTRAINT "DiscussionReport_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "DiscussionReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;
