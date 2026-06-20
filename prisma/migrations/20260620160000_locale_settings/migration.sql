-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'ru';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "locale" TEXT;
