-- CreateIndex
CREATE INDEX "order_items_subdivision_id_idx" ON "order_items"("subdivision_id");

-- CreateIndex
CREATE INDEX "orders_organization_id_idx" ON "orders"("organization_id");
