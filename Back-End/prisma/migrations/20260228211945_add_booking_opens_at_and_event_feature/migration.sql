-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "bookingOpensAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EventFeature" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "amountPaid" DECIMAL(12,2),
    "stripePaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventFeature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventFeature_eventId_idx" ON "EventFeature"("eventId");

-- CreateIndex
CREATE INDEX "EventFeature_endsAt_idx" ON "EventFeature"("endsAt");

-- AddForeignKey
ALTER TABLE "EventFeature" ADD CONSTRAINT "EventFeature_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
