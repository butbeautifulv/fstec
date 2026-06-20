-- CreateEnum
CREATE TYPE "ResponseReviewStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "responses" ADD COLUMN "review_status" "ResponseReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "reviewed_by_id" INTEGER,
ADD COLUMN "reviewed_at" TIMESTAMPTZ,
ADD COLUMN "review_note" TEXT;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill existing responses as accepted (pre-moderation workflow)
UPDATE "responses" SET "review_status" = 'ACCEPTED';
