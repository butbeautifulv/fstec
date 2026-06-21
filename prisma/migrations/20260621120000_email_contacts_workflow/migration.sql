-- CreateEnum
CREATE TYPE "MeasureImportSource" AS ENUM ('MANUAL', 'EMAIL');

-- CreateEnum
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "ContactRole" AS ENUM ('PRIMARY', 'RESPONSIBLE', 'NOTIFY');

-- AlterTable
ALTER TABLE "measure_imports" ADD COLUMN "uploaded_via" "MeasureImportSource" NOT NULL DEFAULT 'MANUAL';

-- CreateTable
CREATE TABLE "email_deliveries" (
    "id" SERIAL NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT,
    "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "related_type" TEXT,
    "related_id" INTEGER,
    "dedupe_key" TEXT,
    "sent_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_persons" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "subdivision_id" INTEGER,
    "full_name" TEXT NOT NULL,
    "position" TEXT,
    "email" TEXT NOT NULL,
    "role" "ContactRole" NOT NULL DEFAULT 'RESPONSIBLE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_persons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_deliveries_dedupe_key_key" ON "email_deliveries"("dedupe_key");

-- CreateIndex
CREATE INDEX "email_deliveries_related_type_related_id_idx" ON "email_deliveries"("related_type", "related_id");

-- CreateIndex
CREATE INDEX "email_deliveries_status_idx" ON "email_deliveries"("status");

-- CreateIndex
CREATE INDEX "contact_persons_organization_id_idx" ON "contact_persons"("organization_id");

-- CreateIndex
CREATE INDEX "contact_persons_subdivision_id_idx" ON "contact_persons"("subdivision_id");

-- CreateIndex
CREATE INDEX "contact_persons_email_idx" ON "contact_persons"("email");

-- AddForeignKey
ALTER TABLE "contact_persons" ADD CONSTRAINT "contact_persons_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_persons" ADD CONSTRAINT "contact_persons_subdivision_id_fkey" FOREIGN KEY ("subdivision_id") REFERENCES "subdivisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
