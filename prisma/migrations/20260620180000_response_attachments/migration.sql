-- CreateTable
CREATE TABLE "response_attachments" (
    "id" SERIAL NOT NULL,
    "response_id" INTEGER,
    "order_item_id" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "response_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "response_attachments_storage_key_key" ON "response_attachments"("storage_key");

-- CreateIndex
CREATE INDEX "response_attachments_order_item_id_response_id_idx" ON "response_attachments"("order_item_id", "response_id");

-- AddForeignKey
ALTER TABLE "response_attachments" ADD CONSTRAINT "response_attachments_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "response_attachments" ADD CONSTRAINT "response_attachments_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
