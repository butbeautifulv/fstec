-- CreateTable
CREATE TABLE "app_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "head_organization_id" INTEGER,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Moscow',
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_head_organization_id_key" ON "app_settings"("head_organization_id");

-- AddForeignKey
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_head_organization_id_fkey" FOREIGN KEY ("head_organization_id") REFERENCES "organizations"("organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default row
INSERT INTO "app_settings" ("id", "timezone", "updated_at") VALUES (1, 'Europe/Moscow', NOW());
