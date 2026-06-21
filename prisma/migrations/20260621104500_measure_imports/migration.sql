-- CreateEnum
CREATE TYPE "MeasureImportStatus" AS ENUM ('UPLOADED', 'PARSED', 'IMPORTED', 'FAILED');

-- CreateEnum
CREATE TYPE "MeasureImportKind" AS ENUM ('LETTER', 'APPENDIX');

-- AlterTable
ALTER TABLE "measures" ADD COLUMN "source_import_id" INTEGER,
ADD COLUMN "source_import_item_id" INTEGER;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "source_import_id" INTEGER;

-- CreateTable
CREATE TABLE "measure_imports" (
    "id" SERIAL NOT NULL,
    "kind" "MeasureImportKind" NOT NULL,
    "status" "MeasureImportStatus" NOT NULL DEFAULT 'UPLOADED',
    "document_number" TEXT,
    "title" TEXT,
    "report_due_at" TIMESTAMPTZ,
    "storage_key" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "sha256" TEXT,
    "parent_import_id" INTEGER,
    "uploaded_by_id" INTEGER NOT NULL,
    "imported_at" TIMESTAMPTZ,
    "parse_error" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "measure_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measure_import_items" (
    "id" SERIAL NOT NULL,
    "import_id" INTEGER NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "measure_id" INTEGER,

    CONSTRAINT "measure_import_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "measure_imports_storage_key_key" ON "measure_imports"("storage_key");

-- CreateIndex
CREATE INDEX "measure_imports_status_idx" ON "measure_imports"("status");

-- CreateIndex
CREATE INDEX "measure_imports_parent_import_id_idx" ON "measure_imports"("parent_import_id");

-- CreateIndex
CREATE INDEX "measure_import_items_import_id_idx" ON "measure_import_items"("import_id");

-- CreateIndex
CREATE INDEX "measures_code_idx" ON "measures"("code");

-- CreateIndex
CREATE UNIQUE INDEX "measures_source_import_item_id_key" ON "measures"("source_import_item_id");

-- CreateIndex
CREATE INDEX "orders_source_import_id_idx" ON "orders"("source_import_id");

-- AddForeignKey
ALTER TABLE "measures" ADD CONSTRAINT "measures_source_import_id_fkey" FOREIGN KEY ("source_import_id") REFERENCES "measure_imports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measures" ADD CONSTRAINT "measures_source_import_item_id_fkey" FOREIGN KEY ("source_import_item_id") REFERENCES "measure_import_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_source_import_id_fkey" FOREIGN KEY ("source_import_id") REFERENCES "measure_imports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measure_imports" ADD CONSTRAINT "measure_imports_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measure_imports" ADD CONSTRAINT "measure_imports_parent_import_id_fkey" FOREIGN KEY ("parent_import_id") REFERENCES "measure_imports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measure_import_items" ADD CONSTRAINT "measure_import_items_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "measure_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
