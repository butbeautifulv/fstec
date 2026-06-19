-- Drop order-scoped access links (MVP/dev: no data migration)
DELETE FROM "access_links";

-- DropForeignKey
ALTER TABLE "access_links" DROP CONSTRAINT "access_links_order_id_fkey";

-- DropColumn
ALTER TABLE "access_links" DROP COLUMN "order_id";

-- AddColumn
ALTER TABLE "access_links" ADD COLUMN "organization_id" INTEGER NOT NULL;
ALTER TABLE "access_links" ADD COLUMN "subdivision_id" INTEGER;

-- AddForeignKey
ALTER TABLE "access_links" ADD CONSTRAINT "access_links_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_links" ADD CONSTRAINT "access_links_subdivision_id_fkey" FOREIGN KEY ("subdivision_id") REFERENCES "subdivisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
