-- AlterTable
ALTER TABLE "report_links" ADD COLUMN "organization_id" INTEGER,
ADD COLUMN "subdivision_id" INTEGER;

-- CreateIndex
CREATE INDEX "report_links_organization_id_subdivision_id_idx" ON "report_links"("organization_id", "subdivision_id");

-- AddForeignKey
ALTER TABLE "report_links" ADD CONSTRAINT "report_links_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_links" ADD CONSTRAINT "report_links_subdivision_id_fkey" FOREIGN KEY ("subdivision_id") REFERENCES "subdivisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
