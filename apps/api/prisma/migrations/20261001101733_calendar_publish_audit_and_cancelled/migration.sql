-- AlterEnum
ALTER TYPE "EventStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "createdByRole" TEXT,
ADD COLUMN     "createdByTenantType" TEXT,
ADD COLUMN     "lastPublishedAudienceMode" TEXT,
ADD COLUMN     "lastPublishedBy" TEXT,
ADD COLUMN     "lastPublishedByRole" TEXT,
ADD COLUMN     "lastPublishedByTenantType" TEXT;

-- AlterTable
ALTER TABLE "EventAudience" ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "publishedBy" TEXT,
ADD COLUMN     "publishedByRole" TEXT,
ADD COLUMN     "publishedByTenantType" TEXT;

-- CreateIndex
CREATE INDEX "Event_lastPublishedBy_idx" ON "Event"("lastPublishedBy");

-- CreateIndex
CREATE INDEX "EventAudience_publishedBy_idx" ON "EventAudience"("publishedBy");
