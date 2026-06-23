-- AlterTable
ALTER TABLE "measure_imports" ADD COLUMN "needs_appendix" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "measure_import_items" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
