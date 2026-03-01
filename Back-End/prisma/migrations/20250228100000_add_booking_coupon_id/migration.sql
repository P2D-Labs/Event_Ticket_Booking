-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "couponId" TEXT;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Booking_couponId_idx" ON "Booking"("couponId");
