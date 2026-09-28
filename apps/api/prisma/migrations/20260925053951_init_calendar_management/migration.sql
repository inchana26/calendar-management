-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('SAVED', 'SCHEDULED', 'PUBLISHED', 'PAUSED', 'CLOSED');

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "location" TEXT,
    "priority" TEXT,
    "attachment" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'SAVED',
    "scheduledPublishAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventAudience" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "audienceId" TEXT NOT NULL,
    "audienceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventAudience_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Event_startDate_idx" ON "Event"("startDate");

-- CreateIndex
CREATE INDEX "Event_endDate_idx" ON "Event"("endDate");

-- CreateIndex
CREATE INDEX "Event_scheduledPublishAt_idx" ON "Event"("scheduledPublishAt");

-- CreateIndex
CREATE INDEX "Event_createdBy_idx" ON "Event"("createdBy");

-- CreateIndex
CREATE INDEX "EventAudience_eventId_idx" ON "EventAudience"("eventId");

-- CreateIndex
CREATE INDEX "EventAudience_audienceId_idx" ON "EventAudience"("audienceId");

-- CreateIndex
CREATE UNIQUE INDEX "EventAudience_eventId_audienceId_key" ON "EventAudience"("eventId", "audienceId");

-- AddForeignKey
ALTER TABLE "EventAudience" ADD CONSTRAINT "EventAudience_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
